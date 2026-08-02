// Rankings and the choropleth — one indicator, every country.
//
// A ranking's underlying URL (`country/all/indicator/X`) is identical for
// every visitor and every country page, so under ISR it is fetched once per
// `revalidate` window (7 days) and then served from cache to the leaderboard,
// the map choropleth, and every dossier page that wants a "#5 of 195" line
// for this indicator — not once per country. That is why it is a separate
// module from dossier.ts rather than one of the "5-7 calls per country page"
// in the request budget.
//
// Fixed 2026-08-02: this used to call fetchAllCountries(code) once per
// indicator — ~150 separate `country/all` requests for one dossier, which
// the World Bank throttled hard (see fetchIndicatorsAllCountries's doc
// comment). Every indicator's ranking is now built from one shared batched
// fetch (~50 requests for all ~150 codes — see worldbank.ts's
// RANKING_BATCH_SIZE doc comment for why that batch is small), computed once
// per process/ISR
// window and reused by getRanking, getCountryRank and attachRankings alike.
//
// Fixed 2026-08-03: even that one shared batched fetch was still a live
// World Bank call on a visitor's first request, and the World Bank throttles
// hard enough that a cold page could take 30-95s. content/atlas/snapshot/rankings.json
// (written by scripts/atlas/build-snapshot.mjs) is now read first — a plain
// file read, no network — with the live batched fetch (computeAllRankings)
// kept as the rare fallback for a process that starts before any snapshot
// exists. See lib/atlas/dossier.ts for the same pattern applied per-country.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { BY_ISO3 } from "./iso-countries";
import { ALL_INDICATOR_CODES, INDICATORS_BY_CODE } from "./indicators";
import { fetchIndicatorsAllCountries } from "./sources/worldbank";
import type { IndicatorValue, Ranking, RankingRow, SourceResult } from "./types";

const SNAPSHOT_PATH = path.join(
  process.cwd(),
  "content",
  "atlas",
  "snapshot",
  "rankings.json"
);

type CountryValueRow = { iso3: string; name: string; value: number | null; year: string | null };

/**
 * Below this many countries with a value, a rank or a world average is not
 * honest — "#7 of 9" reads like a world ranking but is really a ranking
 * across whichever handful of countries happened to report. Under this
 * threshold, buildRanking still returns the value/year for a country that
 * has one, but leaves rank, percentile and worldAverage null so nothing
 * claims a comparison it can't support.
 */
const MIN_RANKABLE_COUNTRIES = 30;

/**
 * Exported so scripts/atlas/build-snapshot.mjs can build the exact same
 * Ranking shape this module would compute live, from the batched
 * `fetchIndicatorsAllCountries` response — one implementation, reused by
 * both the snapshot-build script and the (rare) live fallback below. Node
 * imports this .ts file directly (native TypeScript type-stripping), so
 * there is no separate plain-JS copy of this logic to keep in sync.
 */
export function buildRanking(
  code: string,
  rows: readonly CountryValueRow[],
  lastUpdated: string | null
): Ranking {
  const def = INDICATORS_BY_CODE[code];
  const higherIsBetter = def?.higherIsBetter ?? null;

  // World Bank's `country/all` rows mix in ~78 non-country aggregates
  // ("World", "IDA & IBRD total", "Middle income", ...). The API's own
  // `region.value !== "Aggregates"` marker isn't reliably present on the
  // batched indicator endpoints these rows come from, so instead we only
  // keep rows whose ISO3 is a real country in BY_ISO3 — aggregates use
  // non-country codes (WLD, IBT, LMY, MIC, IBD, EAP, ...) that never
  // appear there, so this drops them by construction.
  const realCountryRows = rows.filter((r) => BY_ISO3[r.iso3] !== undefined);

  const withValue = realCountryRows.filter(
    (r): r is CountryValueRow & { value: number } => r.value !== null
  );
  const withoutValue = realCountryRows.filter((r) => r.value === null);

  // Below MIN_RANKABLE_COUNTRIES, neither a rank nor a world average is
  // honest for this indicator — see MIN_RANKABLE_COUNTRIES above.
  const rankable = withValue.length >= MIN_RANKABLE_COUNTRIES;

  const worldAverage = rankable
    ? withValue.reduce((sum, r) => sum + r.value, 0) / withValue.length
    : null;

  // Rank 1 is always "best" for the given indicator: ascending when lower
  // is better, descending otherwise. A neutral (null) indicator still
  // gets an ordering (descending) so a rank number exists, but the UI
  // should not colour it as "good"/"bad".
  const sorted = rankable
    ? [...withValue].sort((a, b) =>
        higherIsBetter === false ? a.value - b.value : b.value - a.value
      )
    : [];

  const n = sorted.length;
  const rankedRows: RankingRow[] = sorted.map((r, i) => {
    const rank = i + 1;
    const percentile = n > 1 ? Math.round(((n - rank) / (n - 1)) * 100) : 100;
    return {
      iso3: r.iso3,
      name: BY_ISO3[r.iso3]?.name ?? r.name,
      value: r.value,
      year: r.year,
      rank,
      percentile,
    };
  });
  if (!rankable) {
    // Still surface the value/year a country has — just without a rank,
    // percentile or the comparison bar that a rank would otherwise feed.
    for (const r of withValue) {
      rankedRows.push({
        iso3: r.iso3,
        name: BY_ISO3[r.iso3]?.name ?? r.name,
        value: r.value,
        year: r.year,
        rank: null,
        percentile: null,
      });
    }
  }
  for (const r of withoutValue) {
    rankedRows.push({
      iso3: r.iso3,
      name: BY_ISO3[r.iso3]?.name ?? r.name,
      value: null,
      year: null,
      rank: null,
      percentile: null,
    });
  }

  return { code, asOfNote: lastUpdated, worldAverage, rows: rankedRows };
}

