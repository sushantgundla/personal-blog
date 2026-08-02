#!/usr/bin/env node
// Pre-ship sweep of every indicator code in lib/atlas/indicators.ts.
//
// Runs codes in batches of 20, 10+ seconds apart (the World Bank throttles
// hard — see docs/superpowers/research/country-numbers-catalog.md), against
// a sample of 8 varied countries: a rich one (IND), a sparse one (TUV), one
// entirely absent from the World Bank (TWN, expected to return nothing),
// and five more spanning income levels and regions. Prints which codes
// returned no data for every sampled country, so they can be dropped.
//
// Usage: node scripts/atlas/verify-indicators.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");

const BATCH_SIZE = 20;
const PAUSE_MS = 10_000;

// Countries chosen to span the test matrix: rich data (IND), sparse (TUV),
// absent from the World Bank entirely (TWN — expected all-empty), listed
// but mostly null (PRK), plus a spread of regions/income levels.
const SAMPLE_COUNTRIES = ["IND", "TUV", "TWN", "PRK", "USA", "NGA", "BRA", "DEU"];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Pull every `code(` string out of indicators.ts without needing ts-node. */
function loadIndicatorCodes() {
  const src = readFileSync(
    path.join(repoRoot, "lib", "atlas", "indicators.ts"),
    "utf-8"
  );
  const codes = [];
  const re = /^\s*def\(\s*"([^"]+)"/gm;
  let m;
  while ((m = re.exec(src))) codes.push(m[1]);
  if (codes.length === 0) {
    throw new Error("No indicator codes found — did indicators.ts change shape?");
  }
  return codes;
}

// mrnev=1 (used by the real client in lib/atlas/sources/worldbank.ts) turned
// out to be consistently HTTP 400 for long stretches while verifying live
// on 2026-08-02, even for a single indicator — a server-side flake in that
// specific feature, confirmed by the fact that a plain query with no
// mrnev/mrv param and a date-range query both returned 200 throughout the
// same window. The verify sweep only needs to know "did this code return
// any value recently", so it asks with a date range instead, sidestepping
// the flaky parameter entirely.
const RECENT_YEARS = "2015:2025";

/**
 * One attempt at a batch. Returns `{ rows }` on success, or
 * `{ invalidValue: true }` when the API's response is HTTP 200 but the body
 * is `{"message":[{"id":"120","key":"Invalid value",...}]}` — confirmed live
 * 2026-08-02 that the World Bank returns this (200, not 400) for a single
 * genuinely bad code mixed into an otherwise-valid batch (SH.STA.OWAD.ZS,
 * "Prevalence of obesity" only exists in the Health Equity source, not
 * source=2). This is NOT the random-400 throttling case — it reproduced
 * identically on 3 immediate retries — so it is treated as a fact about the
 * codes, not something to blindly retry past.
 */
async function fetchBatchOnce(iso3, codes) {
  const url =
    `https://api.worldbank.org/v2/country/${iso3}/indicator/${codes.join(";")}` +
    `?source=2&format=json&date=${RECENT_YEARS}&per_page=1000`;
  const res = await fetch(url);
  if (!res.ok) return { httpError: res.status };
  const body = await res.json();
  if (Array.isArray(body)) return { rows: body[1] ?? [] };
  return { invalidValue: true };
}

// Distinguishes two very different "no rows" outcomes so neither gets
// confused with the other:
//  - invalidValue: the API positively confirmed the code is bad. Safe to
//    treat as dead without retrying further.
//  - exhausted: every retry hit a network error or HTTP error (usually 400
//    throttling). This is NOT evidence the code is dead — it means we never
//    got a real answer. Tracked separately (`inconclusive`) so the final
//    report never silently drops a code just because the network had a bad
//    stretch.
async function fetchBatchWithRetry(iso3, codes, attempts = 5) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const result = await fetchBatchOnce(iso3, codes);
      if (result.rows) return result;
      if (result.invalidValue) return result; // not a throttling symptom — don't retry
      // httpError (usually 400) IS throttling wearing a costume — retry with backoff.
    } catch {
      // network error, retry
    }
    if (attempt < attempts - 1) {
      await sleep(3000 * 2 ** attempt + Math.random() * 1000);
    }
  }
  return { exhausted: true };
}

/**
 * Fetch a batch. On a confirmed "Invalid value" OR on retries being
 * exhausted, bisect the batch to isolate exactly which code(s) are the
 * problem instead of writing off every code in the batch.
 */
async function fetchBatch(iso3, codes, inconclusive) {
  const result = await fetchBatchWithRetry(iso3, codes);
  if (result.rows) return result.rows;

  if (codes.length === 1) {
    if (result.invalidValue) {
      console.log(`    ! ${codes[0]} is not a valid source=2 indicator (confirmed by the API, not throttling)`);
    } else {
      console.log(`    ? ${codes[0]} could not be checked — every retry failed (network/throttling, not confirmed dead)`);
      inconclusive?.add(codes[0]);
    }
    return [];
  }
  const mid = Math.ceil(codes.length / 2);
  const left = await fetchBatch(iso3, codes.slice(0, mid), inconclusive);
  await sleep(1500);
  const right = await fetchBatch(iso3, codes.slice(mid), inconclusive);
  return [...left, ...right];
}

async function main() {
  const codes = loadIndicatorCodes();
  console.log(`Verifying ${codes.length} indicator codes against ${SAMPLE_COUNTRIES.length} countries...`);
  console.log(`Sample: ${SAMPLE_COUNTRIES.join(", ")}`);

  const codeHasData = new Map(codes.map((c) => [c, false]));
  const inconclusive = new Set();
  const batches = chunk(codes, BATCH_SIZE);

  for (const iso3 of SAMPLE_COUNTRIES) {
    console.log(`\n--- ${iso3} ---`);
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const rows = await fetchBatch(iso3, batch, inconclusive);
      const returned = new Set(
        rows.filter((r) => r.value !== null && r.value !== undefined).map((r) => r.indicator.id)
      );
      for (const code of batch) {
        if (returned.has(code)) {
          codeHasData.set(code, true);
          inconclusive.delete(code); // a later success clears an earlier network failure
        }
      }
      console.log(
        `  batch ${i + 1}/${batches.length}: ${returned.size}/${batch.length} codes returned a value`
      );
      await sleep(PAUSE_MS);
    }
  }

  const dead = codes.filter((c) => !codeHasData.get(c) && !inconclusive.has(c));
  console.log(`\n${codes.length - dead.length - inconclusive.size} of ${codes.length} codes returned data for at least one sampled country.`);
  if (dead.length > 0) {
    console.log(`\nDrop these ${dead.length} codes (confirmed no data / invalid for source=2, across every sampled country):`);
    for (const code of dead) console.log(`  ${code}`);
  } else {
    console.log("\nNo code was confirmed dead.");
  }
  if (inconclusive.size > 0) {
    console.log(`\n${inconclusive.size} code(s) could not be fully verified (network/throttling exhausted retries, not confirmed dead) — re-run the sweep to settle these:`);
    for (const code of inconclusive) console.log(`  ${code}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
