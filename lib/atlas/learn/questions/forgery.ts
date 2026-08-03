// Spot the forgery — three statements about one country, one fabricated.
//
// This is the game with the most ways to be quietly wrong, so §6 of
// docs/superpowers/specs/2026-08-03-atlas-learn-design.md spells out every
// rule and this file enforces all of them in one place:
//
//   1. The fake is a true value times a factor in [1.45, 2.20] or [0.45, 0.70].
//   2. Reject and redraw if it lands within +/-15% of the truth. A player who
//      "gets it wrong" on a 12% difference has not learned anything; they were
//      asked a question with no answer.
//   3. Reject and redraw if it falls outside the indicator's [min, max] across
//      every country. Nobody is fooled by a life expectancy of 160, and a card
//      that prints one stops being a test and starts being a joke.
//   4. Percentages that are genuine shares clamp to [0, 100]; if the clamp
//      pushes the fake back inside the +/-15% band, that measure is abandoned
//      for this country rather than shipped.
//   5. The two true statements are different measures, ideally from different
//      sections, so the card is not three flavours of the same fact.
//   6. After ten failed draws for a country, move on. **A forgery that failed
//      its checks is never emitted** — the round comes back one question short
//      instead, which the round builder handles.
//
// The player's reward for being wrong is the verdict panel: the real figure
// for all three lines, each with its year and its rank, each linking to the
// dossier it came from.
import type { Deck, DeckCountry, DeckIndicator, ForgeryQuestion, Provenance } from "../types";
import type { Rng } from "../rng";
import {
  deckValue,
  dossierHref,
  formatMeasure,
  indicatorsForCountry,
  pickIndicator,
  printResolution,
  sovereignCountries,
} from "../quiz-indicators";
import { formatRank, formatValue } from "../../format";

/** Below this, the card cannot be built at all — it needs three measures. */
const STATEMENTS_PER_CARD = 3;

/** §6: "After ten failed draws for a country, move to another country." */
const MAX_DRAWS_PER_COUNTRY = 10;

/** How many countries to try before giving up on this question entirely. */
const MAX_COUNTRY_ATTEMPTS = 40;

/** Factor draws per measure before that measure is written off for this country. */
const MAX_FACTOR_DRAWS = 6;

/** §6 step 2 — anything closer than this to the truth is an unfair question. */
const AMBIGUOUS_BAND = 0.15;

const FACTOR_HIGH: readonly [number, number] = [1.45, 2.2];
const FACTOR_LOW: readonly [number, number] = [0.45, 0.7];

interface Statement {
  indicator: DeckIndicator;
  /** The number printed on the card — the forgery for the fake, the truth otherwise. */
  shown: number;
  /** The real reading, always. Equal to `shown` on a true statement. */
  truth: number;
  year: string;
  rank: number;
  forged: boolean;
}

/**
 * A percentage that is a real share of something (of land area, of the
 * population) and so cannot exceed 100. Deliberately *not* every `percent`
 * indicator: "GDP growth" and "Inflation" are also formatted as percentages
 * and are legitimately negative or far above 100, and clamping those to
 * [0, 100] would be the bug rather than the fix. The deck's own observed
 * [min, max] across ~200 countries is the test — if every country on Earth
 * reports between 0 and 100 for this measure, it is a share.
 */
function isShare(indicator: DeckIndicator): boolean {
  return indicator.format === "percent" && indicator.min >= 0 && indicator.max <= 100;
}

/** §6 step 2. Uses the magnitude of the truth so negative measures behave. */
function isAmbiguous(fake: number, truth: number): boolean {
  return Math.abs(fake - truth) < AMBIGUOUS_BAND * Math.abs(truth);
}

/**
 * Forge one figure, or return `null` if this measure cannot produce a fair
 * fake for this country. Never returns a value that failed a check.
 */
