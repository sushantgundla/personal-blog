// Guess the flag — one flag, four country names.
//
// The only game here whose facts come from Wikidata rather than the World
// Bank, so it is the only one whose provenance carries no year: a flag is not
// a measurement taken in a particular year.
//
// §6 on the distractors: three wrong names, preferably from the same `region`
// as the answer. Offering Chad against Fiji is not a hard question, it is a
// visual one — the player wins by recognising a continent's palette rather
// than a country's flag. Same-region distractors are both harder and fairer.
// If the region cannot supply three other flagged countries the fill comes
// from anywhere, which is what saves the small regions in the deck: "Central
// America" and "Eurasia" have one flagged country each, "Antarctica" three.
//
// The verdict is the reason this game is worth playing: it lays out the
// capital, region, internet domain and driving side for all four names, not
// just the right one, so a wrong guess still teaches three countries.
import type { Deck, DeckCountry, FlagQuestion } from "../types";
import type { Rng } from "../rng";
import { dossierHref, sovereignCountries } from "../quiz-indicators";
import { areConfusableFlags } from "../confusable";

/** Exactly four names on the card: one answer, three distractors. */
const OPTIONS_PER_CARD = 4;

/** Countries to try before giving up on this question. */
const MAX_ATTEMPTS = 40;

/**
 * The pool: sovereign states that have a flag.
 *
 * Sovereign is doing heavy lifting here and it is not a nicety. Bouvet
 * Island's flag *is* Norway's flag; Heard Island and McDonald Islands' *is*
 * Australia's; United States Minor Outlying Islands' *is* the USA's. Draw one
 * of those as a distractor beside its parent and the card shows two identical
 * pictures with no correct answer. Antarctica has no flag at all, and nobody
 * can fairly be asked to name Tokelau's.
 */
function flagPool(deck: Deck): DeckCountry[] {
  return sovereignCountries(deck).filter((c) => c.flagUrl !== null && c.flagUrl.length > 0);
}

/**
 * Three distractors that clash with neither the answer nor each other.
 *
 * Walks a shuffled pool once and takes the first three that are safe, rather
 * than sampling and retrying: with `CONFUSABLE_FLAG_PAIRS` in play a retry loop
 * can fail repeatedly in a small region, whereas one pass either finds three or
 * proves the pool cannot supply them.
 */
function pickDistractors(
  rng: Rng,
  source: readonly DeckCountry[],
  answer: DeckCountry
): DeckCountry[] | null {
  const chosen: DeckCountry[] = [];
  for (const candidate of rng.shuffle(source)) {
    if (areConfusableFlags(answer.iso3, candidate.iso3)) continue;
    if (chosen.some((c) => areConfusableFlags(c.iso3, candidate.iso3))) continue;
    if (chosen.some((c) => c.name === candidate.name)) continue;
    chosen.push(candidate);
    if (chosen.length === OPTIONS_PER_CARD - 1) return chosen;
  }
  return null;
}

/** "Capital New Delhi · Asia · .in · drives on the left" — one line per option. */
function factsLine(country: DeckCountry): string {
  const parts: string[] = [];
  if (country.capital) parts.push(`Capital ${country.capital}`);
  if (country.region) parts.push(country.region);
  if (country.tld) parts.push(country.tld);
  if (country.drivingSide) parts.push(`drives on the ${country.drivingSide}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

/**
 * One flag card, or `null` if the deck could not produce a clean one.
 *
 * `usedIso3` is the set of answers already used in this round, so no flag
 * repeats across a run of ten.
 */
export function buildFlagQuestion(
  deck: Deck,
  rng: Rng,
  usedIso3: ReadonlySet<string>
): FlagQuestion | null {
  const pool = flagPool(deck);
  if (pool.length < OPTIONS_PER_CARD) return null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const answerCountry = rng.pick(pool);
    if (usedIso3.has(answerCountry.iso3)) continue;
    const flagUrl = answerCountry.flagUrl;
    if (!flagUrl) continue;

    // Names, not just ISO3s, must be distinct — two options reading the same
    // thing would make the card unanswerable however different their codes.
    const sameRegion = pool.filter(
      (c) =>
        c.iso3 !== answerCountry.iso3 &&
        c.name !== answerCountry.name &&
        answerCountry.region !== null &&
        c.region === answerCountry.region
    );
    const anywhere = pool.filter(
      (c) => c.iso3 !== answerCountry.iso3 && c.name !== answerCountry.name
    );

    // §6 prefers same-region distractors, and falls back to anywhere when the
    // region cannot supply three. "Cannot supply" now also covers a region
    // whose only remaining candidates are all confusable with the answer.
    let distractors =
      sameRegion.length >= OPTIONS_PER_CARD - 1
        ? pickDistractors(rng, sameRegion, answerCountry)
        : null;
    if (!distractors) distractors = pickDistractors(rng, anywhere, answerCountry);
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
      id: `flags:${answerCountry.iso3}`,
      game: "flags",
      prompt: "Which country flies this flag?",
      answer,
      flagUrl,
      options: options.map((c) => ({ iso3: c.iso3, name: c.name })),
      verdict: {
        headline: `${answerCountry.name} — ${factsLine(answerCountry)}`,
        rows: options.map((c) => ({
          label: c.name,
          value: factsLine(c),
          // A flag is not a reading taken in a given year, so there is
          // honestly no year to print here. Better a null the panel can skip
          // than a year invented to fill the column.
          year: null,
          href: dossierHref(c.iso3),
        })),
        note: languages,
      },
      provenance: [
        { source: "Wikidata", year: null, href: dossierHref(answerCountry.iso3) },
      ],
    };
  }

  return null;
}
