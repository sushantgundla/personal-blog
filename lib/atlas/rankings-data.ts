// The pure, Next-free half of rankings — building a Ranking from World Bank
// rows, computing every indicator's ranking live, and reading the committed
// snapshot file straight off disk.
//
// Split out of lib/atlas/rankings.ts on 2026-08-08. rankings.ts pulls in
// `unstable_cache` from `next/cache` for its Data Cache layer, and that bare
// specifier only resolves inside a Next build — scripts/atlas/build-snapshot.mjs
// runs under plain Node (see scripts/atlas/ts-resolve-hook.mjs's doc comment
// for why extensionless imports already need a hook), so a Node ESM resolve
// of `next/cache` there fails with ERR_MODULE_NOT_FOUND before the script does
// anything, even for flags like --patch-neighbours that never touch rankings
// at all. The script only ever needed computeAllRankings (to build
// content/atlas/snapshot/rankings.json) — nothing here imports `next/cache`,
// so importing this file instead is safe from plain Node.
//
// rankings.ts re-exports buildRanking and computeAllRankings from here, so
// nothing that already imports them from "./rankings" needs to change; only
// build-snapshot.mjs (which has no reason to load the Next-only caching layer
// at all) imports this file directly.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { BY_ISO3 } from "./iso-countries";
import { ALL_INDICATOR_CODES, INDICATORS_BY_CODE } from "./indicators";
import { fetchIndicatorsAllCountries } from "./sources/worldbank";
import type { Ranking, RankingRow, SourceResult } from "./types";

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
 * both the snapshot-build script and the (rare) live fallback in
 * rankings.ts. Node imports this .ts file directly (native TypeScript
 * type-stripping), so there is no separate plain-JS copy of this logic to
 * keep in sync.
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
 * The live path: one shared batched `fetchIndicatorsAllCountries` call
 * against the World Bank, computed into a Ranking per indicator. This is
 * what scripts/atlas/build-snapshot.mjs calls to produce
 * content/atlas/snapshot/rankings.json, and what rankings.ts's
 * getAllRankings falls back to if that snapshot doesn't exist yet (e.g. a
 * fresh checkout before the first snapshot build has ever run).
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
export interface RankingsSnapshotFile {
  capturedAt: string;
  rankings: Record<string, SourceResult<Ranking>>;
}

/**
 * A plain, cache-free read of content/atlas/snapshot/rankings.json.
 * rankings.ts wraps this in `unstable_cache` for the live site (see its doc
 * comment on getCachedRankingsSnapshotFile); nothing here needs `next/cache`,
 * which is exactly why this function lives in this file and not there.
 */
export async function loadRankingsSnapshotFile(): Promise<{
  capturedAt: string | null;
  rankings: RankingsSnapshotFile["rankings"];
} | null> {
  try {
    const raw = await readFile(SNAPSHOT_PATH, "utf-8");
    const parsed = JSON.parse(raw) as RankingsSnapshotFile;
    return { capturedAt: parsed.capturedAt ?? null, rankings: parsed.rankings };
  } catch {
    return null;
  }
}
