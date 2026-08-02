#!/usr/bin/env node
// Generates lib/atlas/comtrade-codes.ts — a committed static map, the same
// pattern as lib/atlas/iso-countries.ts (via build-iso.mjs).
//
// UN Comtrade does NOT use plain UN M49 codes for `reporterCode` /
// `partnerCode`. It has its own code space that mostly agrees with M49 but
// keeps expired historical entries alongside the current one — e.g. India
// is 699 today, but 356 ("India (...1974)", India excluding Sikkim) is a
// separate, expired reporter still sitting in the same list. Confirmed live
// 2026-08-02 against:
//   https://comtradeapi.un.org/files/v1/app/reference/Reporters.json
//   https://comtradeapi.un.org/files/v1/app/reference/partnerAreas.json
// Both are public, no API key, and each row carries an ISO3
// (`reporterCodeIsoAlpha3` / `PartnerCodeIsoAlpha3`) plus `isGroup` and an
// optional `entryExpiredDate`. Keeping only `isGroup === false` and no
// `entryExpiredDate` gives exactly one current code per ISO3 (219 reporters,
// no duplicates, confirmed at generation time).
//
// Usage: node scripts/atlas/build-comtrade-codes.mjs
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const OUT_PATH = path.join(repoRoot, "lib", "atlas", "comtrade-codes.ts");

const USER_AGENT = "AtlasCountryExplorer/1.0 (https://sushantgundla.com/atlas)";

const REAL_ISO3 = /^[A-Z]{3}$/;

/**
 * ISO3 -> single current code. Only used for `reporterCode`, where the
 * request needs exactly one code per country. Reporters.json turned out to
 * have zero collisions (219 countries, each with one current, non-group
 * entry) — this throws if that ever stops being true, rather than silently
 * picking one.
 */
async function fetchReporterMap(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const body = await res.json();
  const rows = [];
  const seenIso3 = new Map();
  for (const row of body.results) {
    if (row.isGroup || row.entryExpiredDate) continue;
    const iso3 = row.reporterCodeIsoAlpha3;
    if (!iso3 || !REAL_ISO3.test(iso3)) continue;
    if (seenIso3.has(iso3)) {
      throw new Error(
        `Duplicate active reporter for ${iso3}: codes ${seenIso3.get(iso3)} and ${row.reporterCode} — the "one current code per ISO3" assumption just broke, stop and look at ${url}`
      );
    }
    seenIso3.set(iso3, row.reporterCode);
    rows.push({ iso3, code: row.reporterCode });
  }
  rows.sort((a, b) => a.iso3.localeCompare(b.iso3));
  return rows;
}

/**
 * code -> {iso3, name}. Only ever used in this direction (joining a trade
 * response row's numeric partnerCode to a name), so — unlike reporters —
 * more than one active code CAN legitimately point at the same ISO3
 * (confirmed live: France has both 250 "Metropolitan France" and 251
 * "France"; Switzerland, Norway and the USA have similar pairs). That is
 * fine here and does not need resolving, only excluding the handful of
 * pseudo-ISO3 aggregate rows Comtrade left marked isGroup:false anyway
 * (e.g. "A79" for "Rest of America, nes").
 */
async function fetchPartnerCodeMap(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const body = await res.json();
  const rows = [];
  for (const row of body.results) {
    if (row.isGroup || row.entryExpiredDate) continue;
    const iso3 = row.PartnerCodeIsoAlpha3;
    if (!iso3 || !REAL_ISO3.test(iso3)) continue;
    rows.push({ code: row.PartnerCode, iso3, name: row.text });
  }
  rows.sort((a, b) => a.code - b.code);
  return rows;
}

function render(reporters, partnerCodes) {
  const reporterLines = reporters
    .map((r) => `  ${JSON.stringify(r.iso3)}: ${r.code},`)
    .join("\n");
  const partnerLines = partnerCodes
    .map((r) => `  ${r.code}: { iso3: ${JSON.stringify(r.iso3)}, name: ${JSON.stringify(r.name)} },`)
    .join("\n");

  return `// GENERATED FILE — do not hand-edit.
// Produced by scripts/atlas/build-comtrade-codes.mjs from UN Comtrade's own
// reference lists. Re-run with: node scripts/atlas/build-comtrade-codes.mjs
//
// UN Comtrade's reporterCode/partnerCode are NOT plain UN M49 — they are
// Comtrade's own code space, which keeps expired historical entries (e.g.
// India 356, pre-1975, alongside current India 699) and, for partners, more
// than one active code per country (e.g. France is both 250 and 251). See
// build-comtrade-codes.mjs for the full story and how each map handles that.

/** ISO3 -> Comtrade's current reporterCode (used as the request parameter).
 * Exactly one current code per country — collisions here would mean the
 * generator script needs re-checking, not this file. */
export const REPORTER_CODE_BY_ISO3: Readonly<Record<string, number>> = {
${reporterLines}
}

/** Comtrade partnerCode -> {iso3, name}, for joining a trade response row's
 * numeric partnerCode (partnerDesc is always null in the actual data). More
 * than one code can point at the same ISO3 — that's fine, this direction
 * only needs to resolve a specific code, never enumerate a country's codes. */
export const PARTNER_BY_CODE: Readonly<Record<number, { iso3: string; name: string }>> = {
${partnerLines}
}
`;
}

async function main() {
  console.log("Fetching Comtrade reference lists...");
  const [reporters, partnerCodes] = await Promise.all([
    fetchReporterMap("https://comtradeapi.un.org/files/v1/app/reference/Reporters.json"),
    fetchPartnerCodeMap("https://comtradeapi.un.org/files/v1/app/reference/partnerAreas.json"),
  ]);
  console.log(`Reporters: ${reporters.length} current ISO3 codes.`);
  console.log(`Partner codes: ${partnerCodes.length} current codes.`);

  const out = render(reporters, partnerCodes);
  await writeFile(OUT_PATH, out, "utf-8");
  console.log(`Wrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
