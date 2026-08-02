#!/usr/bin/env node
// Precomputes content/atlas/snapshot/countries/<ISO3>.json and
// content/atlas/snapshot/rankings.json — the committed cache that makes
// every /atlas/[iso3] page load instantly instead of waiting on live World
// Bank, Wikidata, Wikipedia, Comtrade, Open-Meteo and Frankfurter calls.
// Measured cold before this existed: 30-95s per country, because those APIs
// throttle hard. lib/atlas/dossier.ts and lib/atlas/rankings.ts read these
// files first (a plain file read, no network) and only fall back to a live
// fetch for a country this snapshot doesn't have yet — see their doc
// comments for the full read-side story, and app/atlas/api/refresh/[iso3]/
// route.ts for how the per-country refresh button keeps one country current
// between full rebuilds.
//
// Node imports the actual lib/atlas/*.ts source clients directly (native
// TypeScript type-stripping — confirmed working on the Node version this
// repo runs), so fetchOneCountry below is not a second copy of dossier.ts's
// composition logic, it calls the exact same functions dossier.ts does.
// (build-people.mjs predates this being confirmed to work, which is why
// that script regex-parses iso-countries.ts's source instead of importing
// it — no need to repeat that workaround here.)
//
// Resumable by design, same pattern as build-people.mjs: reads whatever
// country files already exist and skips them, checkpoints after every
// country (not just at the end) so an interrupted run loses nothing, and
// paces itself with PAUSE_MS between countries on top of worldbank.ts's own
// retry/backoff+semaphore. Expect a full run over all ~251 countries to
// take up to an hour, more if the APIs are throttling hard when it runs —
// that's fine, it runs offline, never on a visitor's request.
//
// Usage:
//   node scripts/atlas/build-snapshot.mjs [--limit N] [--only ISO3,ISO3] [--force] [--skip-rankings] [--skip-countries]
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ISO_COUNTRIES } from "../../lib/atlas/iso-countries.ts";
import { ALL_INDICATOR_CODES, CHART_INDICATOR_CODES } from "../../lib/atlas/indicators.ts";
import { fetchLatestIndicators, fetchTimeSeries } from "../../lib/atlas/sources/worldbank.ts";
import { fetchDossierFacts } from "../../lib/atlas/sources/wikidata.ts";
import { fetchSummary } from "../../lib/atlas/sources/wikipedia.ts";
import { fetchTradeSummary } from "../../lib/atlas/sources/comtrade.ts";
import { fetchCapitalWeather } from "../../lib/atlas/sources/meteo.ts";
import { fetchRate } from "../../lib/atlas/sources/fx.ts";
import { getOverrides } from "../../lib/atlas/overrides.ts";
import { computeAllRankings } from "../../lib/atlas/rankings.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const COUNTRIES_DIR = path.join(repoRoot, "content", "atlas", "snapshot", "countries");
const RANKINGS_PATH = path.join(repoRoot, "content", "atlas", "snapshot", "rankings.json");

// Between countries, on top of the per-request semaphore/backoff already in
// lib/atlas/sources/worldbank.ts. Politeness, not throughput — this run is
// not time-critical.
const PAUSE_MS = 4_000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function countryPath(iso3) {
  return path.join(COUNTRIES_DIR, `${iso3}.json`);
}

function toResult(settled) {
  if (settled.status === "fulfilled") return settled.value;
  const reason = settled.reason;
  return { ok: false, reason: reason instanceof Error ? reason.message : String(reason) };
}

function notInIsoTable(iso3) {
  return Promise.resolve({ ok: false, reason: `${iso3} is not in the local ISO table` });
}

/**
 * Fetches everything lib/atlas/dossier.ts's fetchLiveDossier does for one
 * country. famousPeople and overrides are deliberately NOT captured here —
 * dossier.ts always recomputes those two fresh from their own small local
 * files at read time (see its doc comment), so a change to either takes
 * effect immediately without waiting on a snapshot rebuild. What's written
 * here is exactly the slow, throttle-prone, network-fetched part.
 */
