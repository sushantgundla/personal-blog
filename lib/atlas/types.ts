// Shared types for the Atlas data layer.
// Every source client returns SourceResult<T> so a dead source can never
// throw — dossier.ts composes everything with Promise.allSettled and each
// panel gets its own empty state instead of blanking the page.

/** The section headings the dossier groups indicators under. */
export type AtlasSection =
  | "LAND"
  | "PEOPLE"
  | "MONEY"
  | "TRADE"
  | "HEALTH"
  | "LEARNING"
  | "WORK"
  | "CONNECTED"
  | "NATURE"
  | "STATE";

export type AtlasFormat =
  | "number"
  | "currency"
  | "percent"
  | "years"
  | "per1000";

/** Catalogue entry for one World Bank indicator — see indicators.ts. */
export interface IndicatorDef {
  /** World Bank indicator code, e.g. "NY.GDP.MKTP.CD". */
  code: string;
  /** Plain-English label — not the World Bank's own wording. */
  label: string;
  unit: string;
  section: AtlasSection;
  format: AtlasFormat;
  /**
   * true = higher is better, false = lower is better, null = genuinely
   * neutral (e.g. population, land area — there is no "better").
   */
  higherIsBetter: boolean | null;
  /** Draw a full 1960->now sparkline/chart for this one on the dossier. */
  chart: boolean;
}

/** One indicator's value for one country, with everything needed to render it honestly. */
export interface IndicatorValue {
  code: string;
  value: number | null;
  /** The year this value is actually from — always render it next to the number. */
  year: string | null;
  unit: string;
  /** 1-based rank among countries with a value for this indicator, or null if unranked/unavailable. */
  rank: number | null;
  /** Total countries with a value for this indicator, for "#5 of 195". */
  outOf: number | null;
  worldAverage: number | null;
  /** 0-100, higher = closer to the best end of the distribution given higherIsBetter. */
  percentile: number | null;
}

/** One point in a charted time series. */
export interface TimeSeriesPoint {
  year: string;
  value: number | null;
}

export interface TimeSeries {
  code: string;
  unit: string;
  points: TimeSeriesPoint[];
}

/** One row in a leaderboard for a single indicator, all countries. */
export interface Ranking {
  code: string;
  asOfNote: string | null;
  worldAverage: number | null;
  rows: RankingRow[];
}

export interface RankingRow {
  iso3: string;
  name: string;
  value: number | null;
  year: string | null;
  rank: number | null;
  percentile: number | null;
}

export interface TradePartner {
  /** ISO3 of the partner, joined locally from Comtrade's numeric M49 code. */
  iso3: string | null;
  name: string;
  /** Trade value in current US$. */
  value: number;
  year: string;
  share: number | null;
}

export interface TradeSummary {
  reporterIso3: string;
  year: string | null;
  exports: TradePartner[];
  imports: TradePartner[];
}

export interface Person {
  qid: string;
  name: string;
  description: string | null;
  /** Wikimedia Commons portrait URL, or null — ~70 countries have no good free portrait. */
  imageUrl: string | null;
  occupations: string[];
}

export interface UnescoSite {
  qid: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  coordinates: { lat: number; lng: number } | null;
}

/** One bordering country. Which countries appear here comes from
 * lib/atlas/land-borders.ts (the source of truth for a real land border),
 * not from Wikidata's P47 — see fetchNeighbours' doc comment
 * (lib/atlas/sources/wikidata.ts) for why. flagImageUrl is filled in from
 * Wikidata's P47 result where it has one; null when it doesn't. */
export interface NeighbourCountry {
  iso3: string;
  name: string;
  flagImageUrl: string | null;
}

/** One dated fact for the history timeline, beyond the founding/independence
 * date already carried on `independenceDate`. Sourced from Wikidata's own
 * "significant event" property (P793, restricted to events that carry their
 * own point-in-time/start-time — most don't) and from UN membership (P463
 * toward Q1065, with its P580 start-time qualifier). Both are structured,
 * dated facts, not free text, so they don't carry the vandalism risk
 * lib/atlas/overrides.ts exists for — see fetchHistoryEvents in
 * lib/atlas/sources/wikidata.ts for the query. */
export interface HistoryEvent {
  label: string;
  /** ISO 8601, same shape every other Wikidata date on this dossier uses. */
  date: string;
}

/** The Wikidata dossier facts. Head of state / government are NEVER sourced
 * here — see lib/atlas/overrides.ts. Every other field must carry asOf. */
