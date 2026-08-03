#!/usr/bin/env node
// The real gate for the learning section's question generators.
//
// This project has no test runner — `lib/atlas/__tests__` and
// `lib/atlas/learn/__tests__` are written runner-ready but have never been
// executed, and `npm run lint` does not work because ESLint was never
// installed. So §11 of docs/superpowers/specs/2026-08-03-atlas-learn-design.md
// makes *this* script the thing that has to actually pass: it builds 500
// questions per game against the committed deck and asserts every correctness
// rule in §6 on every one of them.
//
// Usage, from the repo root, no flags:
//
//   node scripts/atlas/learn-selfcheck.mjs
//
// It imports the real TypeScript under lib/atlas/learn/ directly — the same
// code the route handler runs, not a plain-JS restatement of it. Node strips
// the types; `ts-resolve-hook.mjs` teaches Node's resolver that an
// extensionless relative import like `../hash` means `../hash.ts`. That hook
// is registered below with `module.register` rather than being asked for on
// the command line, so the command above needs no `--experimental-loader`
// and the script can be run (and remembered) as one word.
//
// Exit code is 0 only if every invariant passes. Every failure names the
// question that broke it and what the value was.
import { register } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");

// lib/atlas/learn/deck.ts resolves the deck against process.cwd(), so the
// script must run as if from the repo root however it was invoked.
process.chdir(repoRoot);

// Two warnings would otherwise bury the pass/fail lines this script exists to
// print, and neither is actionable here:
//   - DEP0205, `module.register()` is deprecated in favour of
//     `registerHooks()`. That replacement takes synchronous hooks, and
//     ts-resolve-hook.mjs's `resolve` is async because build-snapshot.mjs
//     already uses it as an `--experimental-loader`. Rewriting a hook owned by
//     another script to quieten a warning here is the wrong trade.
//   - MODULE_TYPELESS_PACKAGE_JSON, emitted once per .ts file imported,
//     because package.json has no `"type": "module"`. Adding one would change
//     how every .mjs and .js in the repo is interpreted.
// Anything else Node wants to say still gets through.
const MUFFLED = ["DEP0205", "MODULE_TYPELESS_PACKAGE_JSON"];
process.removeAllListeners("warning");
process.on("warning", (w) => {
  if (!MUFFLED.includes(w.code ?? "") && !MUFFLED.includes(w.name)) console.warn(w.message);
});

register(pathToFileURL(path.join(__dirname, "ts-resolve-hook.mjs")));

const { buildRound, buildSurprise } = await import(
  pathToFileURL(path.join(repoRoot, "lib/atlas/learn/questions/index.ts")).href
);
const { getDeck } = await import(
  pathToFileURL(path.join(repoRoot, "lib/atlas/learn/deck.ts")).href
);
const { formatMeasure } = await import(
  pathToFileURL(path.join(repoRoot, "lib/atlas/learn/quiz-indicators.ts")).href
);
const { ISO_COUNTRIES } = await import(
  pathToFileURL(path.join(repoRoot, "lib/atlas/iso-countries.ts")).href
);
const { CONFUSABLE_FLAG_PAIRS, areConfusableFlags } = await import(
  pathToFileURL(path.join(repoRoot, "lib/atlas/learn/confusable.ts")).href
);

// ---------------------------------------------------------------- harness

let failures = 0;

/**
 * One invariant, one line of output. `problems` is a list of human-readable
 * strings; an empty list is a pass. Up to three are printed in full so a
 * failure says which question broke and how, not just that something did.
 */
function check(name, problems, detail = "") {
  if (problems.length === 0) {
    console.log(`PASS  ${name}${detail ? `  (${detail})` : ""}`);
    return;
  }
  failures++;
  console.error(`FAIL  ${name}  — ${problems.length} problem(s)`);
  for (const p of problems.slice(0, 3)) console.error(`        ${p}`);
  if (problems.length > 3) console.error(`        ...and ${problems.length - 3} more`);
}

// ------------------------------------------------------------ deck lookups

