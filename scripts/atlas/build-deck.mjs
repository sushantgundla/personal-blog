#!/usr/bin/env node
// Precomputes content/atlas/learn/deck.json — the one compact file every
// question on /atlas/learn (the mint's training floor) is generated from.
//
// WHY A DECK EXISTS AT ALL
//
// The owner's rule for the learning section is that questions come from the
// server, on request, and the request must be very fast. The raw material is
// already in this repo: content/atlas/snapshot/rankings.json plus the 250
// files in content/atlas/snapshot/countries/. That is roughly 10 MB across
// 251 files, most of it timeSeries pairs no question will ever look at.
// Reading and parsing all of it on a cold Vercel lambda, on a visitor's
// first click, is exactly the 30-95s cold-start problem the snapshot itself
// was built to kill (see scripts/atlas/build-snapshot.mjs's header). Doing
// it again per process, for a quiz, would be repeating the mistake.
//
// So: this script runs offline, reads all of it once, throws away everything
// a question cannot use, and writes one small file. lib/atlas/learn/deck.ts
// reads that file once per server process and holds it in module scope — the
// same pattern lib/atlas/rankings.ts already uses for the snapshot. After the
// first request in a process, generating a question is pure CPU over an
// in-memory object: about a millisecond. See §3.1 of
// docs/superpowers/specs/2026-08-03-atlas-learn-design.md.
//
// deck.json is a SERVER-SIDE artifact. It carries every answer to every
// question that can be asked; it is never sent to the browser.
//
// THE FOUR RULES THIS SCRIPT ENFORCES, SO NO GENERATOR HAS TO
//
// 1. An indicator is only kept if at least MIN_REPORTING_COUNTRIES (30)
//    countries report BOTH a value and a rank. This is the same
//    MIN_RANKABLE_COUNTRIES bar lib/atlas/rankings.ts already enforces: below
//    it, "#7 of 9" reads like a world ranking but is really a ranking across
//    whichever handful of countries happened to report. A dossier withholds
//    the rank there; a quiz must not ask the question at all.
//
// 2. Every row whose iso3 is not a real country in lib/atlas/iso-countries.ts
//    is dropped. The World Bank's `country/all` responses mix in ~78
//    aggregates — "World", "Euro area", "High income", "IDA & IBRD total".
//    buildRanking already filters these, but this script filters again on its
//    own, because if one of them ever reaches a question the quiz is not
//    merely ugly, it is wrong: "which is greater, High income or Chad?".
//
// 3. Every image URL goes through lib/atlas/format.ts's `toHttps` and
//    `commonsThumbnail`. Wikidata stores Commons URLs as literal `http://`,
//    and a bare Special:FilePath URL 301s to the original `.svg`. next/image
//    is https-only and refuses SVG, and it throws rather than degrading —
//    each of those has already taken a live page down once (India's and
//    Taiwan's dossiers). Flags are pinned at width 320.
//
// 4. Currency and motto are excluded outright. Wikidata gives France's
//    currency as "CFP Franc" — true of French Polynesia, wrong for the
//    mainland — and 244 countries have a currency value, an unknown number of
//    them wrong in the same way. A quiz that asserts a wrong fact is worse
//    than a smaller quiz. Mottos fail for a duller reason: only 34 of 250
//    countries have one. Do not add either back.
//
// Node imports the lib/atlas/*.ts catalogues directly (native TypeScript
// type-stripping), the same way build-snapshot.mjs does, so the labels,
// units, sections and the https/thumbnail rules here are literally the ones
// the site renders with — not a second copy drifting out of sync.
//
// Usage: node scripts/atlas/build-deck.mjs   (npm run atlas:deck)
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ISO_COUNTRIES } from "../../lib/atlas/iso-countries.ts";
import { INDICATORS_BY_CODE } from "../../lib/atlas/indicators.ts";
import { toHttps, commonsThumbnail } from "../../lib/atlas/format.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const RANKINGS_PATH = path.join(repoRoot, "content", "atlas", "snapshot", "rankings.json");
const COUNTRIES_DIR = path.join(repoRoot, "content", "atlas", "snapshot", "countries");
const OUT_PATH = path.join(repoRoot, "content", "atlas", "learn", "deck.json");

