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
  highestPoint: { name: string; elevationM: number | null } | null;
  lowestPoint: { name: string; elevationM: number | null } | null;
  /** P417 — real Wikidata property, direction country -> saint. Populated
   * for maybe a quarter of countries (mostly Catholic ones); empty is normal. */
  patronSaints: string[];
  unescoSites: UnescoSite[];
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
}