const deck = await getDeck();
const indicatorByCode = new Map(deck.indicators.map((i) => [i.code, i]));
const countryByIso3 = new Map(deck.countries.map((c) => [c.iso3, c]));
const realIso3 = new Set(ISO_COUNTRIES.map((c) => c.iso3));

/** World Bank aggregates that must never be treated as a country. */
const AGGREGATES = ["WLD", "EUU", "HIC", "OED", "ARB", "LMY", "MIC", "IBT", "EAP"];

function valueOf(code, iso3) {
  const row = deck.values[code];
  return row ? (row[iso3] ?? null) : null;
}

// ------------------------------------------------------------- generation

const GAMES = ["forgery", "higher-lower", "flags"];
const TARGET_PER_GAME = 500;
const PER_ROUND = 20;

const rounds = { forgery: [], "higher-lower": [], flags: [] };
const shortRounds = [];

for (const game of GAMES) {
  let built = 0;
  for (let i = 0; built < TARGET_PER_GAME && i < 80; i++) {
    const round = await buildRound(game, PER_ROUND, `selfcheck-${game}-${i}`);
    rounds[game].push(round);
    built += round.questions.length;
    if (round.questions.length < PER_ROUND) {
      shortRounds.push(`${game} round ${round.roundId} returned ${round.questions.length}/${PER_ROUND}`);
    }
  }
}

const all = {
  forgery: rounds.forgery.flatMap((r) => r.questions),
  "higher-lower": rounds["higher-lower"].flatMap((r) => r.questions),
  flags: rounds.flags.flatMap((r) => r.questions),
};

const surprises = [];
for (let i = 0; i < TARGET_PER_GAME; i++) {
  surprises.push(await buildSurprise(`selfcheck-surprise-${i}`));
}

console.log(
  `Generated ${all.forgery.length} forgery, ${all["higher-lower"].length} higher-lower, ` +
    `${all.flags.length} flags, ${surprises.length} surprise cards ` +
    `from the deck captured ${deck.capturedAt}.\n`
);

for (const game of GAMES) {
  check(
    `${game}: produced at least ${TARGET_PER_GAME} questions`,
    all[game].length >= TARGET_PER_GAME
      ? []
      : [`only ${all[game].length} — a generator is bailing out early`],
    `${all[game].length}`
  );
}

// ------------------------------------------------------------ parsing back
//
// The forged figure only exists as the string printed on the card, so the
// +/-15% and [min, max] rules are checked by reading that string back. That is
// deliberately the strongest place to check them: it tests the number the
// player actually sees, not an intermediate the renderer might have mangled.
//
// Printing rounds, so the round-trip is lossy — worst case is a value just
// over a million, where `formatValue`'s one-decimal "M" compaction can move it
// by up to ~5% ("1.05M" for 1,049,000). Tolerances below are sized for that,
// and are still nowhere near the 30-45% a legal forgery sits at. The
// "rendered figures parse back" check exists to prove the parser itself is
// sound before the other two lean on it.

const SUFFIX = { T: 1e12, B: 1e9, M: 1e6 };

/**
 * Pull the number back out of "1.42B people" / "$3.55T" / "31.2% of land area",
 * along with how much precision the printing threw away.
 *
 * `tolerance` is half the last printed digit — the most the real number can
 * differ from what was printed. "0.1%" could be anything in [0.05, 0.15), so
 * its tolerance is 0.05; "1.42B" carries a tolerance of 5,000,000. Every
 * comparison below is made against that bound rather than a flat percentage,
 * because a flat percentage is far too loose for a big compacted number and
 * far too tight for a small one-decimal percent.
 */
