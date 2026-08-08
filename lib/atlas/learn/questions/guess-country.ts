// Guess the country — facts about one hidden country, revealed one clue at a
// time from vaguest to most specific. Four country names are offered; the
// player rewards themself by naming it early, because every clue they ask
// for on the way costs them points (see the scale in
// app/atlas/learn/_components/GuessCountryQuestion.tsx, which is the only
// place that number lives — it is a display flourish computed on the client
// from how many clues *this* player revealed, not part of the generated
// question, and it never touches the right/wrong `answer` the run records).
//
// ------------------------------------------------------------------ order
// Clue order is fixed and always broad to narrow:
//
//   1. Region       — dozens of countries share one.
//   2. Population    — a band, not the exact figure (see POPULATION_BANDS):
//                       tens of countries share a band too.
//   3. Language      — the design doc's suggested third clue was currency,
//                       but §5 of the deck design explicitly excludes
//                       currency from the deck ("Wikidata says France's
//                       currency is 'CFP Franc', wrong for the mainland").
//                       Official language sits at the same difficulty tier —
//                       shared by a cluster of countries, not a giveaway —
//                       and it is a field the deck actually trusts.
//   4. A neighbour   — narrower still: one bordering country picks out a
//                       small, geographically close set of possible answers.
//   5. Capital       — the most specific fact the deck holds. Effectively
//                       unique.
//
// Language and a neighbour are dropped from a card when the country genuinely
// has neither (a landlocked-vs-island distinction, or simply no recorded
// official language) — the order among whatever remains never changes. See
// CLUE_ORDER, which scripts/atlas/learn-selfcheck.mjs checks every card
// against.
//
// Region, population and capital are treated as required: a country missing
// any of the three is skipped for another, exactly like forgery.ts moves on
// after a country that cannot supply three clean measures. This keeps every
// card's final, most-revealing clue the same shape (a capital), which is
// part of what makes "name it before you need them all" a fair promise.
import type {
  Deck,
  DeckCountry,
  DeckIndicator,
  GuessCountryClue,
  GuessCountryQuestion,
} from "../types";
import type { Rng } from "../rng";
import { deckValue, dossierHref, formatMeasure, sovereignCountries } from "../quiz-indicators";

/** One correct answer, three distractors — same shape as the flags game. */
const OPTIONS_PER_CARD = 4;

/** Countries to try before giving up on this question. */
const MAX_ATTEMPTS = 60;

/** §7: region, population and capital must all be present, or skip the country. */
const MIN_CLUES = 3;

/** World Bank code the population clue and the verdict's population line read from. */
const POPULATION_CODE = "SP.POP.TOTL";

/**
 * The only order a card's clues may appear in. Exported so
 * scripts/atlas/learn-selfcheck.mjs can assert every generated card's clue
 * labels are a subsequence of this list, never reordered and never repeated.
 */
export const CLUE_ORDER: readonly string[] = [
  "Region",
  "Population",
  "Language",
  "Neighbour",
  "Capital",
];

/**
 * Bands, not exact figures — the whole point of a population clue is that it
 * narrows the field without simply stating a memorisable number. Boundaries
 * are round numbers a curious person already has some feel for (a small
 * European country, a mid-sized one, "as big as Germany", "as big as the
 * US"), not a statistical quantile.
 */
const POPULATION_BANDS: ReadonlyArray<{ max: number; label: string }> = [
  { max: 1_000_000, label: "under 1 million" },
  { max: 10_000_000, label: "1 to 10 million" },
  { max: 50_000_000, label: "10 to 50 million" },
  { max: 100_000_000, label: "50 to 100 million" },
  { max: 300_000_000, label: "100 to 300 million" },
  { max: Infinity, label: "over 300 million" },
];

/** Exported for the self-check and the unit tests, so the bands are asserted against, not re-typed. */
export function populationBand(value: number): string {
  for (const band of POPULATION_BANDS) {
    if (value <= band.max) return band.label;
  }
  return POPULATION_BANDS[POPULATION_BANDS.length - 1]!.label;
}

/**
 * "Capital New Delhi · Asia · 1.44B people" — the verdict's teaching line for
 * one option. Unlike the vague clue text, this prints the real figure: the
 * verdict is where the precision the clues withheld finally shows up.
 */
function factsLine(deck: Deck, popIndicator: DeckIndicator | null, country: DeckCountry): string {
  const parts: string[] = [];
  if (country.capital) parts.push(`Capital ${country.capital}`);
  if (country.region) parts.push(country.region);
  if (popIndicator) {
    const pop = deckValue(deck, POPULATION_CODE, country.iso3);
    if (pop) parts.push(formatMeasure(popIndicator, pop[0]));
  }
  return parts.length > 0 ? parts.join(" · ") : "—";
}

/**
 * Walk a shuffled pool once and take the first three distinct-named
 * countries that are not the answer. One pass, not sample-and-retry — see
 * flags.ts's `pickDistractors` for why that shape is preferred here too.
 */
function walkForDistractors(
  rng: Rng,
  source: readonly DeckCountry[],
  answer: DeckCountry
): DeckCountry[] | null {
  const chosen: DeckCountry[] = [];
  for (const candidate of rng.shuffle(source)) {
    if (candidate.iso3 === answer.iso3) continue;
    if (candidate.name === answer.name) continue;
    if (chosen.some((c) => c.name === candidate.name)) continue;
    chosen.push(candidate);
    if (chosen.length === OPTIONS_PER_CARD - 1) return chosen;
  }
  return null;
}