function forgeValue(rng: Rng, indicator: DeckIndicator, truth: number): number | null {
  // A true value of zero cannot be scaled into anything but zero, and a
  // non-finite one should never have reached the deck. Either way, not a
  // question.
  if (!Number.isFinite(truth) || truth === 0) return null;

  // And a value too small for its own formatting is not a question either.
  // The Isle of Man's population growth is -0.0499% per year: a forgery at
  // -0.0724% is a perfectly legal 45% away, and then the card prints
  // "-0.1% per year" against a real "-0.0% per year" and asks a human to tell
  // them apart. Five times the last printed digit is the floor.
  if (Math.abs(truth) < 5 * printResolution(indicator, truth)) return null;

  for (let draw = 0; draw < MAX_FACTOR_DRAWS; draw++) {
    const high = rng.next() < 0.5;
    const [lo, hi] = high ? FACTOR_HIGH : FACTOR_LOW;
    const factor = lo + rng.next() * (hi - lo);

    let fake = truth * factor;
    if (isShare(indicator)) {
      fake = Math.min(100, Math.max(0, fake));
    }

    if (isAmbiguous(fake, truth)) continue;
    if (fake < indicator.min || fake > indicator.max) continue;

    // Last line of defence, and the only one the spec does not name: two
    // numbers 45% apart can still print identically once rounded, e.g. 0.04%
    // and 0.06% both render "0.1%". A card whose forged line reads exactly
    // like a true one is unanswerable, so it is rejected like any other
    // ambiguous draw.
    if (formatMeasure(indicator, fake) === formatMeasure(indicator, truth)) continue;

    return fake;
  }

  return null;
}

/**
 * Two true measures to sit beside the forgery — different from it, different
 * from each other, and from different sections where the country's data
 * allows. Labels are compared as well as codes because the catalogue has
 * three separate "Military spending" measures, and two options reading
 * "Military spending" would look like a bug even though both are true.
 */
function pickTruths(
  rng: Rng,
  pool: readonly DeckIndicator[],
  forged: DeckIndicator
): [DeckIndicator, DeckIndicator] | null {
  const others = rng
    .shuffle(pool)
    .filter((i) => i.code !== forged.code && i.label !== forged.label);
  if (others.length < 2) return null;

  const firstPreferred = others.filter((i) => i.section !== forged.section);
  const first = (firstPreferred.length > 0 ? firstPreferred[0] : others[0]) as DeckIndicator;

  const remaining = others.filter((i) => i.code !== first.code && i.label !== first.label);
  if (remaining.length === 0) return null;

  const secondPreferred = remaining.filter(
    (i) => i.section !== first.section && i.section !== forged.section
  );
  const second = (secondPreferred.length > 0 ? secondPreferred[0] : remaining[0]) as DeckIndicator;

  return [first, second];
}

/** One statement's row in the verdict panel: the real number, its year, its rank. */
function verdictRow(country: DeckCountry, s: Statement) {
  const real = formatMeasure(s.indicator, s.truth);
  const rank = formatRank(s.rank, s.indicator.outOf);
  return {
    label: s.forged ? `${s.indicator.label} — forged` : s.indicator.label,
    value: s.forged
      ? `The card said ${formatMeasure(s.indicator, s.shown)}. Really ${real} · ${rank}`
      : `${real} · ${rank}`,
    year: s.year,
    href: dossierHref(country.iso3),
  };
}

/** One `World Bank` entry per distinct year on the card, all pointing at the dossier. */
function buildProvenance(country: DeckCountry, statements: readonly Statement[]): Provenance[] {
  const href = dossierHref(country.iso3);
  const seen: Record<string, true> = {};
  const out: Provenance[] = [];
  for (const s of statements) {
    if (seen[s.year] === true) continue;
    seen[s.year] = true;
    out.push({ source: "World Bank", year: s.year, href });
  }
  return out;
}