function parseRendered(text) {
  // The multiplier must be flush against the digits — `formatValue` writes
  // "1.42B", never "1.42 B" — otherwise "823,456 TEU" would read as terabytes.
  const m = text.match(/(-?)\$?([\d,]+(?:\.\d+)?)([TBM])?/);
  if (!m) return null;
  const digits = m[2].replace(/,/g, "");
  const n = Number(digits);
  if (!Number.isFinite(n)) return null;
  const mult = m[3] ? SUFFIX[m[3]] : 1;
  const dot = digits.indexOf(".");
  const decimals = dot === -1 ? 0 : digits.length - dot - 1;
  return {
    value: (m[1] === "-" ? -1 : 1) * n * mult,
    tolerance: 0.5 * Math.pow(10, -decimals) * mult,
  };
}

/** The figure part of an option's text: "Label — <figure> (2024)". */
function figureOf(text) {
  const sep = text.indexOf(" — ");
  const rest = sep === -1 ? text : text.slice(sep + 3);
  return rest.replace(/\s*\(\d{4}\)\s*$/, "");
}

// --------------------------------------------------- checks: every question

const everyQuestion = [...all.forgery, ...all["higher-lower"], ...all.flags];

{
  const problems = [];
  for (const q of everyQuestion) {
    const isos = [];
    if (q.game === "forgery") isos.push(q.country.iso3);
    if (q.game === "higher-lower") for (const o of q.options) isos.push(o.iso3);
    if (q.game === "flags") for (const o of q.options) isos.push(o.iso3);
    for (const iso of isos) {
      if (AGGREGATES.includes(iso)) {
        problems.push(`${q.id}: aggregate "${iso}" used as a country`);
      } else if (!realIso3.has(iso)) {
        problems.push(`${q.id}: "${iso}" is not in lib/atlas/iso-countries.ts`);
      }
    }
  }
  check("no World Bank aggregate is ever treated as a country", problems);
}

{
  // The hard sovereign filter. Bouvet Island flies Norway's flag, Heard Island
  // and McDonald Islands flies Australia's, United States Minor Outlying
  // Islands flies the USA's — any of them as a distractor gives a flag card two
  // identical pictures and no correct answer. Antarctica has no flag, and
  // thirty-odd territories cannot fairly be named or compared on GDP. This
  // check must fail loudly if a future change lets one back in.
  const sovereign = new Set(deck.countries.filter((c) => c.sovereign).map((c) => c.iso3));
  const problems = [];
  for (const q of everyQuestion) {
    const isos = [];
    if (q.game === "forgery") isos.push(q.country.iso3);
    else for (const o of q.options) isos.push(o.iso3);
    for (const iso of isos) {
      if (!sovereign.has(iso)) {
        problems.push(`${q.id}: "${iso}" (${countryByIso3.get(iso)?.name ?? "?"}) is not a sovereign state`);
      }
    }
  }
  for (const card of surprises) {
    if (!sovereign.has(card.iso3)) {
      problems.push(`surprise ${card.iso3} (${card.name}) is not a sovereign state`);
    }
  }
  check(
    "only sovereign states ever appear — as an answer, a distractor or a card",
    problems,
    `${sovereign.size} sovereign of ${deck.countries.length} in the deck`
  );
}

{
  const expected = { forgery: 3, "higher-lower": 2, flags: 4 };
  const problems = [];
  for (const q of everyQuestion) {
    if (q.options.length !== expected[q.game]) {
      problems.push(`${q.id}: ${q.options.length} options, expected ${expected[q.game]}`);
    }
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) {
      problems.push(`${q.id}: answer index ${q.answer} is out of range`);
    }
  }
  check("answer is always a valid index and the option count is exact", problems);
}

{
  const problems = [];
  for (const q of everyQuestion) {
    if (q.provenance.length === 0) problems.push(`${q.id}: no provenance`);
    for (const p of q.provenance) {
      if (p.source !== "World Bank" && p.source !== "Wikidata") {
        problems.push(`${q.id}: unknown source "${p.source}"`);
      }
      if (!p.href || !p.href.startsWith("/atlas/")) {
        problems.push(`${q.id}: provenance href "${p.href}" is not a dossier link`);
      }
      // A World Bank figure without its year is exactly the failure §6 is
      // about — health and education data lag three to five years. A flag
      // has no year and honestly says so.
      if (p.source === "World Bank" && !/^\d{4}$/.test(String(p.year))) {
        problems.push(`${q.id}: World Bank provenance year is "${p.year}"`);
      }
    }
  }
  check("every question names its source, and every World Bank fact its year", problems);
}