async function fetchOneCountry(country) {
  const { iso3, iso2, name, qid, wikiTitle } = country;

  const [worldBank, timeSeries, wikidata, wikipedia, trade] = await Promise.allSettled([
    fetchLatestIndicators(iso3, ALL_INDICATOR_CODES),
    fetchTimeSeries(iso3, CHART_INDICATOR_CODES),
    qid ? fetchDossierFacts(qid) : notInIsoTable(iso3),
    wikiTitle ? fetchSummary(wikiTitle) : notInIsoTable(iso3),
    fetchTradeSummary(iso3),
  ]).then((results) => results.map(toResult));

  // Weather needs the capital's coordinates, FX needs the currency code —
  // both already resolved on `wikidata`, so these run after it rather than
  // duplicating the SPARQL call. Same order dossier.ts uses.
  const coords = wikidata.ok ? wikidata.data.capitalCoordinates : null;
  const currencyCode = wikidata.ok ? wikidata.data.currencyCode : null;
  const [weather, fx] = await Promise.allSettled([
    coords
      ? fetchCapitalWeather(coords.lat, coords.lng)
      : Promise.resolve({ ok: false, reason: "No capital coordinates available" }),
    fetchRate(currencyCode),
  ]).then((results) => results.map(toResult));

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
    // Placeholder values — getDossier() in lib/atlas/dossier.ts overwrites
    // both of these on every read, never trusting what's on disk here. Kept
    // in the written file only so it matches the CountryDossier shape for
    // anything that reads the file directly (e.g. debugging, du -sh).
    famousPeople: { ok: true, data: [] },
    overrides: getOverrides(iso3),
    capturedAt: new Date().toISOString(),
  };
}

async function loadAlreadyCaptured() {
  try {
    const files = await readdir(COUNTRIES_DIR);
    return new Set(files.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")));
  } catch {
    return new Set();
  }
}

async function saveCountry(iso3, data) {
  await mkdir(COUNTRIES_DIR, { recursive: true });
  // Compact, not pretty-printed — these files are generated and read by
  // code, never hand-edited, and timeSeries alone is ~30-90KB of mostly
  // {"year":"1961","value":null} pairs pretty-printing would roughly double.
  await writeFile(countryPath(iso3), JSON.stringify(data), "utf-8");
}

async function buildCountries({ limit, only, force }) {
  const already = force ? new Set() : await loadAlreadyCaptured();
  let processed = 0;
  let failed = 0;

  for (const country of ISO_COUNTRIES) {
    if (processed >= limit) break;
    if (only && !only.has(country.iso3)) continue;
    if (already.has(country.iso3)) continue;

    process.stdout.write(`${country.iso3} (${country.name})... `);
    const started = Date.now();
    try {
      const data = await fetchOneCountry(country);
      await saveCountry(country.iso3, data);
      const okCount = ["worldBank", "timeSeries", "wikidata", "wikipedia", "trade", "weather", "fx"].filter(
        (k) => data[k].ok
      ).length;
      console.log(`${okCount}/7 sources ok, ${((Date.now() - started) / 1000).toFixed(1)}s`);
    } catch (err) {
      failed++;
      console.log(`FAILED (${err.message}) — will retry on next run`);
    }
    processed++;
    await sleep(PAUSE_MS);
  }

  const total = ISO_COUNTRIES.length;
  const done = (await loadAlreadyCaptured()).size;
  console.log(`\nCountries: ${done}/${total} captured in ${COUNTRIES_DIR} (${failed} failure(s) this run).`);
}

async function buildRankings() {
  console.log("\nFetching all-country rankings (shared across every dossier + the plate)...");
  const started = Date.now();
  const rankings = await computeAllRankings();
  const asObject = Object.fromEntries(rankings.entries());
  const okCount = Object.values(asObject).filter((r) => r.ok).length;
  await mkdir(path.dirname(RANKINGS_PATH), { recursive: true });
  await writeFile(
    RANKINGS_PATH,
    JSON.stringify({ capturedAt: new Date().toISOString(), rankings: asObject }),
    "utf-8"
  );
  console.log(
    `Rankings: ${okCount}/${Object.keys(asObject).length} indicators ok, ${RANKINGS_PATH}, ${(
      (Date.now() - started) / 1000
    ).toFixed(1)}s`
  );
}

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : Infinity;
  const onlyIdx = args.indexOf("--only");
  const only = onlyIdx >= 0 ? new Set(args[onlyIdx + 1].split(",").map((s) => s.toUpperCase())) : null;
  const force = args.includes("--force");
  const skipRankings = args.includes("--skip-rankings");
  const skipCountries = args.includes("--skip-countries");

  if (!skipCountries) {
    await buildCountries({ limit, only, force });
  }
  if (!skipRankings) {
    await buildRankings();
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
