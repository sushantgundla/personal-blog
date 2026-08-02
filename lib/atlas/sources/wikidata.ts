// Wikidata SPARQL client — the dossier facts and UNESCO World Heritage sites.
//
// Traps handled (see design spec §3.6):
// - A descriptive User-Agent with a contact URL is required, or the query
//   service blocks the request.
// - 20-second timeout via AbortController — the service can hang.
// - Head of state and head of government are NEVER read here. Wikidata is
//   vandalised (India's head of state returned "Ganesh rajput" on
//   2026-08-02) — those two facts render only from lib/atlas/overrides.ts.
// - Multi-valued properties (languages, currency) are pulled through a
//   GROUP_CONCAT subquery, not a plain OPTIONAL, or the cross product with
//   other OPTIONAL clauses duplicates the whole row (confirmed live against
//   Tuvalu, which has two circulating currencies).
// - Every fact carries the query's run time as "asOf", per §3.7.
import type { Person, SourceResult, UnescoSite, WikidataFacts } from "../types";
import { toHttps } from "../format";

const ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT =
  "AtlasCountryExplorer/1.0 (https://sushantgundla.com/atlas; contact: atlas@sushantgundla.com)";
const TIMEOUT_MS = 20_000;
const REVALIDATE_DAY = 86400;