{
  const problems = [];
  for (const q of everyQuestion) {
    if (!q.prompt || q.prompt.trim().length === 0) problems.push(`${q.id}: empty prompt`);
    if (!q.verdict.headline) problems.push(`${q.id}: verdict has no headline`);
    if (q.verdict.rows.length !== q.options.length) {
      problems.push(`${q.id}: ${q.verdict.rows.length} verdict rows for ${q.options.length} options`);
    }
    for (const r of q.verdict.rows) {
      if (!r.label || !r.value) problems.push(`${q.id}: verdict row is missing a label or value`);
      if (!r.href) problems.push(`${q.id}: verdict row "${r.label}" has no dossier link`);
      // §6: "A missing value is never a question. No dashes, no zeroes
      // standing in for absence." `formatValue` prints an em dash for a
      // missing number, so one appearing where a figure belongs means a null
      // reached a card. Checked on the two games that carry numbers; a flag
      // card's rows carry facts, and there a lone dash honestly means
      // Wikidata knows nothing else about that country.
      if (q.game !== "flags" && /(^|[\s(])—([\s)]|$)/.test(r.value)) {
        problems.push(`${q.id}: verdict row "${r.label}" prints a missing-value dash`);
      }
    }
    if (q.game === "forgery") {
      for (const opt of q.options) {
        if (/—/.test(figureOf(opt.text))) {
          problems.push(`${q.id}: option "${opt.text}" has no real figure`);
        }
      }
    }
    const blob = JSON.stringify(q);
    for (const bad of ["NaN", "undefined", "$NaN", "Infinity"]) {
      if (blob.includes(bad)) problems.push(`${q.id}: rendered text contains "${bad}"`);
    }
  }
  check("every verdict shows a real number per option, with a dossier link", problems);
}

{
  const problems = [];
  for (const game of GAMES) {
    const a = JSON.stringify(await buildRound(game, 10, "determinism"));
    const b = JSON.stringify(await buildRound(game, 10, "determinism"));
    if (a !== b) problems.push(`${game}: two rounds from seed "determinism" differ`);
    const c = JSON.stringify(await buildRound(game, 10, "determinism-other"));
    if (a === c) problems.push(`${game}: two different seeds produced an identical round`);
  }
  const s1 = JSON.stringify(await buildSurprise("determinism"));
  const s2 = JSON.stringify(await buildSurprise("determinism"));
  if (s1 !== s2) problems.push("surprise: two cards from seed \"determinism\" differ");
  check("the same seed always produces an identical round", problems);
}

// ---------------------------------------------------------- checks: forgery