/**
 * The same bar as MIN_RANKABLE_COUNTRIES in lib/atlas/rankings.ts. Kept as
 * its own constant rather than imported, because the two mean different
 * things that happen to share a number: there, "below this, don't show a
 * rank"; here, "below this, don't ask a question". If either ever moves it
 * should be a deliberate decision about that one, not a shared edit.
 */
const MIN_REPORTING_COUNTRIES = 30;

/** Flags render small; 320px wide is plenty and caps the bytes. */
const FLAG_WIDTH = 320;

/**
 * Indicators that never enter the deck, whatever the >= 30 bar says.
 *
 * These are not bad data — the dossier still shows every one of them, and
 * should. They are measures whose *cross-country comparison* is meaningless,
 * which is a problem unique to a quiz. A dossier displays a number next to
 * the country it belongs to. A quiz asserts: "which of these two is greater",
 * "this country ranks 3rd on Earth". If the ordering underneath that claim is
 * an artefact rather than a fact, the question cannot be answered by knowing
 * anything, and the design doc's rule applies — never ask a question the data
 * cannot honestly support (§6).
 *
 * Add to this list rather than writing a one-off `if` somewhere. The next
 * measure that fails this test should be one line here.
 */
const EXCLUDED_INDICATOR_CODES = new Map([
  [
    "PA.NUS.FCRF",
    // "Exchange rate", local currency per US$. The level is an artefact of how
    // each currency was denominated, nothing about the country. It was
    // producing cards like "Oman — 3rd lowest on Earth for Exchange rate —
    // 0.38" and "Iran — 2nd highest — 42,000". The yen against the pound is
    // not a fact about Japan. Unanswerable by knowledge in higher-or-lower,
    // and untestable as a forged statement.
    "cross-country comparison is meaningless — the level is a denomination artefact",
  ],
  [
    "TT.PRI.MRCH.XD.WD",
    // "Terms of trade", unit "index". Checked against the snapshot before
    // dropping it: 206 countries report, the median is 101.7 and 100 of them
    // sit between 90 and 110, with a min of 52.9 and a max of 168.9. That is
    // the signature of each country being indexed to 100 in its own base
    // year. So the base is shared in name only — ranking countries by it
    // really ranks "who moved most since the base year", which is not what
    // "Terms of trade — index" says to a player. This repo also records no
    // base year at all (lib/atlas/indicators.ts:97 has unit "index" flat),
    // so a question could not state one even if we wanted to, and the
    // reported years are mixed across 2018/2021/2024.
    "an index with no base year the deck can state — the ranking measures change, not level",
  ],
]);

/** ISO3 -> the ISO table row. The membership test for rule 2 above. */
const BY_ISO3 = new Map(ISO_COUNTRIES.map((c) => [c.iso3, c]));

/**
 * The 193 UN member states plus the 2 permanent observers (VAT, PSE) — 195
 * codes. Every other ISO entry in the deck gets `sovereign: false`.
 *
 * WHY THIS EXISTS
 *
 * A flag question needs four options with four distinguishable flags and one
 * correct answer. About a third of the ISO table breaks that outright:
 *
 *   - BVT (Bouvet Island) flies Norway's flag, exactly.
 *   - HMD (Heard Island and McDonald Islands) flies Australia's, exactly.
 *   - UMI (United States Minor Outlying Islands) flies the USA's, exactly.
 *   - ATA (Antarctica) has no official flag at all.
 *   - ALA, PCN, TKL, CCK and ~thirty more are territories no reasonable
 *     player can be asked to name.
 *
 * Show BVT and NOR as two options in one question and there is no correct
 * answer. That is not a rough edge, it is a broken question.
 *
 * WHY IT IS HAND-WRITTEN
 *
 * There is no field in this repo's data that means "sovereign state". The
 * World Bank's country list is the obvious candidate and it is wrong for
 * this: it includes Hong Kong, Puerto Rico, Greenland and Bermuda, and it
 * excludes Taiwan. Wikidata's P31 answers are inconsistent across exactly
 * the disputed cases where consistency matters. UN membership is the one
 * line that is public, dated, and not ours to argue with — so it is written
 * out here, verified against the ISO table on every run.
 *
 * Note TWN (Taiwan) is `false` under this rule, being neither a member nor
 * an observer, even though it has a distinct flag and would make a fine
 * question. That follows from choosing UN membership as the line; it is a
 * known consequence, not an oversight.
 *
 * Source: UN, "Member States" (un.org/en/about-us/member-states), 193
 * members; the Holy See and the State of Palestine are non-member observer
 * states.
 */