/** Try to build a card for one specific country. `null` if it cannot be done cleanly. */
function forgeForCountry(
  deck: Deck,
  rng: Rng,
  country: DeckCountry
): ForgeryQuestion | null {
  const available = indicatorsForCountry(deck, country.iso3);
  if (available.length < STATEMENTS_PER_CARD) return null;

  // Measures that have already failed for this country. Re-drawing one that
  // cannot work would burn the ten-draw budget on the same dead end.
  const writtenOff: Record<string, true> = {};

  for (let draw = 0; draw < MAX_DRAWS_PER_COUNTRY; draw++) {
    const pool = available.filter((i) => writtenOff[i.code] !== true);
    if (pool.length < STATEMENTS_PER_CARD) return null;

    const forgedIndicator = pickIndicator(rng, deck, pool);
    if (!forgedIndicator) return null;

    const entry = deckValue(deck, forgedIndicator.code, country.iso3);
    if (!entry) {
      writtenOff[forgedIndicator.code] = true;
      continue;
    }

    const [truth, year, rank] = entry;
    const fake = forgeValue(rng, forgedIndicator, truth);
    if (fake === null) {
      writtenOff[forgedIndicator.code] = true;
      continue;
    }

    const truths = pickTruths(rng, pool, forgedIndicator);
    if (!truths) {
      writtenOff[forgedIndicator.code] = true;
      continue;
    }

    const statements: Statement[] = [
      { indicator: forgedIndicator, shown: fake, truth, year, rank, forged: true },
    ];
    let incomplete = false;
    for (const indicator of truths) {
      const trueEntry = deckValue(deck, indicator.code, country.iso3);
      if (!trueEntry) {
        incomplete = true;
        break;
      }
      const [v, y, r] = trueEntry;
      statements.push({ indicator, shown: v, truth: v, year: y, rank: r, forged: false });
    }
    if (incomplete) {
      writtenOff[forgedIndicator.code] = true;
      continue;
    }

    const ordered = rng.shuffle(statements);
    const answer = ordered.findIndex((s) => s.forged);
    // Cannot happen — one statement is always forged — but an `answer` of -1
    // would be a silently unanswerable question, so it is checked rather than
    // assumed.
    if (answer < 0) return null;

    const ratio = fake / truth;

    return {
      id: `forgery:${country.iso3}:${forgedIndicator.code}`,
      game: "forgery",
      prompt: `One of these three figures about ${country.name} was forged. Which one?`,
      answer,
      country: { iso3: country.iso3, name: country.name, flagUrl: country.flagUrl },
      options: ordered.map((s) => ({
        text: `${s.indicator.label} — ${formatMeasure(s.indicator, s.shown)} (${s.year})`,
        measure: s.indicator.label,
      })),
      verdict: {
        headline: `The forgery was “${forgedIndicator.label}”.`,
        rows: ordered.map((s) => verdictRow(country, s)),
        note:
          `The forged line put ${country.name}'s ${forgedIndicator.label} at about ` +
          `${formatValue(ratio, "number", { compact: false, decimals: 2 })}× the real figure. ` +
          `The other two are real, straight from the dossier.`,
      },
      provenance: buildProvenance(country, ordered),
    };
  }

  return null;
}

/**
 * One forgery card, or `null` if the deck could not produce a clean one.
 *
 * `usedIso3` is the set of countries already asked about in this round, so a
 * run of ten never shows the same country twice.
 */
export function buildForgery(
  deck: Deck,
  rng: Rng,
  usedIso3: ReadonlySet<string>
): ForgeryQuestion | null {
  // Sovereign states only — a card asking a player to spot a forgery in the
  // Cocos (Keeling) Islands' trade figures is not a fair question. See
  // `sovereignCountries`.
  const pool = sovereignCountries(deck);
  for (let attempt = 0; attempt < MAX_COUNTRY_ATTEMPTS; attempt++) {
    const country = rng.pick(pool);
    if (usedIso3.has(country.iso3)) continue;
    const question = forgeForCountry(deck, rng, country);
    if (question) return question;
  }
  return null;
}
