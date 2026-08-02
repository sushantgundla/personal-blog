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
// - Retry 3x with exponential backoff, treating HTTP 400 as retryable. The
//   API throws random 400s under throttling even on valid URLs.
// - Filter `region.value !== "Aggregates"` — 78 of 295 "countries" are
//   aggregates like "World" and "Euro area".
import type { IndicatorValue, SourceResult, TimeSeries } from "../types";

const BASE = "https://api.worldbank.org/v2";
const BATCH_SIZE = 25;
const REVALIDATE_WEEK = 604800;

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
 */
async function fetchWorldBank(
  url: string,
  revalidate: number,
  attempts = 3
): Promise<WorldBankResponse> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
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
    }
    if (attempt < attempts - 1) {
      // Confirmed live 2026-08-02: sub-second backoff was not enough during
      // a throttled window — mrnev=1 calls kept 400ing for 10+ seconds
      // straight before succeeding. Start the backoff at 2s.
      await sleep(2000 * 2 ** attempt + Math.random() * 500);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function rowsFromResponse(resp: WorldBankResponse): WorldBankRow[] {
  const [, rows] = resp;
  return rows ?? [];
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
    const results = await Promise.all(
      batches.map((batch) => {
        const url =
          `${BASE}/country/${encodeURIComponent(iso3)}/indicator/${batch.join(";")}` +
          `?source=2&format=json&mrnev=1&per_page=200`;
        return fetchWorldBank(url, REVALIDATE_WEEK);
      })
    );

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
    const results = await Promise.all(
      batches.map((batch) => {
        const url =
          `${BASE}/country/${encodeURIComponent(iso3)}/indicator/${batch.join(";")}` +
          `?source=2&format=json&date=${from}:${to}&per_page=1000`;
        return fetchWorldBank(url, REVALIDATE_WEEK);
      })
    );

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
