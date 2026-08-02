// World Bank v2 API client.
//
// Every trap in docs/superpowers/specs/2026-08-02-country-explorer-design.md
// §3.6 is handled here:
// - `source=2` is mandatory on every multi-indicator call.
// - Batch at 25 indicators per call (40 works, 60 is rejected).
// - `mrnev=1` gets the latest value per country, but it is HTTP 400 with
//   `country/all` — that combination must use `mrv=1` instead.
// - `per_page` must always be set explicitly; the default of 50 silently
//   truncates.
// - Use `res.json()`, never `JSON.parse(await res.text())` — the response
//   carries a UTF-8 BOM that breaks manual parsing.
// - Retry with exponential backoff + jitter, treating HTTP 400 as retryable.
//   The API throws random 400s under throttling even on valid URLs.
// - Filter `region.value !== "Aggregates"` — 78 of 295 "countries" are
//   aggregates like "World" and "Euro area".
//
// Fixed 2026-08-02: a cold dossier used to fire ~150 separate requests (one
// `country/all/indicator/{code}` per indicator, from rankings.ts) and the
// World Bank throttled roughly 2 of every 3 of them. Two changes fix that:
// `fetchIndicatorsAllCountries` below batches many indicator codes into one
// `country/all` call the same way `country/{iso3}` already batched them, and
// every request in this file now goes through a small semaphore so at most
// `MAX_CONCURRENT` are ever in flight at once, however many batches a caller
// fires at the same time.
import type { IndicatorValue, SourceResult, TimeSeries } from "../types";

const BASE = "https://api.worldbank.org/v2";
const BATCH_SIZE = 25;
const REVALIDATE_WEEK = 604800;
const MAX_CONCURRENT = 4;

/**
 * Batch size for `fetchIndicatorsAllCountries`. Kept small on purpose — see
 * `RANKING_LOOKBACK_YEARS` below for why this fetches a date *range* rather
 * than `mrv`, and a multi-year range multiplies row count (and so response
 * size) by roughly the number of years, not just the number of indicators.
 * Confirmed live 2026-08-03: 3 indicators x ~295 countries x the 10-year
 * range below runs ~1.8MB, comfortably under Next's 2MB fetch-cache write
 * limit; 4 indicators over the same range was already measured at ~2.5MB
 * (over it) in testing. Re-measure before raising this.
 */
const RANKING_BATCH_SIZE = 3;

/**
 * Fixed 2026-08-03: `mrv=N` on a *batched*, multi-indicator `country/all`
 * call does not pick each indicator's own N most recent periods — it was
 * observed live to return zero rows for any indicator whose real data
 * stopped 2019-2022 when batched alongside indicators still reporting
 * through 2024-2025 (13 of 150 codes, confirmed via
 * `/private/tmp/.../scratchpad/confirm-mrv-bug.mjs`: `mrv=3` gave those 13
 * codes 0 countries each, while an explicit date range recovered 84-229
 * countries for the same codes in the same request). `mrv`'s window appears
 * to be resolved once for the whole batched request, not per indicator, so
 * a laggard sharing a batch with fresher codes gets filtered out entirely —
 * bumping `mrv` (3 was itself a fix for an earlier, narrower version of this
 * same problem) only shifts which laggards fall outside the window, it
 * doesn't fix the mechanism.
 *
 * The real fix, matching what `fetchLatestIndicators`/`fetchTimeSeries`
 * already do for the single-country case: fetch an explicit date range and
 * reduce to each country's own latest non-null value in code (see the
 * reduction logic in `fetchIndicatorsAllCountries` below, unchanged) rather
 * than trusting the API's own "most recent" heuristic on a multi-indicator
 * request. 10 years reaches back to the oldest laggard seen (2019, against
 * a "current year" of 2026) with margin; if a future indicator lags more
 * than this, it will again show 0 countries and this constant is the first
 * place to check.
 */
const RANKING_LOOKBACK_YEARS = 10;

/**
 * Caps how many World Bank requests are in flight at once, across every
 * function in this file and every caller — so firing 6 ranking batches or a
 * 6-batch dossier fetch never turns into 6+ simultaneous connections that
 * the API throttles.
 */
class Semaphore {
  private free: number;
  private queue: Array<() => void> = [];

  constructor(concurrency: number) {
    this.free = concurrency;
  }