{
  const truthProblems = [];
  const bandProblems = [];
  const boundsProblems = [];
  const shareProblems = [];
  const labelProblems = [];
  const roundTripProblems = [];
  let minRelDiff = Infinity;
  let differentSections = 0;

  for (const q of all.forgery) {
    const code = q.id.split(":")[2];
    const indicator = indicatorByCode.get(code);
    if (!indicator) {
      truthProblems.push(`${q.id}: forged indicator "${code}" is not in the deck`);
      continue;
    }
    const entry = valueOf(code, q.country.iso3);
    if (!entry) {
      truthProblems.push(`${q.id}: no deck value for ${code} / ${q.country.iso3}`);
      continue;
    }
    const truth = entry[0];

    // Every option that is not the answer must render the deck's real value,
    // character for character. Two of three statements being true is the whole
    // premise of the game. The label is matched against *every* measure that
    // carries it, never just the first — three separate World Bank codes share
    // the label "Military spending".
    const trueSides = [];
    q.options.forEach((opt, i) => {
      if (i === q.answer) return;
      const candidates = deck.indicators.filter((ind) => ind.label === opt.measure);
      const match = candidates.find((ind) => {
        const v = valueOf(ind.code, q.country.iso3);
        return v !== null && figureOf(opt.text) === formatMeasure(ind, v[0]);
      });
      if (!match) {
        truthProblems.push(
          `${q.id}: option ${i} "${opt.text}" does not match any real value for ${q.country.iso3}`
        );
        return;
      }
      trueSides.push({ opt, indicator: match, truth: valueOf(match.code, q.country.iso3)[0] });
    });

    const forged = q.options[q.answer];
    if (forged.measure !== indicator.label) {
      truthProblems.push(`${q.id}: answer option is "${forged.measure}", expected "${indicator.label}"`);
    }
    if (figureOf(forged.text) === formatMeasure(indicator, truth)) {
      truthProblems.push(`${q.id}: the forged line prints the true value`);
    }

    // Round-trip the two true options first. If the parser is wrong, this is
    // where it shows up, and the two checks after it are known to be reading
    // numbers correctly rather than agreeing with a broken parser.
    for (const side of trueSides) {
      const parsed = parseRendered(figureOf(side.opt.text));
      if (parsed === null) {
        roundTripProblems.push(`${q.id}: could not parse "${side.opt.text}"`);
        continue;
      }
      // The 1e-9 is float slack: a value of exactly 71.85 prints as "71.9",
      // and 71.9 - 71.85 comes out a hair over 0.05 in binary floating point.
      if (Math.abs(parsed.value - side.truth) > parsed.tolerance * (1 + 1e-9)) {
        roundTripProblems.push(
          `${q.id}: "${side.opt.text}" parses to ${parsed.value} (+/-${parsed.tolerance}), ` +
            `deck says ${side.truth}`
        );
      }
    }

    const fake = parseRendered(figureOf(forged.text));
    if (fake === null) {
      roundTripProblems.push(`${q.id}: could not read the figure back out of "${forged.text}"`);
    } else {
      // The real forged value lies within +/-tolerance of what was printed, so
      // the smallest gap it could possibly have from the truth is this. If even
      // that is 15% or more, the rule held. No fudge factor needed.
      const closestGap = Math.max(0, Math.abs(fake.value - truth) - fake.tolerance);
      const relDiff = closestGap / Math.abs(truth);
      if (relDiff < minRelDiff) minRelDiff = relDiff;
      if (relDiff < 0.15) {
        bandProblems.push(
          `${q.id}: forged ~${fake.value} vs true ${truth} is only ` +
            `${(relDiff * 100).toFixed(1)}% apart at best`
        );
      }
      if (
        fake.value - fake.tolerance > indicator.max ||
        fake.value + fake.tolerance < indicator.min
      ) {
        boundsProblems.push(
          `${q.id}: forged ~${fake.value} is outside [${indicator.min}, ${indicator.max}]`
        );
      }
      const isShare =
        indicator.format === "percent" && indicator.min >= 0 && indicator.max <= 100;
      if (isShare && (fake.value + fake.tolerance < 0 || fake.value - fake.tolerance > 100)) {
        shareProblems.push(`${q.id}: share forged to ~${fake.value}, outside [0, 100]`);
      }
    }

    const labels = q.options.map((o) => o.measure);
    if (new Set(labels).size !== labels.length) {
      labelProblems.push(`${q.id}: two options share the label "${labels.join('", "')}"`);
    }

    const sections = [indicator.section].concat(trueSides.map((s) => s.indicator.section));
    if (sections.length === 3 && new Set(sections).size === 3) differentSections++;
  }

  check("forgery: the two unforged statements are the deck's real values", truthProblems);
  check(
    "forgery: the forged figure is never within 15% of the truth",
    bandProblems,
    `closest seen ${(minRelDiff * 100).toFixed(1)}%`
  );
  check("forgery: the forged figure is never outside the measure's [min, max]", boundsProblems);
  check("forgery: a forged percentage share stays inside [0, 100]", shareProblems);
  check("forgery: all three statements use different measures", labelProblems);
  check("forgery: rendered figures parse back to the deck value", roundTripProblems);
  console.log(
    `      note  ${differentSections}/${all.forgery.length} forgery cards drew all three ` +
      `statements from different sections ("where possible", §6)`
  );
}