const SOVEREIGN_ISO3 = [
  "AFG", "ALB", "DZA", "AND", "AGO", "ATG", "ARG", "ARM", "AUS", "AUT",
  "AZE", "BHS", "BHR", "BGD", "BRB", "BLR", "BEL", "BLZ", "BEN", "BTN",
  "BOL", "BIH", "BWA", "BRA", "BRN", "BGR", "BFA", "BDI", "CPV", "KHM",
  "CMR", "CAN", "CAF", "TCD", "CHL", "CHN", "COL", "COM", "COG", "COD",
  "CRI", "CIV", "HRV", "CUB", "CYP", "CZE", "DNK", "DJI", "DMA", "DOM",
  "ECU", "EGY", "SLV", "GNQ", "ERI", "EST", "SWZ", "ETH", "FJI", "FIN",
  "FRA", "GAB", "GMB", "GEO", "DEU", "GHA", "GRC", "GRD", "GTM", "GIN",
  "GNB", "GUY", "HTI", "HND", "HUN", "ISL", "IND", "IDN", "IRN", "IRQ",
  "IRL", "ISR", "ITA", "JAM", "JPN", "JOR", "KAZ", "KEN", "KIR", "PRK",
  "KOR", "KWT", "KGZ", "LAO", "LVA", "LBN", "LSO", "LBR", "LBY", "LIE",
  "LTU", "LUX", "MDG", "MWI", "MYS", "MDV", "MLI", "MLT", "MHL", "MRT",
  "MUS", "MEX", "FSM", "MDA", "MCO", "MNG", "MNE", "MAR", "MOZ", "MMR",
  "NAM", "NRU", "NPL", "NLD", "NZL", "NIC", "NER", "NGA", "MKD", "NOR",
  "OMN", "PAK", "PLW", "PAN", "PNG", "PRY", "PER", "PHL", "POL", "PRT",
  "QAT", "ROU", "RUS", "RWA", "KNA", "LCA", "VCT", "WSM", "SMR", "STP",
  "SAU", "SEN", "SRB", "SYC", "SLE", "SGP", "SVK", "SVN", "SLB", "SOM",
  "ZAF", "SSD", "ESP", "LKA", "SDN", "SUR", "SWE", "CHE", "SYR", "TJK",
  "TZA", "THA", "TLS", "TGO", "TON", "TTO", "TUN", "TUR", "TKM", "TUV",
  "UGA", "UKR", "ARE", "GBR", "USA", "URY", "UZB", "VUT", "VEN", "VNM",
  "YEM", "ZMB", "ZWE",
  // The two non-member permanent observer states.
  "VAT", "PSE",
];

const SOVEREIGN = new Set(SOVEREIGN_ISO3);

/**
 * A typo in the list above would silently make one country unaskable, which
 * nothing downstream could detect — the flag game would just never deal it.
 * So the run fails loudly instead: every code must exist in the ISO table,
 * there must be no duplicates, and there must be exactly 195 of them.
 */
function checkSovereignList() {
  const unknown = SOVEREIGN_ISO3.filter((iso3) => !BY_ISO3.has(iso3));
  if (unknown.length > 0) {
    throw new Error(
      `SOVEREIGN_ISO3 contains ${unknown.length} code(s) not in lib/atlas/iso-countries.ts: ${unknown.join(", ")}`
    );
  }
  if (SOVEREIGN.size !== SOVEREIGN_ISO3.length) {
    throw new Error(`SOVEREIGN_ISO3 has duplicates (${SOVEREIGN_ISO3.length} entries, ${SOVEREIGN.size} unique)`);
  }
  if (SOVEREIGN.size !== 195) {
    throw new Error(`SOVEREIGN_ISO3 should be 193 UN members + 2 observers = 195, got ${SOVEREIGN.size}`);
  }
}

