// Higher or lower — two countries, one measure, which is greater.
//
// The rules from §6 of docs/superpowers/specs/2026-08-03-atlas-learn-design.md,
// and why each one exists:
//
//   - **Both values present.** A missing value is never a question. No dash
//     standing in for a number, no zero standing in for absence.
//   - **Gap ratio at least 1.15.** A near-tie is a coin flip dressed up as a
//     question, and it is worse than a coin flip because the player thinks
//     they were wrong about something.
//   - **Years within three of each other.** "India in 2015 versus France in
//     2023" is not a fair comparison and the card would be asserting that it
//     is. Health and education data lag three to five years, so this rejects
//     real pairs regularly — that is the point.
//   - **"Which is greater", never "which is better".** `higherIsBetter` is a
//     colouring hint for the dossier's comparison bars and has no business in
//     a question. It is used in exactly one place in this file — reading the
//     rank direction for the verdict — and never reaches a string.
//
// One rule of this file's own: both values must be positive. Ratios stop
// meaning anything around zero (is -2.1 "greater" than -4.4 by a factor of
// two, or by half?), and "which is greater, -5.2% or -1.1%?" is a reading
// comprehension test rather than a geography one. Measures that go negative —
// GDP growth in a bad year, net migration, the current account — simply skip
// those pairs.
import type { Deck, DeckCountry, DeckIndicator, HigherLowerQuestion } from "../types";
import type { Rng } from "../rng";
import {
  deckValue,
  dossierHref,
  formatMeasure,
  pickIndicator,
  sovereignCountries,
} from "../quiz-indicators";
import { formatRank, formatValue } from "../../format";

/** §6: "Higher-or-lower requires a gap ratio of at least 1.15." */
const MIN_GAP_RATIO = 1.15;

/** §6: "both values to be within three years of each other." */
const MAX_YEAR_GAP = 3;

/** Measures to try before giving up on this question. */
const MAX_INDICATOR_ATTEMPTS = 30;

/** Country pairs to try within one measure before moving to the next. */
const MAX_PAIR_ATTEMPTS = 25;

interface Side {
  country: DeckCountry;
  value: number;
  year: string;
  rank: number;
}

/** The same key for `("IND","CHN")` and `("CHN","IND")`, so a pair can only appear once. */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function yearsAreComparable(a: string, b: string): boolean {
  const ya = Number(a);
  const yb = Number(b);
  if (!Number.isFinite(ya) || !Number.isFinite(yb)) return false;
  return Math.abs(ya - yb) <= MAX_YEAR_GAP;
}

function gapIsWideEnough(a: number, b: number): boolean {
  if (a <= 0 || b <= 0) return false;
  return Math.max(a, b) / Math.min(a, b) >= MIN_GAP_RATIO;
}

/**
 * Every sovereign state that reports this measure.
 *
 * Sovereign only, and not as a nicety: the deck holds all 250 ISO entries, and
 * "which is greater on GDP per person, Tokelau or Uruguay?" is not a question
 * anyone can be expected to answer. See `sovereignCountries`.
 */
function sidesFor(deck: Deck, indicator: DeckIndicator): Side[] {
  const out: Side[] = [];
  for (const country of sovereignCountries(deck)) {
    const entry = deckValue(deck, indicator.code, country.iso3);
    if (!entry) continue;
    const [value, year, rank] = entry;
    if (!Number.isFinite(value)) continue;
    out.push({ country, value, year, rank });
  }
  return out;
}

function verdictRow(indicator: DeckIndicator, side: Side) {
  return {
    label: side.country.name,
    value: `${formatMeasure(indicator, side.value)} · ${formatRank(side.rank, indicator.outOf)}`,
    year: side.year,
    href: dossierHref(side.country.iso3),
  };
}

/**
 * One higher-or-lower card, or `null` if the deck could not produce a fair one.
 *
 * `usedPairs` holds the `pairKey` of every pairing already asked in this
 * round, so the same two countries never come up twice even under a different
 * measure.
 */
export function buildHigherLower(
  deck: Deck,
  rng: Rng,
  usedPairs: ReadonlySet<string>
): HigherLowerQuestion | null {
  for (let attempt = 0; attempt < MAX_INDICATOR_ATTEMPTS; attempt++) {
    const indicator = pickIndicator(rng, deck);
    if (!indicator) return null;

    const sides = sidesFor(deck, indicator);
    if (sides.length < 2) continue;

    for (let pairAttempt = 0; pairAttempt < MAX_PAIR_ATTEMPTS; pairAttempt++) {
      const drawn = rng.sample(sides, 2);
      if (drawn.length < 2) break;
      const [a, b] = drawn as [Side, Side];

      if (a.country.iso3 === b.country.iso3) continue;
      if (usedPairs.has(pairKey(a.country.iso3, b.country.iso3))) continue;
      if (!gapIsWideEnough(a.value, b.value)) continue;
      if (!yearsAreComparable(a.year, b.year)) continue;

      const aText = formatMeasure(indicator, a.value);
      const bText = formatMeasure(indicator, b.value);
      // Two numbers 15% apart can still round to the same printed string
      // (0.04% and 0.06% both render "0.1%"). On screen that is a question
      // with two identical answers, so it is rejected like a near-tie.
      if (aText === bText) continue;

      const answer = a.value > b.value ? 0 : 1;
      const winner = answer === 0 ? a : b;
      const loser = answer === 0 ? b : a;
      const ratio = winner.value / loser.value;

      return {
        id: `higher-lower:${pairKey(a.country.iso3, b.country.iso3)}:${indicator.code}`,
        game: "higher-lower",
        prompt: `${indicator.label} — which country is greater?`,
        answer,
        measure: indicator.label,
        options: [a, b].map((s) => ({
          iso3: s.country.iso3,
          name: s.country.name,
          flagUrl: s.country.flagUrl,
        })),
        verdict: {
          headline: `${winner.country.name} is greater — ${formatMeasure(indicator, winner.value)}.`,
          rows: [verdictRow(indicator, a), verdictRow(indicator, b)],
          note:
            `${indicator.label}, measured in ${indicator.unit}. ` +
            `${winner.country.name} is about ` +
            `${formatValue(ratio, "number", { compact: false, decimals: 1 })}× ` +
            `${loser.country.name} here. ` +
            `Ranks are across the ${indicator.outOf} countries that report this measure.`,
        },
        provenance: [
          { source: "World Bank", year: a.year, href: dossierHref(a.country.iso3) },
          { source: "World Bank", year: b.year, href: dossierHref(b.country.iso3) },
        ],
      };
    }
  }

  return null;
}