{
  const problems = [];
  for (const round of rounds.forgery) {
    const seen = new Set();
    for (const q of round.questions) {
      if (seen.has(q.country.iso3)) {
        problems.push(`${round.roundId}: ${q.country.iso3} appears twice`);
      }
      seen.add(q.country.iso3);
    }
  }
  check("forgery: no country appears twice in a round", problems);
}

// ---------------------------------------------------- checks: higher-lower

{
  const problems = [];
  const wordingProblems = [];
  let minRatio = Infinity;
  let maxYearGap = 0;

  for (const q of all["higher-lower"]) {
    const code = q.id.split(":")[2];
    const indicator = indicatorByCode.get(code);
    if (!indicator) {
      problems.push(`${q.id}: indicator "${code}" is not in the deck`);
      continue;
    }
    const a = valueOf(code, q.options[0].iso3);
    const b = valueOf(code, q.options[1].iso3);
    if (!a || !b) {
      problems.push(`${q.id}: a missing value was turned into a question`);
      continue;
    }
    const ratio = Math.max(a[0], b[0]) / Math.min(a[0], b[0]);
    if (!(a[0] > 0 && b[0] > 0)) {
      problems.push(`${q.id}: non-positive values ${a[0]} / ${b[0]}`);
    } else if (ratio < 1.15) {
      problems.push(`${q.id}: near-tie, gap ratio ${ratio.toFixed(3)}`);
    }
    if (ratio < minRatio) minRatio = ratio;

    const gap = Math.abs(Number(a[1]) - Number(b[1]));
    if (!(gap <= 3)) {
      problems.push(`${q.id}: years ${a[1]} vs ${b[1]} are ${gap} apart`);
    }
    if (gap > maxYearGap) maxYearGap = gap;

    const winner = a[0] > b[0] ? 0 : 1;
    if (q.answer !== winner) {
      problems.push(`${q.id}: answer is ${q.answer} but ${winner} holds the greater value`);
    }
    if (q.options[0].iso3 === q.options[1].iso3) {
      problems.push(`${q.id}: a country was compared with itself`);
    }

    // §6: "higherIsBetter is irrelevant here and must not leak into wording."
    const text = [q.prompt, q.verdict.headline, q.verdict.note ?? "", q.measure].join(" ");
    if (/\bbetter\b|\bworse\b|\bbest\b|\bworst\b/i.test(text)) {
      wordingProblems.push(`${q.id}: judgement word in "${text}"`);
    }
    if (!/greater/i.test(q.prompt)) {
      wordingProblems.push(`${q.id}: prompt does not ask which is greater: "${q.prompt}"`);
    }
  }

  check(
    "higher-lower: both values real, gap ratio >= 1.15, years within 3, answer correct",
    problems,
    `tightest gap ${minRatio.toFixed(3)}x, widest year gap ${maxYearGap}`
  );
  check('higher-lower: asks "which is greater", never "better"', wordingProblems);
}

{
  const problems = [];
  for (const round of rounds["higher-lower"]) {
    const seen = new Set();
    for (const q of round.questions) {
      const [x, y] = [q.options[0].iso3, q.options[1].iso3].sort();
      const key = `${x}|${y}`;
      if (seen.has(key)) problems.push(`${round.roundId}: pair ${key} appears twice`);
      seen.add(key);
    }
  }
  check("higher-lower: no pairing repeats in a round", problems);
}

// ----------------------------------------------------------- checks: flags