/**
 * One Commons URL, made safe for next/image, exactly once.
 *
 * The snapshot files already carry `?width=` on most image fields (wikidata.ts
 * applies commonsThumbnail at the source). Passing those through
 * commonsThumbnail again would append a second `&width=` — harmless to
 * Commons, but it makes the URL depend on how many times it happened to be
 * normalised, which is the kind of thing that is impossible to debug later.
 * So a Special:FilePath URL has its query stripped and rebuilt at exactly one
 * known width. A non-Commons URL is left alone apart from the scheme.
 */
function normaliseImageUrl(url, width) {
  const https = toHttps(url ?? null);
  if (!https) return null;
  if (!https.includes("/Special:FilePath/")) return https;
  return commonsThumbnail(https.split("?")[0], width);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf-8"));
}

/**
 * Step 1-3 of §5: every indicator that clears the bar, with its outOf / min /
 * max, plus the per-country [value, year, rank] triples.
 *
 * Returns { indicators, values, dropped } where `dropped` is a list of
 * {code, reason} kept only so the run prints why the catalogue shrank — a
 * silent drop is how a quiz quietly loses half its questions.
 */
function buildIndicators(rankingsFile) {
  const indicators = [];
  const values = {};
  const dropped = [];

  for (const [code, result] of Object.entries(rankingsFile.rankings)) {
    const def = INDICATORS_BY_CODE[code];
    if (!def) {
      dropped.push({ code, reason: "not in the indicator catalogue" });
      continue;
    }
    // Checked before anything else, so an excluded code can never end up in
    // `indicators` or in `values` — there is no later path back in.
    const excluded = EXCLUDED_INDICATOR_CODES.get(code);
    if (excluded) {
      dropped.push({ code, reason: `excluded on purpose: ${excluded}` });
      continue;
    }
    if (!result?.ok) {
      dropped.push({ code, reason: "no ranking in the snapshot" });
      continue;
    }

    const byIso3 = {};
    let count = 0;
    let min = Infinity;
    let max = -Infinity;

    for (const row of result.data.rows) {
      // Rule 2 — aggregates ("World", "Euro area", "High income") are not
      // countries and must never reach a question.
      if (!BY_ISO3.has(row.iso3)) continue;
      // A missing value is never a question, and neither is a value the
      // dossier would show without a rank. Both must be present.
      if (typeof row.value !== "number" || !Number.isFinite(row.value)) continue;
      if (typeof row.rank !== "number") continue;
      if (!row.year) continue;

      byIso3[row.iso3] = [row.value, String(row.year), row.rank];
      count++;
      if (row.value < min) min = row.value;
      if (row.value > max) max = row.value;
    }

    // Rule 1 — the >= 30 bar, enforced once, here.
    if (count < MIN_REPORTING_COUNTRIES) {
      dropped.push({ code, reason: `only ${count} countries report a value and a rank` });
      continue;
    }

    indicators.push({
      code,
      label: def.label,
      unit: def.unit,
      format: def.format,
      higherIsBetter: def.higherIsBetter,
      section: def.section,
      outOf: count,
      min,
      max,
    });
    values[code] = byIso3;
  }

  return { indicators, values, dropped };
}

/**
 * Step 4 of §5: the country fields a question can use, pulled out of each
 * snapshot's `wikidata` source result (note the {ok, data} wrapper — a
 * country whose Wikidata fetch failed still belongs in the deck, it just
 * carries nulls and cannot be a flag question).
 *
 * `name` and `region` come from the ISO table rather than Wikidata, so a
 * question names a country exactly the way the rest of the Atlas does.
 */
