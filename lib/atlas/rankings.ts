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
//
// Split 2026-08-08: buildRanking, computeAllRankings and the plain file read
// now live in lib/atlas/rankings-data.ts, which has no `next/cache` import —
// see that file's doc comment for why (scripts/atlas/build-snapshot.mjs
// cannot resolve `next/cache` under plain Node). This file re-exports both so
// nothing that already imports them from here needs to change, and keeps the
// unstable_cache wrapping — the part that genuinely needs Next — on top.
import { unstable_cache } from "next/cache";
import { buildRanking, computeAllRankings, loadRankingsSnapshotFile } from "./rankings-data";
import type { IndicatorValue, Ranking, RankingRow, SourceResult } from "./types";

export { buildRanking, computeAllRankings };

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

let cachedSnapshotCapturedAt: string | null = null;

/** The `capturedAt` timestamp from the last snapshot read, for "data as of" display. */
export function getRankingsSnapshotCapturedAt(): string | null {
  return cachedSnapshotCapturedAt;
}

/** The Next Data Cache tag for the rankings snapshot — no route revalidates
 * it today (unlike dossier.ts's per-country tag), it exists so the cached
 * value can be told apart from other unstable_cache entries and, if a
 * refresh path is ever added, invalidated the same way. */
const RANKINGS_CACHE_TAG = "atlas-rankings";

/**
 * content/atlas/snapshot/rankings.json (2.9 MB) is memoized per warm process
 * by allRankingsPromise below, but that buys nothing on a Vercel cold
 * start — every cold instance pays the same parse again. This wraps the
 * read in Next's Data Cache (unstable_cache), which — like dossier.ts's use
 * of it for getDossier — is a real store Vercel shares across every
 * instance and region, so only the first cold start after a deploy actually
 * parses the file.
 *
 * The cached value is a plain, already-JSON-shaped record (capturedAt +
 * the Record straight from JSON.parse), not a Map — unstable_cache persists
 * whatever it's given through Next's own serialization, and a Map does not
 * survive that round trip. The Map conversion, and setting
 * cachedSnapshotCapturedAt, both stay in readRankingsSnapshot below, outside
 * the cached function, so they still happen on every call — including a
 * cache *hit* in a process that never ran loadRankingsSnapshotFile itself.
 * loadRankingsSnapshotFile itself now lives in ./rankings-data (see this
 * file's top-of-file doc comment for why) — imported above, not redefined
 * here.
 */
function getCachedRankingsSnapshotFile() {
  return unstable_cache(loadRankingsSnapshotFile, ["atlas-rankings-v1"], {
    tags: [RANKINGS_CACHE_TAG],
    revalidate: false, // forever — there is no refresh route for rankings, a new deploy resets the Data Cache anyway
  })();
}

async function readRankingsSnapshot(): Promise<Map<string, SourceResult<Ranking>> | null> {
  const snapshot = await getCachedRankingsSnapshotFile();
  if (!snapshot) return null;
  cachedSnapshotCapturedAt = snapshot.capturedAt;
  return new Map(Object.entries(snapshot.rankings));
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