{
  // Never offer both halves of a confusable pair. Indonesia's flag beside
  // Monaco as a distractor is not a hard question, it is an unanswerable one —
  // the two differ only in aspect ratio.
  const problems = [];
  let pairsSeen = 0;
  for (const q of all.flags) {
    for (let i = 0; i < q.options.length; i++) {
      for (let j = i + 1; j < q.options.length; j++) {
        pairsSeen++;
        if (areConfusableFlags(q.options[i].iso3, q.options[j].iso3)) {
          problems.push(
            `${q.id}: options ${q.options[i].name} and ${q.options[j].name} have near-identical flags`
          );
        }
      }
    }
  }
  check(
    "flags: no question ever contains both halves of a confusable pair",
    problems,
    `${CONFUSABLE_FLAG_PAIRS.length} pairs guarded, ${pairsSeen} option pairs checked`
  );
}

{
  const problems = [];
  // The pool the generator actually draws from: sovereign, and with a flag.
  const pool = deck.countries.filter((c) => c.sovereign && c.flagUrl);
  const flaggedByRegion = new Map();
  for (const c of pool) {
    if (!c.region) continue;
    flaggedByRegion.set(c.region, (flaggedByRegion.get(c.region) ?? 0) + 1);
  }
  let sameRegionCards = 0;
  let eligibleForSameRegion = 0;
  let confusableFallbacks = 0;

  for (const q of all.flags) {
    const isos = q.options.map((o) => o.iso3);
    const names = q.options.map((o) => o.name);
    if (new Set(isos).size !== 4) problems.push(`${q.id}: options are not four distinct countries`);
    if (new Set(names).size !== 4) problems.push(`${q.id}: two options share a name`);

    const answerCountry = countryByIso3.get(q.options[q.answer].iso3);
    if (!answerCountry) {
      problems.push(`${q.id}: the answer is not a deck country`);
      continue;
    }
    if (answerCountry.flagUrl !== q.flagUrl) {
      problems.push(`${q.id}: flagUrl does not belong to the answer`);
    }
    if (!q.flagUrl.startsWith("https://")) {
      problems.push(`${q.id}: flagUrl is not https — next/image will throw`);
    }
    if (!q.flagUrl.includes("width=")) {
      // Without ?width= a Commons Special:FilePath URL serves the raw SVG,
      // which next/image refuses (see lib/atlas/format.ts).
      problems.push(`${q.id}: flagUrl has no ?width= and would serve raw SVG`);
    }

    const region = answerCountry.region;
    if (region && (flaggedByRegion.get(region) ?? 0) >= 4) {
      eligibleForSameRegion++;
      const allSame = q.options.every((o) => countryByIso3.get(o.iso3)?.region === region);
      if (allSame) {
        sameRegionCards++;
        continue;
      }
      // A same-region fallback is legitimate when the confusable rule has
      // eaten the region's candidates. Eight non-confusable candidates is the
      // provable safe bound: no country in CONFUSABLE_FLAG_PAIRS has more than
      // two twins, so picking three can block at most six others. Above that,
      // leaving the region is a real bug.
      const usable = pool.filter(
        (c) =>
          c.region === region &&
          c.iso3 !== answerCountry.iso3 &&
          !areConfusableFlags(answerCountry.iso3, c.iso3)
      );
      if (usable.length >= 8) {
        problems.push(`${q.id}: ${region} has enough flags but a distractor came from elsewhere`);
      } else {
        confusableFallbacks++;
      }
    }
  }
  check(
    "flags: four distinct countries, a usable https flag, distractors from the answer's region",
    problems,
    `${sameRegionCards}/${eligibleForSameRegion} same-region, ${confusableFallbacks} left the region ` +
      `because the confusable rule emptied it`
  );
}

{
  const problems = [];
  for (const round of rounds.flags) {
    const seen = new Set();
    for (const q of round.questions) {
      const iso = q.options[q.answer].iso3;
      if (seen.has(iso)) problems.push(`${round.roundId}: flag ${iso} appears twice`);
      seen.add(iso);
    }
  }
  check("flags: no flag repeats in a round", problems);
}

// -------------------------------------------------------- checks: surprise