function buildCountry(iso, snapshot) {
  const facts = snapshot?.wikidata?.ok ? snapshot.wikidata.data : null;

  const neighbours = Array.isArray(facts?.neighbours)
    ? facts.neighbours
        .map((n) => n?.iso3)
        .filter((iso3) => typeof iso3 === "string" && BY_ISO3.has(iso3) && iso3 !== iso.iso3)
    : [];

  return {
    iso3: iso.iso3,
    name: iso.name,
    region: iso.region ?? null,
    flagUrl: normaliseImageUrl(facts?.flagImageUrl, FLAG_WIDTH),
    capital: facts?.capital ?? null,
    languages: Array.isArray(facts?.officialLanguages) ? facts.officialLanguages : [],
    drivingSide: facts?.drivingSide ?? null,
    tld: facts?.topLevelDomain ?? null,
    neighbours: [...new Set(neighbours)],
    // Not political — a quiz filter. See SOVEREIGN_ISO3 above. Every country
    // stays in the deck; the flag generator filters on this field.
    sovereign: SOVEREIGN.has(iso.iso3),
    // Deliberately absent: currency (wrong for France and an unknown number
    // of others) and motto (only 34 countries have one). See the header.
  };
}

async function buildCountries() {
  const countries = [];
  const missing = [];

  for (const iso of ISO_COUNTRIES) {
    let snapshot;
    try {
      snapshot = await readJson(path.join(COUNTRIES_DIR, `${iso.iso3}.json`));
    } catch {
      // No snapshot file for this country yet. It gets no card, but it can
      // still appear in a higher-or-lower question if the World Bank has a
      // ranked value for it, so it is still worth a name-only entry.
      missing.push(iso.iso3);
      snapshot = null;
    }
    countries.push(buildCountry(iso, snapshot));
  }

  return { countries, missing };
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
  checkSovereignList();
  const rankingsFile = await readJson(RANKINGS_PATH);
  const { indicators, values, dropped } = buildIndicators(rankingsFile);
  const { countries, missing } = await buildCountries();

  const deck = {
    // The deck is only as fresh as the snapshot it was distilled from, so it
    // inherits that timestamp rather than stamping "now" — the floor renders
    // this as "data as of", and "now" would be a lie about the data's age.
    capturedAt: rankingsFile.capturedAt ?? new Date().toISOString(),
    countries,
    indicators,
    values,
  };

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  // Compact, not indented. This is a build artifact read by code and never
  // hand-edited; indenting it would roughly double a file that ships in the
  // deployment bundle.
  await writeFile(OUT_PATH, JSON.stringify(deck), "utf-8");

  const sovereign = countries.filter((c) => c.sovereign);
  const withFlag = countries.filter((c) => c.flagUrl).length;
  const withCapital = countries.filter((c) => c.capital).length;
  const withNeighbours = countries.filter((c) => c.neighbours.length > 0).length;
  const size = (await stat(OUT_PATH)).size;

  console.log(`\nDeck written to ${OUT_PATH}`);
  console.log(`  captured at        ${deck.capturedAt}`);
  console.log(`  file size          ${formatBytes(size)}`);
  console.log(
    `\nIndicators: ${indicators.length} kept, ${dropped.length} dropped ` +
      `(bar: >= ${MIN_REPORTING_COUNTRIES} countries with both a value and a rank)`
  );
  for (const d of dropped.slice(0, 8)) {
    console.log(`  dropped  ${d.code.padEnd(20)} ${d.reason}`);
  }
  if (dropped.length > 8) console.log(`  ...and ${dropped.length - 8} more`);

  console.log(`\nCountries: ${countries.length} in the deck`);
  console.log(`  sovereign          ${sovereign.length} (193 UN members + VAT, PSE)`);
  console.log(`  ...of those, with a flag  ${sovereign.filter((c) => c.flagUrl).length} — the flag game's pool`);
  console.log(`  with a flag        ${withFlag}`);
  console.log(`  with a capital     ${withCapital}`);
  console.log(`  with neighbours    ${withNeighbours}`);
  if (missing.length > 0) {
    console.log(
      `  no snapshot file   ${missing.length} (${missing.slice(0, 8).join(", ")}${
        missing.length > 8 ? ", ..." : ""
      }) — name-only entries`
    );
  }
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
