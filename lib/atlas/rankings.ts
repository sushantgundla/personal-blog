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
// live in lib/atlas/rankings-data.ts, which scripts/atlas/build-snapshot.mjs
// can import under plain Node. This file re-exports both so nothing that
// already imports them from here needs to change.
//
// Fixed 2026-11-04: the snapshot read used to sit behind `unstable_cache`,
// meant to share one parse across cold starts. Next's Data Cache refuses any
// entry over 2 MB (silently in production, with a thrown error in dev), and
// rankings.json is 2.9 MB, so that wrapper never stored anything — it only
// added a cache lookup and a 2.9 MB JSON.stringify per cold start. The
// per-process memo below is the whole cache now.
import { buildRanking, computeAllRankings, loadRankingsSnapshotFile } from "./rankings-data";
import type { IndicatorValue, Ranking, RankingRow, SourceResult } from "./types";

export { buildRanking, computeAllRankings };

/**
 * Every indicator's ranking, loaded once per server process: the committed
 * snapshot when there is one, else one shared batched World Bank fetch.
 */
let allRankingsPromise: Promise<Map<string, SourceResult<Ranking>>> | null = null;

/**
 * The snapshot's rows are re-ranked through buildRanking on read, so the
 * ranking rules (ties sharing a rank, the 30-country floor) are whatever
 * this code says today, not whatever they were when the snapshot was built.
 */
async function readRankingsSnapshot(): Promise<Map<string, SourceResult<Ranking>> | null> {
  const snapshot = await loadRankingsSnapshotFile();
  if (!snapshot) return null;
  const out = new Map<string, SourceResult<Ranking>>();
  for (const [code, result] of Object.entries(snapshot.rankings)) {
    out.set(
      code,
      result.ok
        ? { ok: true, data: buildRanking(code, result.data.rows, result.data.asOfNote) }
        : result
    );
  }
  return out;
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