export interface WikidataFacts {
  asOf: string;
  motto: string | null;
  anthemName: string | null;
  anthemAudioUrl: string | null;
  flagImageUrl: string | null;
  emblemImageUrl: string | null;
  capital: string | null;
  capitalCoordinates: { lat: number; lng: number } | null;
  independenceDate: string | null;
  officialLanguages: string[];
  currencyName: string | null;
  currencyCode: string | null;
  drivingSide: "left" | "right" | null;
  callingCode: string | null;
  /** Wikidata P395 — vehicle registration / licence plate code, e.g. "IND". */
  licencePlateCode: string | null;
  /** Wikidata P78 — internet ccTLD, e.g. ".in". */
  topLevelDomain: string | null;
  highestPoint: { name: string; elevationM: number | null } | null;
  lowestPoint: { name: string; elevationM: number | null } | null;
  /** P417 — real Wikidata property, direction country -> saint. Populated
   * for maybe a quarter of countries (mostly Catholic ones); empty is normal. */
  patronSaints: string[];
  /**
   * Empty for a country with genuinely no UNESCO sites (common — most sites
   * on Wikidata have no image, and plenty of countries have zero). Optional,
   * not just possibly-empty, for the same reason as `neighbours` below: a
   * failed sub-fetch inside fetchDossierFacts (lib/atlas/sources/wikidata.ts)
   * must leave this key out (`undefined`) rather than write `[]`, or a fetch
   * failure reads back exactly like a real "no sites" country. Fixed
   * 2026-08-08 — see `neighbours`'s doc comment below for the incident this
   * came from.
   */
  unescoSites?: UnescoSite[];
  /**
   * Bordering countries, from lib/atlas/land-borders.ts (see
   * NeighbourCountry's doc comment) — empty for islands and other countries
   * with genuinely no land border (a normal state, not an error). Optional,
   * not just possibly-empty: the dossier snapshot files written before
   * 2026-08-03 genuinely don't have this key at all (JSON.parse gives
   * `undefined`, not `[]`), and a failed live fetch must produce that same
   * `undefined`, never `[]` — every reader must treat "missing" as its own
   * "not fetched / fetch failed" state, distinct from "fetched, zero
   * neighbours". See app/atlas/_components/Neighbours.tsx.
   *
   * Fixed 2026-08-08: fetchDossierFacts and build-snapshot.mjs's
   * patchNeighbours used to collapse a failed fetchNeighbours call to `[]`
   * (`result.ok ? result.data : []`) — indistinguishable from a real island.
   * During the 2026-08-08 sweep this silently blanked AZE, CAN, KEN and LBN,
   * caught only by an independent cross-check afterwards. Both now leave
   * this field alone on failure instead.
   */
  neighbours?: NeighbourCountry[];
  /**
   * Additional dated history events beyond `independenceDate` — see
   * HistoryEvent's doc comment for where these come from. Same optional-vs-
   * empty-array convention as `unescoSites`/`neighbours` above: `undefined`
   * means the sub-fetch never ran or failed, `[]` means it ran and this
   * country genuinely has none on file (common — most countries have no
   * P793 significant event with its own date, and non-UN-member territories
   * have no UN accession date either).
   */
  historyEvents?: HistoryEvent[];
}

export interface WikipediaSummary {
  title: string;
  extract: string;
  description: string | null;
  thumbnailUrl: string | null;
  canonicalUrl: string;
  /** CC BY-SA 4.0 attribution requires this. */
  revisionTimestamp: string | null;
}

export interface WeatherNow {
  temperatureC: number;
  windKph: number | null;
  observedAt: string;
}

export interface FxRate {
  base: string;
  quote: string;
  rate: number;
  asOf: string;
}

/** Hand-written corrections layer. See §3.6 — Wikidata is vandalised for
 * politically sensitive fields, so head of state / government come only
 * from here, never live. */
export interface CountryOverrides {
  headOfState?: string;
  headOfGovernment?: string;
  nationalDish?: string;
  notes?: string;
}

/** The result every source client returns. Nothing throws past this boundary. */
export type SourceResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: string };

/** The composed object one /atlas/[iso3] page renders from. */
export interface CountryDossier {
  iso3: string;
  iso2: string;
  name: string;
  worldBank: SourceResult<{
    indicators: IndicatorValue[];
    lastUpdated: string | null;
  }>;
  timeSeries: SourceResult<TimeSeries[]>;
  wikidata: SourceResult<WikidataFacts>;
  wikipedia: SourceResult<WikipediaSummary>;
  trade: SourceResult<TradeSummary>;
  weather: SourceResult<WeatherNow>;
  fx: SourceResult<FxRate>;
  /** From content/atlas/famous-people.json (build-time SPARQL, too slow to run per-request). Empty ok:true when the file has no entry yet. */
  famousPeople: SourceResult<Person[]>;
  overrides: CountryOverrides;
  /**
   * When this data was captured, ISO 8601. Always a real timestamp — either
   * read from content/atlas/snapshot/countries/{iso3}.json (written by
   * scripts/atlas/build-snapshot.mjs, or last updated by the refresh
   * button), or, for the rare country missing from the snapshot, the moment
   * of the live fallback fetch in lib/atlas/dossier.ts. Render this as
   * "data as of {date}" so the snapshot's age is never hidden.
   */
  capturedAt: string;
}