  async acquire(): Promise<() => void> {
    if (this.free > 0) {
      this.free--;
      return () => this.release();
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
    this.free--;
    return () => this.release();
  }

  private release(): void {
    this.free++;
    const next = this.queue.shift();
    if (next) next();
  }
}

const requestGate = new Semaphore(MAX_CONCURRENT);

interface WorldBankMeta {
  page: number;
  pages: number;
  per_page: number | string;
  total: number;
  sourceid?: string | null;
  lastupdated?: string;
}

interface WorldBankRow {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit?: string;
  obs_status?: string;
  decimal?: number;
}

type WorldBankResponse = [WorldBankMeta, WorldBankRow[] | null];

export interface WorldBankCountryListEntry {
  iso3: string;
  iso2: string;
  name: string;
  isAggregate: boolean;
  region: string;
}

function chunk<T>(arr: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a World Bank URL, retrying on network errors, non-2xx and even a
 * 400 — the API returns spurious 400s on perfectly valid URLs when it is
 * throttling, so a 400 is not treated as a permanent "bad request" here.
 *
 * Every attempt first waits its turn at `requestGate` so this file never has
 * more than `MAX_CONCURRENT` requests in flight, no matter how many batches
 * a caller (rankings.ts fetching ~150 indicators, dossier.ts fetching one
 * country) fires at once.
 */
async function fetchWorldBank(
  url: string,
  revalidate: number,
  attempts = 5
): Promise<WorldBankResponse> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const release = await requestGate.acquire();
    try {
      const res = await fetch(url, { next: { revalidate } });
      if (!res.ok) {
        lastError = new Error(`World Bank HTTP ${res.status} for ${url}`);
      } else {
        // res.json() copes with the UTF-8 BOM the API sends; JSON.parse on
        // raw text does not.
        const body = (await res.json()) as WorldBankResponse | { message: unknown };
        if (Array.isArray(body)) {
          return body;
        }
        lastError = new Error(
          `World Bank error payload: ${JSON.stringify(body).slice(0, 200)}`
        );
      }
    } catch (err) {
      lastError = err;
    } finally {
      // Release before the backoff sleep, not after — a slot sitting idle
      // during our own backoff is a slot another batch could be using.
      release();
    }
    if (attempt < attempts - 1) {
      // Confirmed live 2026-08-02: sub-second backoff was not enough during
      // a throttled window — mrnev=1 calls kept 400ing for 10+ seconds
      // straight before succeeding. Start at 3s, double each time, cap at
      // 30s, and add up to 1.5s of jitter so retries from parallel batches
      // don't all land on the same instant.
      const backoff = Math.min(3000 * 2 ** attempt, 30000);
      await sleep(backoff + Math.random() * 1500);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function rowsFromResponse(resp: WorldBankResponse): WorldBankRow[] {
  const [, rows] = resp;
  return rows ?? [];
}

/**
 * Run several batch fetches with allSettled, not all: one bad/throttled
 * batch of 25 indicators must not blank out the other ~125 that succeeded.
 * A dropped batch just means those indicators show "no data" for this
 * country, which is the correct degrade — never throwing the whole call.
 */
async function fetchBatchesSettled(
  urls: readonly string[]
): Promise<WorldBankResponse[]> {
  const settled = await Promise.allSettled(
    urls.map((url) => fetchWorldBank(url, REVALIDATE_WEEK))
  );
  const results: WorldBankResponse[] = [];
  for (const s of settled) {
    if (s.status === "fulfilled") results.push(s.value);
    // A rejected batch is silently dropped — its indicators just have no
    // data for this call rather than failing every other batch's data too.
  }
  return results;
}

function metaFromResponse(resp: WorldBankResponse): WorldBankMeta {
  return resp[0];
}

/** Fetch the mrnev=1 (most recent non-empty value) row for each code, one country. */
export async function fetchLatestIndicators(
  iso3: string,
  codes: readonly string[]
): Promise<SourceResult<{ indicators: IndicatorValue[]; lastUpdated: string | null }>> {
  try {
    const batches = chunk(codes, BATCH_SIZE);
    const urls = batches.map(
      (batch) =>
        `${BASE}/country/${encodeURIComponent(iso3)}/indicator/${batch.join(";")}` +
        `?source=2&format=json&mrnev=1&per_page=200`
    );
    const results = await fetchBatchesSettled(urls);
    if (results.length === 0 && urls.length > 0) {
      return { ok: false, reason: `All ${urls.length} World Bank batch(es) failed for ${iso3}` };
    }

    const indicators: IndicatorValue[] = [];
    let lastUpdated: string | null = null;
    for (const resp of results) {
      const meta = metaFromResponse(resp);
      if (meta.lastupdated && !lastUpdated) lastUpdated = meta.lastupdated;
      for (const row of rowsFromResponse(resp)) {
        indicators.push({
          code: row.indicator.id,
          value: row.value,
          year: row.date ?? null,
          unit: row.unit ?? "",
          rank: null,
          outOf: null,
          worldAverage: null,
          percentile: null,
        });
      }
    }
    return { ok: true, data: { indicators, lastUpdated } };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

/** Fetch full 1960->now history for a small set of charted indicators, one country. */
export async function fetchTimeSeries(
  iso3: string,
  codes: readonly string[],
  from = 1960,
  to = new Date().getFullYear()
): Promise<SourceResult<TimeSeries[]>> {
  try {
    const batches = chunk(codes, BATCH_SIZE);
    const urls = batches.map(
      (batch) =>
        `${BASE}/country/${encodeURIComponent(iso3)}/indicator/${batch.join(";")}` +
        `?source=2&format=json&date=${from}:${to}&per_page=1000`
    );
    const results = await fetchBatchesSettled(urls);
    if (results.length === 0 && urls.length > 0) {
      return { ok: false, reason: `All ${urls.length} World Bank batch(es) failed for ${iso3}` };
    }

    const byCode = new Map<string, TimeSeries>();
    for (const resp of results) {
      for (const row of rowsFromResponse(resp)) {
        let series = byCode.get(row.indicator.id);
        if (!series) {
          series = { code: row.indicator.id, unit: row.unit ?? "", points: [] };
          byCode.set(row.indicator.id, series);
        }
        series.points.push({ year: row.date, value: row.value });
      }
    }
    // World Bank returns newest-first; charts want oldest-first.
    const seriesList = Array.from(byCode.values());
    for (const series of seriesList) {
      series.points.sort(
        (a, b) => Number(a.year) - Number(b.year)
      );
    }
    return { ok: true, data: seriesList };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Fetch one indicator for every country (for rankings / choropleth). Uses
 * `mrv=1` because `mrnev=1` is HTTP 400 on `country/all`.
 */
export async function fetchAllCountries(
  code: string
): Promise<
  SourceResult<{
    rows: { iso3: string; name: string; value: number | null; year: string | null }[];
    lastUpdated: string | null;
  }>
> {
  try {
    const url = `${BASE}/country/all/indicator/${encodeURIComponent(
      code
    )}?source=2&format=json&mrv=1&per_page=400`;
    const resp = await fetchWorldBank(url, REVALIDATE_WEEK);
    const meta = metaFromResponse(resp);
    const rows = rowsFromResponse(resp)
      .filter((row) => (row.country as { value: string }).value !== "Aggregates")
      .map((row) => ({
        iso3: row.countryiso3code,
        name: row.country.value,
        value: row.value,
        year: row.date ?? null,
      }));
    return { ok: true, data: { rows, lastUpdated: meta.lastupdated ?? null } };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Fetch a `RANKING_LOOKBACK_YEARS`-wide date range for many indicators,
 * every country, in one batched call per `RANKING_BATCH_SIZE` codes — the
 * `country/all` equivalent of what `fetchTimeSeries` already does for a
 * single country. This is what lets rankings.ts fetch all ~150 indicators'
 * rankings in ~50 requests instead of ~150 one-indicator-at-a-time
 * `fetchAllCountries` calls.
 *
 * An explicit date range (not `mrv`, see `RANKING_LOOKBACK_YEARS`'s doc
 * comment for why) returns every period in that range per country per
 * indicator, so this reduces each country down to its own single latest
 * non-null value before returning — a country that reported several years
 * ago and a country that reported this year both end up with exactly one
 * row, dated honestly to whichever year that row is from. A country with no
 * non-null value anywhere in the window keeps one null row, so callers can
 * still tell "no data" apart from "not in the list".
 *
 * Batches run through `fetchBatchesSettled`, so one throttled batch of
 * `RANKING_BATCH_SIZE` indicators just means those codes come back with no
 * ranking data — never a thrown error for the rest.
 */
export async function fetchIndicatorsAllCountries(
  codes: readonly string[]
): Promise<
  SourceResult<
    Map<
      string,
      { rows: { iso3: string; name: string; value: number | null; year: string | null }[]; lastUpdated: string | null }
    >
  >
> {
  try {
    const batches = chunk(codes, RANKING_BATCH_SIZE);
    const toYear = new Date().getFullYear();
    const fromYear = toYear - RANKING_LOOKBACK_YEARS;
    const urls = batches.map(
      (batch) =>
        `${BASE}/country/all/indicator/${batch.map(encodeURIComponent).join(";")}` +
        `?source=2&format=json&date=${fromYear}:${toYear}&per_page=20000`
    );
    const results = await fetchBatchesSettled(urls);
    if (results.length === 0 && urls.length > 0) {
      return { ok: false, reason: `All ${urls.length} World Bank ranking batch(es) failed` };
    }

    // code -> iso3 -> the best row seen so far for that country (highest
    // year with a non-null value; a null row only if nothing better shows up).
    const latestByCodeAndCountry = new Map<
      string,
      Map<string, { iso3: string; name: string; value: number | null; year: string | null }>
    >();
    for (const code of codes) latestByCodeAndCountry.set(code, new Map());

    const lastUpdatedByCode = new Map<string, string | null>();
    for (const code of codes) lastUpdatedByCode.set(code, null);

    for (const resp of results) {
      const meta = metaFromResponse(resp);
      for (const row of rowsFromResponse(resp)) {
        if ((row.country as { value: string }).value === "Aggregates") continue;
        const perCountry = latestByCodeAndCountry.get(row.indicator.id);
        if (!perCountry) continue; // a code the World Bank doesn't recognise for this batch
        if (!lastUpdatedByCode.get(row.indicator.id) && meta.lastupdated) {
          lastUpdatedByCode.set(row.indicator.id, meta.lastupdated);
        }

        const iso3 = row.countryiso3code;
        const existing = perCountry.get(iso3);
        const candidate = {
          iso3,
          name: row.country.value,
          value: row.value,
          year: row.date ?? null,
        };
        if (!existing) {
          perCountry.set(iso3, candidate);
          continue;
        }
        // Keep whichever row is more useful: a non-null value beats a null
        // one, and among non-null values the more recent year wins.
        const existingYear = existing.year ? Number(existing.year) : -Infinity;
        const candidateYear = candidate.year ? Number(candidate.year) : -Infinity;
        if (existing.value === null && candidate.value !== null) {
          perCountry.set(iso3, candidate);
        } else if (
          existing.value !== null &&
          candidate.value !== null &&
          candidateYear > existingYear
        ) {
          perCountry.set(iso3, candidate);
        }
      }
    }

    const byCode = new Map<
      string,
      { rows: { iso3: string; name: string; value: number | null; year: string | null }[]; lastUpdated: string | null }
    >();
    for (const code of codes) {
      const perCountry = latestByCodeAndCountry.get(code)!;
      byCode.set(code, {
        rows: Array.from(perCountry.values()),
        lastUpdated: lastUpdatedByCode.get(code) ?? null,
      });
    }

    return { ok: true, data: byCode };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * The World Bank's own country list, filtered to real countries. This is
 * NOT the canonical country list for the app (that is lib/atlas/iso-countries.ts,
 * which also covers Taiwan, Western Sahara and Vatican City which the World
 * Bank omits entirely) — this is only useful for cross-checking which ISO3
 * codes actually have World Bank data.
 */
export async function fetchCountryList(): Promise<
  SourceResult<WorldBankCountryListEntry[]>
> {
  try {
    const url = `${BASE}/country?format=json&per_page=400`;
    const resp = await fetchWorldBank(url, REVALIDATE_WEEK);
    const [, rows] = resp as [
      WorldBankMeta,
      Array<{
        id: string;
        iso2Code: string;
        name: string;
        region: { value: string };
      }> | null
    ];
    const entries = (rows ?? []).map((row) => ({
      iso3: row.id,
      iso2: row.iso2Code,
      name: row.name,
      isAggregate: row.region.value === "Aggregates",
      region: row.region.value,
    }));
    return { ok: true, data: entries };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}