/**
 * Three distractors: distinct countries, distinct names, never the answer.
 *
 * Prefers the answer's own region, same as flags.ts's distractor rule —
 * "Chad vs Fiji" is not a hard question, it is a geography-recognition one,
 * and offering countries from the answer's own region is what makes the
 * card reward the *later* clues rather than letting the region clue alone
 * rule out three of the four options. Falls back to anywhere when the
 * region cannot supply three. No flag is ever shown here, so — unlike
 * flags.ts — there is no confusable-pair check to run.
 */
function pickDistractors(
  rng: Rng,
  pool: readonly DeckCountry[],
  answer: DeckCountry
): DeckCountry[] | null {
  const sameRegion = pool.filter(
    (c) => c.iso3 !== answer.iso3 && answer.region !== null && c.region === answer.region
  );
  if (sameRegion.length >= OPTIONS_PER_CARD - 1) {
    const fromRegion = walkForDistractors(rng, sameRegion, answer);
    if (fromRegion) return fromRegion;
  }
  return walkForDistractors(rng, pool, answer);
}

/** Try to build a full clue list for one country. `null` if it cannot supply the required three. */
function cluesFor(
  deck: Deck,
  rng: Rng,
  popIndicator: DeckIndicator | null,
  byIso3: ReadonlyMap<string, DeckCountry>,
  country: DeckCountry
): GuessCountryClue[] | null {
  if (!country.region) return null;
  if (!country.capital) return null;
  if (!popIndicator) return null;
  const pop = deckValue(deck, POPULATION_CODE, country.iso3);
  if (!pop) return null;

  const href = dossierHref(country.iso3);
  const clues: GuessCountryClue[] = [
    {
      label: "Region",
      text: `Located in ${country.region}.`,
      // Region comes from the ISO table rather than a single API, but every
      // other structural fact on this card (capital, language, neighbours)
      // is Wikidata's, and Provenance only distinguishes World Bank from
      // Wikidata — the same house convention flags.ts already uses for its
      // one card-wide entry.
      provenance: { source: "Wikidata", year: null, href },
    },
    {
      label: "Population",
      text: `Population: ${populationBand(pop[0])} people.`,
      provenance: { source: "World Bank", year: pop[1], href },
    },
  ];

  if (country.languages.length > 0) {
    const plural = country.languages.length > 1 ? "s" : "";
    clues.push({
      label: "Language",
      text: `Official language${plural}: ${country.languages.join(", ")}.`,
      provenance: { source: "Wikidata", year: null, href },
    });
  }

  if (country.neighbours.length > 0) {
    const neighbourIso3 = rng.pick(country.neighbours);
    const neighbour = byIso3.get(neighbourIso3);
    if (neighbour) {
      clues.push({
        label: "Neighbour",
        text: `Shares a border with ${neighbour.name}.`,
        provenance: { source: "Wikidata", year: null, href },
      });
    }
  }

  clues.push({
    label: "Capital",
    text: `Its capital is ${country.capital}.`,
    provenance: { source: "Wikidata", year: null, href },
  });

  return clues.length >= MIN_CLUES ? clues : null;
}

/**
 * One guess-the-country card, or `null` if the deck could not produce a
 * clean one.
 *
 * `usedIso3` is the set of answers already used in this round, so no country
 * repeats across a run of ten — the same contract `buildForgery` and
 * `buildFlagQuestion` honour.
 */
export function buildGuessCountry(
  deck: Deck,
  rng: Rng,
  usedIso3: ReadonlySet<string>
): GuessCountryQuestion | null {
  const pool = sovereignCountries(deck);
  if (pool.length < OPTIONS_PER_CARD) return null;

  const popIndicator = deck.indicators.find((i) => i.code === POPULATION_CODE) ?? null;
  const byIso3 = new Map(deck.countries.map((c) => [c.iso3, c] as const));

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const answerCountry = rng.pick(pool);
    if (usedIso3.has(answerCountry.iso3)) continue;

    const clues = cluesFor(deck, rng, popIndicator, byIso3, answerCountry);
    if (!clues) continue;

    const distractors = pickDistractors(rng, pool, answerCountry);
    if (!distractors) continue;

    const options = rng.shuffle([answerCountry].concat(distractors));
    const answer = options.findIndex((c) => c.iso3 === answerCountry.iso3);
    if (answer < 0) continue;

    const languages =
      answerCountry.languages.length > 0
        ? `Official language${answerCountry.languages.length > 1 ? "s" : ""}: ` +
          `${answerCountry.languages.join(", ")}.`
        : null;

    return {
      id: `guess-country:${answerCountry.iso3}`,
      game: "guess-country",
      prompt: "Which country is this?",
      answer,
      clues,
      options: options.map((c) => ({ iso3: c.iso3, name: c.name })),
      verdict: {
        headline: `${answerCountry.name} — ${factsLine(deck, popIndicator, answerCountry)}`,
        rows: options.map((c) => ({
          label: c.name,
          value: factsLine(deck, popIndicator, c),
          year: null,
          href: dossierHref(c.iso3),
        })),
        note: languages,
      },
      provenance: clues.map((c) => c.provenance),
    };
  }

  return null;
}
