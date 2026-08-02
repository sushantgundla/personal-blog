#!/usr/bin/env node
// Precomputes content/atlas/famous-people.json — the top 12 people per
// country by Wikipedia sitelink count, with portraits.
//
// This is NOT run live in the ISR path: the query took 26.8s for India in
// testing, and re-testing it here (2026-08-02) took 42s — it scales with
// how many people hold citizenship of a country, so China/USA/Indonesia/
// Brazil are the slow ones and most small/medium countries resolve in a
// few seconds. A 60s AbortController timeout per country keeps a single
// slow country from hanging the whole run.
//
// Resumable by design: it reads the existing output file first and skips
// any ISO3 already present, so a run that is interrupted (or a slow country
// that times out) can just be re-run — nothing already captured is re-fetched.
// Writes the file after every country, not just at the end, so a partial
// run is still useful output.
//
// Usage: node scripts/atlas/build-people.mjs [--limit N] [--only ISO3,ISO3]
import { readFileSync } from "node:fs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const OUT_PATH = path.join(repoRoot, "content", "atlas", "famous-people.json");
const ISO_PATH = path.join(repoRoot, "lib", "atlas", "iso-countries.ts");

const USER_AGENT =
  "AtlasCountryExplorer/1.0 (https://sushantgundla.com/atlas; contact: atlas@sushantgundla.com)";
const TIMEOUT_MS = 60_000;
const PAUSE_MS = 2_000;
const PEOPLE_PER_COUNTRY = 12;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Wikidata's Special:FilePath values come back as http:// routinely, which
// broke next/image (next.config.js only allows https:// in
// images.remotePatterns). Same fix as lib/atlas/sources/wikidata.ts.
function toHttps(url) {
  if (!url) return null;
  return url.startsWith("http://") ? `https://${url.slice(7)}` : url;
}

/** Pull {iso3, qid, name} out of iso-countries.ts without compiling TS. */
function loadCountries() {
  const src = readFileSync(ISO_PATH, "utf-8");
  const re = /\{\s*iso3:\s*"([^"]+)",\s*iso2:\s*"[^"]*",\s*m49:\s*(?:"([^"]*)"|undefined),\s*name:\s*"([^"]+)",\s*qid:\s*"([^"]+)"/g;
  const out = [];
  let m;
  while ((m = re.exec(src))) {
    out.push({ iso3: m[1], name: m[3], qid: m[4] });
  }
  return out;
}

function query(qid) {
  return `SELECT ?person ?personLabel ?personDescription ?sitelinks ?image WHERE {
  ?person wdt:P31 wd:Q5;
          wdt:P27 wd:${qid};
          wikibase:sitelinks ?sitelinks.
  OPTIONAL { ?person wdt:P18 ?image }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?sitelinks)
LIMIT ${PEOPLE_PER_COUNTRY}`;
}

async function fetchPeople(qid) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query(qid))}`;
    const res = await fetch(url, {
      headers: { Accept: "application/sparql-results+json", "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    return body.results.bindings.map((row) => ({
      qid: row.person.value.split("/").pop(),
      name: row.personLabel?.value ?? "Unknown",
      description: row.personDescription?.value ?? null,
      imageUrl: toHttps(row.image?.value ?? null),
      occupations: [],
    }));
  } finally {
    clearTimeout(timer);
  }
}

/** Fixes http:// image URLs already captured on disk from before toHttps()
 * existed, so a rerun heals the file instead of leaving old entries broken. */
function normalizeExisting(data) {
  let fixed = 0;
  for (const people of Object.values(data)) {
    for (const person of people) {
      if (person.imageUrl && person.imageUrl.startsWith("http://")) {
        person.imageUrl = toHttps(person.imageUrl);
        fixed++;
      }
    }
  }
  return fixed;
}

async function loadExisting() {
  try {
    const raw = await readFile(OUT_PATH, "utf-8");
    const data = JSON.parse(raw);
    const fixed = normalizeExisting(data);
    if (fixed > 0) {
      console.log(`Normalized ${fixed} http:// image URL(s) already on disk to https://.`);
    }
    return data;
  } catch {
    return {};
  }
}

async function save(data) {
  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : Infinity;
  const onlyIdx = args.indexOf("--only");
  const only = onlyIdx >= 0 ? new Set(args[onlyIdx + 1].split(",")) : null;

  const countries = loadCountries();

  const data = await loadExisting();
  await save(data); // persist any http:// -> https:// fixes even if nothing new gets fetched below
  let processed = 0;

  for (const country of countries) {
    if (processed >= limit) break;
    if (only && !only.has(country.iso3)) continue;
    if (data[country.iso3]) continue; // already captured — resumable

    process.stdout.write(`${country.iso3} (${country.name})... `);
    const started = Date.now();
    try {
      const people = await fetchPeople(country.qid);
      data[country.iso3] = people;
      console.log(`${people.length} people, ${((Date.now() - started) / 1000).toFixed(1)}s`);
    } catch (err) {
      console.log(`FAILED (${err.message}) — will retry on next run`);
    }
    processed++;
    await save(data); // checkpoint after every country
    await sleep(PAUSE_MS);
  }

  console.log(`\nDone. ${Object.keys(data).length}/${countries.length} countries captured in ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