{
  const problems = [];
  const tiers = { 1: 0, 2: 0, 3: 0 };

  for (const card of surprises) {
    const m = card.detail.match(/#(\d[\d,]*) of ([\d,]+)$/);
    if (!m) {
      problems.push(`${card.iso3}: detail "${card.detail}" has no "#R of N" rank`);
      continue;
    }
    const rank = Number(m[1].replace(/,/g, ""));
    const outOf = Number(m[2].replace(/,/g, ""));
    const percentile = outOf > 1 ? Math.round(((outOf - rank) / (outOf - 1)) * 100) : 100;

    let tier = null;
    if (outOf >= 60 && (rank <= 3 || rank >= outOf - 2)) tier = 1;
    else if (percentile > 97 || percentile < 3) tier = 2;
    else if (rank <= 10) tier = 3;

    if (tier === null) {
      problems.push(
        `${card.iso3}: "${card.headline}" is #${rank} of ${outOf} — not remarkable under §6`
      );
      continue;
    }
    tiers[tier]++;

    if (!realIso3.has(card.iso3)) problems.push(`${card.iso3}: not a real country`);
    if (!card.href.startsWith("/atlas/")) problems.push(`${card.iso3}: href "${card.href}"`);
    if (!/^\d{4}$/.test(String(card.provenance.year))) {
      problems.push(`${card.iso3}: provenance year "${card.provenance.year}"`);
    }

    // The rank direction is the easiest thing here to get backwards: rank 1
    // is "best", not "highest", so a top-3 infant-mortality rank means the
    // *lowest* infant deaths on Earth.
    const label = card.headline.replace(/^.*? on Earth for /, "");
    const inds = deck.indicators.filter((i) => i.label === label && i.outOf === outOf);
    if (inds.length === 0) {
      problems.push(`${card.iso3}: headline names "${label}", no deck measure with outOf ${outOf}`);
      continue;
    }
    const rankOneIsHighest = inds[0].higherIsBetter !== false;
    const fromTop = rank <= outOf / 2;
    const expectedPlace = fromTop ? rank : outOf - rank + 1;
    const expectedWord = fromTop
      ? rankOneIsHighest
        ? "highest"
        : "lowest"
      : rankOneIsHighest
        ? "lowest"
        : "highest";
    if (!card.headline.startsWith(`${expectedPlace}`)) {
      problems.push(`${card.iso3}: headline "${card.headline}" should count ${expectedPlace} from the end`);
    }
    if (!card.headline.includes(` ${expectedWord} on Earth`)) {
      problems.push(
        `${card.iso3}: headline "${card.headline}" says the wrong direction — ` +
          `rank ${rank} of ${outOf} on a measure where rank 1 is the ` +
          `${rankOneIsHighest ? "highest" : "lowest"} value is "${expectedWord}"`
      );
    }
  }
  check(
    "surprise: every card clears a §6 remarkable bar and names the right direction",
    problems,
    `tier1 ${tiers[1]}, tier2 ${tiers[2]}, tier3 ${tiers[3]}`
  );
}

// ------------------------------------------------------- checks: the deck

{
  const problems = [];
  for (const i of deck.indicators) {
    if (i.outOf < 30) problems.push(`${i.code}: outOf ${i.outOf} is below the 30-reporter bar`);
    if (!(i.min <= i.max)) problems.push(`${i.code}: min ${i.min} > max ${i.max}`);
  }
  for (const code of Object.keys(deck.values)) {
    for (const iso of Object.keys(deck.values[code])) {
      if (!realIso3.has(iso)) problems.push(`${code}: value keyed by non-country "${iso}"`);
    }
  }
  check("deck: every measure clears 30 reporters and every row is a real country", problems);
}

if (shortRounds.length > 0) {
  console.log(`\n${shortRounds.length} round(s) came back short of ${PER_ROUND} questions:`);
  for (const s of shortRounds.slice(0, 5)) console.log(`      ${s}`);
}

console.log("");
if (failures > 0) {
  console.error(`Learn self-check FAILED — ${failures} invariant(s) broken.`);
  process.exit(1);
}
console.log("Learn self-check passed.");
process.exit(0);
