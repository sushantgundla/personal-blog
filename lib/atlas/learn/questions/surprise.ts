// Surprise me — not a game. One random country's single most remarkable fact,
// dealt as a ledger card on the front door of the training floor.
//
// "Remarkable" is defined in §6 of
// docs/superpowers/specs/2026-08-03-atlas-learn-design.md, in order of
// preference:
//
//   1. A rank in the top 3 or bottom 3 of a measure at least 60 countries
//      report. Sixty is the bar because "3rd of 34" is not a world record,
//      it is a small sample.
//   2. A percentile above 97 or below 3.
//   3. Any rank in the top 10.
//
// If a country clears none of those, deal a different country — a card
// reading "Belgium is 84th for household consumption" is not a surprise.
//
// ------------------------------------------------------- reading the rank
// The one trap here. `lib/atlas/rankings.ts` sorts so that **rank 1 is always
// "best"**, not always "highest": ascending when `higherIsBetter` is false,
// descending otherwise. So Sierra Leone being rank 1 for "Infant deaths"
// would mean the *lowest* infant mortality on Earth, and a card that read
// "1st highest infant deaths" would be exactly backwards. Every superlative
// on this card is derived from `higherIsBetter`, not assumed.
import type { Deck, DeckCountry, DeckIndicator, SurpriseCard } from "../types";
import type { Rng } from "../rng";
import { deckValue, dossierHref, formatMeasure, sovereignCountries } from "../quiz-indicators";
import { formatRank } from "../../format";

/** §6 tier 1: a top/bottom-3 rank only counts on a measure this many countries report. */
const MIN_OUT_OF_FOR_EXTREME = 60;

/** Countries to deal before giving up. */
const MAX_ATTEMPTS = 60;

interface Candidate {
  indicator: DeckIndicator;
  value: number;
  year: string;
  rank: number;
  /** 1 = best (top/bottom 3 of a big measure), 2 = percentile, 3 = top ten. */
  tier: number;
}

/** "1st", "2nd", "3rd", "4th", "11th", "21st". */
export function ordinal(n: number): string {
  const abs = Math.abs(Math.round(n));
  const lastTwo = abs % 100;
  const last = abs % 10;
  let suffix = "th";
  if (lastTwo < 11 || lastTwo > 13) {
    if (last === 1) suffix = "st";
    else if (last === 2) suffix = "nd";
    else if (last === 3) suffix = "rd";
  }
  return `${abs}${suffix}`;
}

/**
 * The same percentile lib/atlas/rankings.ts computes: 100 at rank 1, 0 at the
 * last rank. Recomputed here rather than stored, because the deck packs a
 * value into three slots and percentile is derivable from two of them.
 */
function percentileOf(rank: number, outOf: number): number {
  if (outOf <= 1) return 100;
  return Math.round(((outOf - rank) / (outOf - 1)) * 100);
}

function tierFor(rank: number, outOf: number): number | null {
  if (outOf >= MIN_OUT_OF_FOR_EXTREME && (rank <= 3 || rank >= outOf - 2)) return 1;
  const p = percentileOf(rank, outOf);
  if (p > 97 || p < 3) return 2;
  if (rank <= 10) return 3;
  return null;
}

/** Everything remarkable this country has. */
function candidatesFor(deck: Deck, country: DeckCountry): Candidate[] {
  const out: Candidate[] = [];
  for (const indicator of deck.indicators) {
    const entry = deckValue(deck, indicator.code, country.iso3);
    if (!entry) continue;
    const [value, year, rank] = entry;
    if (!Number.isFinite(value) || !Number.isFinite(rank) || rank < 1) continue;
    if (rank > indicator.outOf) continue;
    const tier = tierFor(rank, indicator.outOf);
    if (tier === null) continue;
    out.push({ indicator, value, year, rank, tier });
  }
  return out;
}

/**
 * Turn a rank into English, respecting the sort direction.
 *
 * Returns the position counted from whichever end of the table the country is
 * near, plus the word for that end. Rank 3 of 189 on forest cover (higher is
 * better, so rank 1 is the highest) gives `{ place: 3, word: "highest" }`.
 * Rank 3 of 189 on infant deaths (higher is worse, so rank 1 is the lowest)
 * gives `{ place: 3, word: "lowest" }`.
 */
function describeRank(
  indicator: DeckIndicator,
  rank: number
): { place: number; word: "highest" | "lowest" } {
  const rankOneIsHighest = indicator.higherIsBetter !== false;
  const fromTop = rank <= indicator.outOf / 2;
  const place = fromTop ? rank : indicator.outOf - rank + 1;
  const atRankOneEnd = fromTop;
  const word = atRankOneEnd
    ? rankOneIsHighest
      ? "highest"
      : "lowest"
    : rankOneIsHighest
      ? "lowest"
      : "highest";
  return { place, word };
}

/** One dealt card, or `null` if nothing remarkable turned up. */
export function buildSurpriseCard(deck: Deck, rng: Rng): SurpriseCard | null {
  // Sovereign states only. A card reading "Tokelau is 1st on Earth for X" is
  // a curiosity about a 1,500-person territory, not a fact about the world.
  const pool = sovereignCountries(deck);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const country = rng.pick(pool);
    const candidates = candidatesFor(deck, country);
    if (candidates.length === 0) continue;

    // Take the best tier this country offers, then pick within it — so a
    // country that holds a world record is never shown its 9th place instead.
    const bestTier = candidates.reduce((min, c) => (c.tier < min ? c.tier : min), 3);
    const best = candidates.filter((c) => c.tier === bestTier);
    const chosen = rng.pick(best);

    const { place, word } = describeRank(chosen.indicator, chosen.rank);

    return {
      iso3: country.iso3,
      name: country.name,
      flagUrl: country.flagUrl,
      headline: `${ordinal(place)} ${word} on Earth for ${chosen.indicator.label}`,
      detail:
        `${formatMeasure(chosen.indicator, chosen.value)}, ${chosen.year} — ` +
        `${formatRank(chosen.rank, chosen.indicator.outOf)}`,
      href: dossierHref(country.iso3),
      provenance: {
        source: "World Bank",
        year: chosen.year,
        href: dossierHref(country.iso3),
      },
    };
  }

  return null;
}
