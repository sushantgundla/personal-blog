// Composes every Atlas data source into one CountryDossier.
//
// Promise.allSettled, never Promise.all: one dead source must never blank
// the whole page. A country entirely absent from the World Bank (Taiwan,
// Western Sahara, Vatican City) still gets a full dossier here, with
// worldBank/timeSeries as ok:false and everything else populated normally.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { BY_ISO3 } from "./iso-countries";
import { ALL_INDICATOR_CODES, CHART_INDICATOR_CODES } from "./indicators";
import { fetchLatestIndicators, fetchTimeSeries } from "./sources/worldbank";
import { fetchDossierFacts } from "./sources/wikidata";
import { fetchSummary } from "./sources/wikipedia";
import { fetchTradeSummary } from "./sources/comtrade";
import { fetchCapitalWeather } from "./sources/meteo";
import { fetchRate } from "./sources/fx";
import { getOverrides } from "./overrides";
import type {
  CountryDossier,
  Person,
  SourceResult,
  WikidataFacts,
  WikipediaSummary,
} from "./types";

function toResult<T>(settled: PromiseSettledResult<SourceResult<T>>): SourceResult<T> {
  if (settled.status === "fulfilled") return settled.value;
  const reason = settled.reason;
  return { ok: false, reason: reason instanceof Error ? reason.message : String(reason) };
}

function notInIsoTable<T>(iso3: string): Promise<SourceResult<T>> {
  return Promise.resolve({ ok: false, reason: `${iso3} is not in the local ISO table` });
}

/** content/atlas/famous-people.json — generated at build time by
 * scripts/atlas/build-people.mjs because the live SPARQL query takes 26.8s
 * for a country the size of India. Missing file/entry is a normal empty
 * state, not an error. */
async function loadFamousPeople(iso3: string): Promise<SourceResult<Person[]>> {
  try {
    const filePath = path.join(process.cwd(), "content", "atlas", "famous-people.json");
    const raw = await readFile(filePath, "utf-8");
    const all = JSON.parse(raw) as Record<string, Person[]>;
    return { ok: true, data: all[iso3] ?? [] };
  } catch {
    return { ok: true, data: [] };
  }
}

export async function getDossier(iso3: string): Promise<CountryDossier> {
  const iso = BY_ISO3[iso3];
  const name = iso?.name ?? iso3;
  const iso2 = iso?.iso2 ?? "";

  const overrides = getOverrides(iso3);

  const [worldBank, timeSeries, wikidata, wikipedia, trade, famousPeople] =
    await Promise.allSettled([
      fetchLatestIndicators(iso3, ALL_INDICATOR_CODES),
      fetchTimeSeries(iso3, CHART_INDICATOR_CODES),
      iso ? fetchDossierFacts(iso.qid) : notInIsoTable<WikidataFacts>(iso3),
      iso ? fetchSummary(iso.wikiTitle) : notInIsoTable<WikipediaSummary>(iso3),
      fetchTradeSummary(iso3),
      loadFamousPeople(iso3),
    ]).then(
      ([wb, ts, wd, wp, tr, fp]) =>
        [toResult(wb), toResult(ts), toResult(wd), toResult(wp), toResult(tr), toResult(fp)] as const
    );

  // Weather needs the capital's coordinates, and FX needs the currency code
  // — both already resolved facts on `wikidata`, so these run after it
  // rather than duplicating the SPARQL call.
  const coords = wikidata.ok ? wikidata.data.capitalCoordinates : null;
  const currencyCode = wikidata.ok ? wikidata.data.currencyCode : null;
  const [weather, fx] = await Promise.allSettled([
    coords
      ? fetchCapitalWeather(coords.lat, coords.lng)
      : Promise.resolve<SourceResult<never>>({
          ok: false,
          reason: "No capital coordinates available",
        }),
    fetchRate(currencyCode),
  ]).then(([w, f]) => [toResult(w), toResult(f)] as const);

  return {
    iso3,
    iso2,
    name,
    worldBank,
    timeSeries,
    wikidata,
    wikipedia,
    trade,
    weather,
    fx,
    famousPeople,
    overrides,
  };
}
