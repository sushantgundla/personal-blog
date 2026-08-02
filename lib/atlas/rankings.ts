// Rankings and the choropleth — one indicator, every country.
//
// A ranking's underlying URL (`country/all/indicator/X`) is identical for
// every visitor and every country page, so under ISR it is fetched once per
// `revalidate` window (7 days) and then served from cache to the leaderboard,
// the map choropleth, and every dossier page that wants a "#5 of 195" line
// for this indicator — not once per country. That is why it is a separate
// module from dossier.ts rather than one of the "5-7 calls per country page"
// in the request budget.
import { BY_ISO3 } from "./iso-countries";
import { INDICATORS_BY_CODE } from "./indicators";
import { fetchAllCountries } from "./sources/worldbank";
import type { IndicatorValue, Ranking, RankingRow, SourceResult } from "./types";

const rankingCache = new Map<string, Promise<SourceResult<Ranking>>>();

/**
 * All-country ranking for one indicator: rank, percentile (100 = best end
 * of the distribution) and the world average, aggregate rows already
 * filtered out by fetchAllCountries.
 */
export async function getRanking(code: string): Promise<SourceResult<Ranking>> {
  const cached = rankingCache.get(code);
  if (cached) return cached;

  const promise = (async (): Promise<SourceResult<Ranking>> => {
    const result = await fetchAllCountries(code);
    if (!result.ok) return result;

    const def = INDICATORS_BY_CODE[code];
    const higherIsBetter = def?.higherIsBetter ?? null;

    const withValue = result.data.rows.filter(
      (r): r is typeof r & { value: number } => r.value !== null
    );
    const withoutValue = result.data.rows.filter((r) => r.value === null);

    const worldAverage =
      withValue.length > 0
        ? withValue.reduce((sum, r) => sum + r.value, 0) / withValue.length
        : null;

    // Rank 1 is always "best" for the given indicator: ascending when lower
    // is better, descending otherwise. A neutral (null) indicator still
    // gets an ordering (descending) so a rank number exists, but the UI
    // should not colour it as "good"/"bad".
    const sorted = [...withValue].sort((a, b) =>
      higherIsBetter === false ? a.value - b.value : b.value - a.value
    );

    const n = sorted.length;
    const rows: RankingRow[] = sorted.map((r, i) => {
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
    for (const r of withoutValue) {
      rows.push({
        iso3: r.iso3,
        name: BY_ISO3[r.iso3]?.name ?? r.name,
        value: null,
        year: null,
        rank: null,
        percentile: null,
      });
    }

    return {
      ok: true,
      data: {
        code,
        asOfNote: result.data.lastUpdated,
        worldAverage,
        rows,
      },
    };
  })();

  rankingCache.set(code, promise);
  return promise;
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
 * fetchLatestIndicators) with rank / outOf / worldAverage / percentile,
 * for exactly the codes given — call this for the notes about to render,
 * not all ~150 at once, since each code is its own `country/all` fetch
 * (cheap once warm, but still a request).
 */
export async function attachRankings(
  iso3: string,
  indicators: readonly IndicatorValue[],
  codes: readonly string[]
): Promise<IndicatorValue[]> {
  const codeSet = new Set(codes);
  const rankings = await Promise.allSettled(
    codes.map((code) => getRanking(code))
  );
  const byCode = new Map<string, Ranking>();
  rankings.forEach((settled, i) => {
    if (settled.status === "fulfilled" && settled.value.ok) {
      byCode.set(codes[i], settled.value.data);
    }
  });

  return indicators.map((indicator) => {
    if (!codeSet.has(indicator.code)) return indicator;
    const ranking = byCode.get(indicator.code);
    const row = ranking?.rows.find((r) => r.iso3 === iso3);
    if (!ranking || !row) return indicator;
    return {
      ...indicator,
      rank: row.rank,
      outOf: ranking.rows.filter((r) => r.value !== null).length,
      worldAverage: ranking.worldAverage,
      percentile: row.percentile,
    };
  });
}