/**
 * Every indicator's ranking, computed once from one shared batched
 * `fetchIndicatorsAllCountries(ALL_INDICATOR_CODES)` call — ~10 World Bank
 * requests for the whole catalogue, not ~150. This promise is created on
 * first use and reused for the life of the server process (each request
 * inside it still carries its own `next: { revalidate }`, so Next's fetch
 * cache — not this module — is what makes it free across separate
 * processes/deploys once warm).
 */
let allRankingsPromise: Promise<Map<string, SourceResult<Ranking>>> | null = null;

/**
 * The live path: one shared batched `fetchIndicatorsAllCountries` call
 * against the World Bank, computed into a Ranking per indicator. This is
 * what scripts/atlas/build-snapshot.mjs calls to produce
 * content/atlas/snapshot/rankings.json, and what getAllRankings falls back
 * to below if that snapshot doesn't exist yet (e.g. a fresh checkout before
 * the first snapshot build has ever run).
 */
export async function computeAllRankings(): Promise<Map<string, SourceResult<Ranking>>> {
  const batch = await fetchIndicatorsAllCountries(ALL_INDICATOR_CODES);
  const out = new Map<string, SourceResult<Ranking>>();

  if (!batch.ok) {
    for (const code of ALL_INDICATOR_CODES) out.set(code, batch);
    return out;
  }

  for (const code of ALL_INDICATOR_CODES) {
    const entry = batch.data.get(code);
    if (!entry || entry.rows.length === 0) {
      out.set(code, { ok: false, reason: `World Bank returned no ranking rows for ${code}` });
      continue;
    }
    out.set(code, { ok: true, data: buildRanking(code, entry.rows, entry.lastUpdated) });
  }

  return out;
}

/** The JSON shape written to content/atlas/snapshot/rankings.json. */
interface RankingsSnapshotFile {
  capturedAt: string;
  rankings: Record<string, SourceResult<Ranking>>;
}

let cachedSnapshotCapturedAt: string | null = null;

/** The `capturedAt` timestamp from the last snapshot read, for "data as of" display. */
export function getRankingsSnapshotCapturedAt(): string | null {
  return cachedSnapshotCapturedAt;
}

async function readRankingsSnapshot(): Promise<Map<string, SourceResult<Ranking>> | null> {
  try {
    const raw = await readFile(SNAPSHOT_PATH, "utf-8");
    const parsed = JSON.parse(raw) as RankingsSnapshotFile;
    cachedSnapshotCapturedAt = parsed.capturedAt ?? null;
    return new Map(Object.entries(parsed.rankings));
  } catch {
    return null;
  }
}

async function loadAllRankings(): Promise<Map<string, SourceResult<Ranking>>> {
  const snapshot = await readRankingsSnapshot();
  if (snapshot) return snapshot;
  // Rare fallback: no committed snapshot yet (fresh checkout, or
  // scripts/atlas/build-snapshot.mjs hasn't been run). This is the one path
  // that still makes a live, throttle-prone World Bank call.
  return computeAllRankings();
}

function getAllRankings(): Promise<Map<string, SourceResult<Ranking>>> {
  if (!allRankingsPromise) allRankingsPromise = loadAllRankings();
  return allRankingsPromise;
}

/**
 * All-country ranking for one indicator: rank, percentile (100 = best end
 * of the distribution) and the world average, aggregate rows already
 * filtered out.
 */
export async function getRanking(code: string): Promise<SourceResult<Ranking>> {
  const all = await getAllRankings();
  return all.get(code) ?? { ok: false, reason: `${code} is not in the indicator catalogue` };
}

/** This one country's row within an indicator's ranking, or null if it has no value. */
export async function getCountryRank(
  iso3: string,
  code: string
): Promise<SourceResult<RankingRow | null>> {
  const ranking = await getRanking(code);
  if (!ranking.ok) return ranking;
  const row = ranking.data.rows.find((r) => r.iso3 === iso3) ?? null;
  return { ok: true, data: row };
}

/**
 * Enrich a set of already-fetched IndicatorValue rows (from
 * fetchLatestIndicators) with rank / outOf / worldAverage / percentile, for
 * exactly the codes given. Safe to call for every indicator a country has
 * (~150), since they all resolve against the one shared
 * `getAllRankings()` batch rather than one `country/all` fetch each.
 */
export async function attachRankings(
  iso3: string,
  indicators: readonly IndicatorValue[],
  codes: readonly string[]
): Promise<IndicatorValue[]> {
  const codeSet = new Set(codes);
  const all = await getAllRankings();

  return indicators.map((indicator) => {
    if (!codeSet.has(indicator.code)) return indicator;
    const result = all.get(indicator.code);
    if (!result || !result.ok) return indicator;
    const ranking = result.data;
    const row = ranking.rows.find((r) => r.iso3 === iso3);
    if (!row) return indicator;
    return {
      ...indicator,
      rank: row.rank,
      outOf: ranking.rows.filter((r) => r.value !== null).length,
      worldAverage: ranking.worldAverage,
      percentile: row.percentile,
    };
  });
}