async function sparql(query: string): Promise<Record<string, { value: string }>[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `${ENDPOINT}?format=json&query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": USER_AGENT,
      },
      signal: controller.signal,
      next: { revalidate: REVALIDATE_DAY },
    });
    if (!res.ok) {
      throw new Error(`Wikidata HTTP ${res.status}`);
    }
    const body = (await res.json()) as {
      results: { bindings: Record<string, { value: string }>[] };
    };
    return body.results.bindings;
  } finally {
    clearTimeout(timer);
  }
}

function str(row: Record<string, { value: string }>, key: string): string | null {
  return row[key]?.value ?? null;
}

// toHttps (imported above from ../format) normalises every URL field this
// module returns — Wikidata's `Special:FilePath` values (flags, emblems,
// portraits, anthem audio) come back as literal `http://` routinely, which
// breaks next/image's https-only remotePatterns. See the doc comment on
// toHttps for the full trap.

function num(row: Record<string, { value: string }>, key: string): number | null {
  const v = row[key]?.value;
  if (v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** "Point(lng lat)" -> {lat, lng}. Wikidata's geo literal is lng-first. */
function parsePoint(wkt: string | null): { lat: number; lng: number } | null {
  if (!wkt) return null;
  const m = /Point\(([-\d.]+)\s+([-\d.]+)\)/.exec(wkt);
  if (!m) return null;
  return { lng: Number(m[1]), lat: Number(m[2]) };
}

function dossierQuery(qid: string): string {
  return `SELECT ?mottoLabel ?anthemLabel ?anthemAudio ?flag ?emblem ?capitalLabel ?capCoord
  ?inception ?languages ?currencyNames ?currencyCodes ?drivingSideLabel ?callingCode
  ?plate ?tldLabel
  ?highestLabel ?highestElev ?lowestLabel ?lowestElev ?patrons WHERE {
  BIND(wd:${qid} AS ?country)
  OPTIONAL { ?country wdt:P1546 ?motto . }
  OPTIONAL { ?country wdt:P85 ?anthem . OPTIONAL { ?anthem wdt:P51 ?anthemAudio . } }
  OPTIONAL { ?country wdt:P41 ?flag . }
  OPTIONAL { ?country wdt:P94 ?emblem . }
  OPTIONAL { ?country wdt:P36 ?capital . OPTIONAL { ?capital wdt:P625 ?capCoord . } }
  OPTIONAL { ?country wdt:P571 ?inception . }
  OPTIONAL { ?country wdt:P395 ?plate . }
  OPTIONAL {
    # P78 is a WikibaseItem per ccTLD, not a plain string, and several
    # countries (India among them) carry more than one delegated IDN
    # variant alongside the plain ASCII one (".in" vs ".bharat" /
    # ".भारत" / etc). ORDER BY + LIMIT 1 picks the ASCII form when one
    # exists rather than an arbitrary script via unordered GROUP_CONCAT.
    SELECT ?tldLabel WHERE {
      wd:${qid} wdt:P78 ?tld . ?tld rdfs:label ?tldLabel . FILTER(lang(?tldLabel) = "en")
    } ORDER BY DESC(REGEX(?tldLabel, "^\\.[A-Za-z]+$")) LIMIT 1
  }
  OPTIONAL {
    SELECT (GROUP_CONCAT(DISTINCT ?llabel; separator="|") AS ?languages) WHERE {
      wd:${qid} wdt:P37 ?lang . ?lang rdfs:label ?llabel . FILTER(lang(?llabel) = "en")
    }
  }
  OPTIONAL {
    SELECT (GROUP_CONCAT(DISTINCT ?curLabel; separator="|") AS ?currencyNames)
           (GROUP_CONCAT(DISTINCT ?curCode; separator="|") AS ?currencyCodes) WHERE {
      wd:${qid} wdt:P38 ?currency .
      OPTIONAL { ?currency rdfs:label ?curLabel . FILTER(lang(?curLabel) = "en") }
      OPTIONAL { ?currency wdt:P498 ?curCode . }
    }
  }
  OPTIONAL { ?country wdt:P1622 ?drivingSide . }
  OPTIONAL { ?country wdt:P474 ?callingCode . }
  OPTIONAL { ?country wdt:P610 ?highest . OPTIONAL { ?highest wdt:P2044 ?highestElev . } }
  OPTIONAL { ?country wdt:P1589 ?lowest . OPTIONAL { ?lowest wdt:P2044 ?lowestElev . } }
  OPTIONAL {
    SELECT (GROUP_CONCAT(DISTINCT ?patronLabel; separator="|") AS ?patrons) WHERE {
      wd:${qid} wdt:P417 ?patron . ?patron rdfs:label ?patronLabel FILTER(lang(?patronLabel) = "en")
    }
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 1`;
}

function unescoQuery(qid: string): string {
  return `SELECT ?site ?siteLabel ?siteDescription ?image ?coord WHERE {
  ?site wdt:P1435 wd:Q9259 .
  ?site wdt:P17 wd:${qid} .
  OPTIONAL { ?site wdt:P18 ?image . }
  OPTIONAL { ?site wdt:P625 ?coord . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 50`;
}

function driveSide(label: string | null): "left" | "right" | null {
  if (label === "left" || label === "right") return label;
  return null;
}

/** Fetch the dossier facts for one country. Never includes head of state/government. */
export async function fetchDossierFacts(
  qid: string
): Promise<SourceResult<WikidataFacts>> {
  try {
    const rows = await sparql(dossierQuery(qid));
    const row = rows[0] ?? {};
    const unesco = await fetchUnescoSites(qid);

    const facts: WikidataFacts = {
      asOf: new Date().toISOString(),
      motto: str(row, "mottoLabel"),
      anthemName: str(row, "anthemLabel"),
      anthemAudioUrl: toHttps(str(row, "anthemAudio")),
      flagImageUrl: toHttps(str(row, "flag")),
      emblemImageUrl: toHttps(str(row, "emblem")),
      capital: str(row, "capitalLabel"),
      capitalCoordinates: parsePoint(str(row, "capCoord")),
      independenceDate: str(row, "inception"),
      officialLanguages: str(row, "languages")?.split("|").filter(Boolean) ?? [],
      currencyName: str(row, "currencyNames")?.split("|")[0] ?? null,
      currencyCode: str(row, "currencyCodes")?.split("|")[0] ?? null,
      drivingSide: driveSide(str(row, "drivingSideLabel")),
      callingCode: str(row, "callingCode"),
      licencePlateCode: str(row, "plate"),
      // P78 is modelled as a WikibaseItem per ccTLD (e.g. Q39218 = ".in"),
      // not a plain string — see the dossierQuery subquery above for how
      // the ASCII form is picked when a country has more than one.
      topLevelDomain: str(row, "tldLabel"),
      highestPoint: str(row, "highestLabel")
        ? { name: str(row, "highestLabel")!, elevationM: num(row, "highestElev") }
        : null,
      lowestPoint: str(row, "lowestLabel")
        ? { name: str(row, "lowestLabel")!, elevationM: num(row, "lowestElev") }
        : null,
      patronSaints: str(row, "patrons")?.split("|").filter(Boolean) ?? [],
      unescoSites: unesco.ok ? unesco.data : [],
    };
    return { ok: true, data: facts };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchUnescoSites(
  qid: string
): Promise<SourceResult<UnescoSite[]>> {
  try {
    const rows = await sparql(unescoQuery(qid));
    // A site with more than one P18 image produces one row per image —
    // confirmed live on Poland (Q9395907 twice). Keep the first per qid.
    const seen = new Set<string>();
    const sites: UnescoSite[] = [];
    for (const row of rows) {
      const siteQid = str(row, "site")?.split("/").pop() ?? "";
      if (seen.has(siteQid)) continue;
      seen.add(siteQid);
      sites.push({
        qid: siteQid,
        name: str(row, "siteLabel") ?? "Unnamed site",
        description: str(row, "siteDescription"),
        imageUrl: toHttps(str(row, "image")),
        coordinates: parsePoint(str(row, "coord")),
      });
    }
    return { ok: true, data: sites };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

// Kept for parity with the Person type used elsewhere (famous people are
// generated at build time by scripts/atlas/build-people.mjs, NOT fetched
// live here — the live query took 26.8s for India and would time out).
export type { Person };
