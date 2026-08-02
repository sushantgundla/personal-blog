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
//   node scripts/atlas/build-snapshot.mjs --patch-neighbours   (see below)
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ISO_COUNTRIES } from "../../lib/atlas/iso-countries.ts";
import { ALL_INDICATOR_CODES, CHART_INDICATOR_CODES } from "../../lib/atlas/indicators.ts";
import { fetchLatestIndicators, fetchTimeSeries } from "../../lib/atlas/sources/worldbank.ts";
import { fetchDossierFacts, fetchNeighbours } from "../../lib/atlas/sources/wikidata.ts";
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

// A durable "is this still alive" marker, independent of any log file or
// whoever's watching a terminal. Written after every country and on every
// exit path (normal completion, uncaught exception, SIGTERM/SIGINT) so a
// human or another agent checking hours later can tell the difference
// between "still running", "finished", and "died" from one file, without
// needing to have been watching when it happened. `cat` this file — a
// `status: "running"` with an old `updatedAt` (nothing else updates it) is
// the signal that it silently died rather than exiting cleanly.
const STATUS_PATH = path.join(repoRoot, "content", "atlas", "snapshot", ".sweep-status.json");

async function writeStatus(status, extra = {}) {
  try {
    await mkdir(path.dirname(STATUS_PATH), { recursive: true });
    await writeFile(
      STATUS_PATH,
      JSON.stringify({ status, updatedAt: new Date().toISOString(), pid: process.pid, ...extra }),
      "utf-8"
    );
  } catch {
    // Best-effort — never let the status marker itself break the sweep.
  }
}

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, async () => {
    await writeStatus("stopped", { reason: `received ${signal}` });
    process.exit(0);
  });
}
process.on("uncaughtException", async (err) => {
  await writeStatus("crashed", { reason: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});

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

const SOURCE_KEYS = ["worldBank", "timeSeries", "wikidata", "wikipedia", "trade", "weather", "fx"];

// How many countries run at once. Tried 3 on a fresh batch of 9 countries
// on 2026-08-02 — AUT and AUS (already-warm/fast countries) finished in
// under 5s each, but AZE/BHR/BRB then took 477s/548s/611s, far worse than
// this same script's ~60-80s/country sequential baseline. The World Bank is
// clearly not just rate-limited by request count (which the shared
// semaphore in worldbank.ts already caps at 4 in flight) but also degrades
// under simultaneous *load* from multiple countries' batches competing at
// once — concurrency made it worse, not better, exactly the case team-lead
// asked to hear about. Left at 1 (sequential). Do not raise this without
// re-testing on a fresh sample first — the failure mode here is silent
// (everything still "succeeds", just 5-10x slower), so watch elapsed time,
// not just the ok-count, before trusting a higher value again.
const CONCURRENCY = 1;

/**
 * One country: fetch, then only write the file if at least one source came
 * back ok. A country where literally everything failed (network blip, a
 * genuinely bad run) is *not* recorded as captured, so the next run retries
 * it automatically instead of silently freezing it in a broken state — this
 * is different from a country that's honestly missing from some sources
 * (Taiwan has no World Bank row at all, most countries have no Frankfurter
 * rate) — those are normal partial results and do get written.
 */
async function processOneCountry(country) {
  const started = Date.now();
  const data = await fetchOneCountry(country);
  const okCount = SOURCE_KEYS.filter((k) => data[k].ok).length;
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  if (okCount === 0) {
    console.log(`${country.iso3} (${country.name})... FAILED (0/7 sources ok, ${elapsed}s) — will retry on next run`);
    await writeStatus("running", { lastCountry: country.iso3, lastResult: "failed-0-of-7" });
    return { ok: false };
  }
  await saveCountry(country.iso3, data);
  console.log(`${country.iso3} (${country.name})... ${okCount}/7 sources ok, ${elapsed}s`);
  await writeStatus("running", { lastCountry: country.iso3, lastResult: `${okCount}/7` });
  return { ok: true };
}

/** A fixed-size pool of workers, each pulling the next country off the
 * shared queue as soon as it finishes one — not fixed batches, so one slow
 * country (ATG took 321s under heavy throttling in an earlier run) doesn't
 * hold up the other workers' next pick. */
async function runPool(countries, concurrency) {
  let cursor = 0;
  let failed = 0;

  async function worker() {
    for (;;) {
      const index = cursor++;
      if (index >= countries.length) return;
      const country = countries[index];
      try {
        const result = await processOneCountry(country);
        if (!result.ok) failed++;
      } catch (err) {
        failed++;
        console.log(`${country.iso3} (${country.name})... FAILED (${err.message}) — will retry on next run`);
      }
      await sleep(PAUSE_MS);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return failed;
}

/**
 * Backfills `wikidata.data.neighbours` (Wikidata P47) into every already-
 * captured country file that doesn't have it yet — every file written
 * before 2026-08-03, when neighbours moved from Neighbours.tsx's own live
 * per-request query into fetchDossierFacts. Patches just that one field via
 * a single small SPARQL query per country, not a full country re-fetch —
 * a full re-fetch would waste the World Bank/Comtrade/Wikipedia work that
 * file already has and is much slower for no reason, since fetchNeighbours
 * is exported from wikidata.ts specifically to make this possible.
 *
 * A file whose wikidata source itself is ok:false (no qid, or the earlier
 * fetch failed outright) is skipped — there's no capital-derived qid to
 * query neighbours with, and dossier.ts's getDossier already degrades
 * `undefined` neighbours to "unavailable" the same way as any other missing
 * field, so this is a normal, non-blocking skip, not a failure.
 */
async function patchNeighbours() {
  const captured = await loadAlreadyCaptured();
  let patched = 0;
  let skipped = 0;
  let failed = 0;

  for (const iso3 of captured) {
    const filePath = countryPath(iso3);
    let data;
    try {
      data = JSON.parse(await readFile(filePath, "utf-8"));
    } catch (err) {
      console.log(`${iso3}: FAILED to read/parse (${err.message})`);
      failed++;
      continue;
    }

    if (!data.wikidata?.ok) {
      skipped++;
      continue;
    }
    if (Array.isArray(data.wikidata.data.neighbours)) {
      skipped++;
      continue;
    }

    const country = ISO_COUNTRIES.find((c) => c.iso3 === iso3);
    if (!country) {
      skipped++;
      continue;
    }

    const result = await fetchNeighbours(country.qid);
    data.wikidata.data.neighbours = result.ok ? result.data : [];
    await saveCountry(iso3, data);
    console.log(`${iso3} (${country.name}): ${result.ok ? result.data.length : 0} neighbour(s)${result.ok ? "" : ` — fetch failed (${result.reason}), recorded as empty, will not retry automatically`}`);
    patched++;
    await sleep(1500);
  }

  console.log(`\nNeighbours patch: ${patched} patched, ${skipped} already had it or had no wikidata, ${failed} failed to read.`);
}

async function buildCountries({ limit, only, force }) {
  const already = force ? new Set() : await loadAlreadyCaptured();
  const queue = ISO_COUNTRIES.filter(
    (c) => (!only || only.has(c.iso3)) && !already.has(c.iso3)
  ).slice(0, limit);

  const failed = await runPool(queue, CONCURRENCY);

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
  const patchNeighboursOnly = args.includes("--patch-neighbours");

  await writeStatus("running", { startedAt: new Date().toISOString() });

  if (patchNeighboursOnly) {
    await patchNeighbours();
    await writeStatus("done");
    console.log("\nDone.");
    return;
  }

  if (!skipCountries) {
    await buildCountries({ limit, only, force });
  }
  if (!skipRankings) {
    await buildRankings();
  }

  await writeStatus("done");
  console.log("\nDone.");
}

main().catch(async (err) => {
  console.error(err);
  await writeStatus("crashed", { reason: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
