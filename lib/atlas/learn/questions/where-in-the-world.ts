// Where in the world — the player is named a country and clicks its shape
// on the engraved map. Reuses the map's own geometry (lib/atlas/geo/world-paths.ts)
// and naturally excludes the 76 countries that have no shape at the bundled
// 110m resolution — asking about one of those would be an unanswerable
// question, so the pool below is filtered against the geometry file itself
// rather than a hand-typed list.
//
// ------------------------------------------------------------------ shape
// Every other game here offers a short pick-list: three statements, two
// countries, four names. This one doesn't — the map itself is the pick-list,
// and it has ~170 shapes on it, not four. So `options` is deliberately just
// two entries:
//
//   0. the true country
//   1. an "elsewhere" sentinel that every other click — right country or
//      wrong — resolves to
//
// `answer` is always 0. The client component (app/atlas/learn/_components/
// MapQuestion.tsx) is the one that actually knows which of the ~170 shapes
// was clicked; it reports back index 0 for a correct click and 1 for any
// other, which is all `PlayScreen`'s shared right/wrong bookkeeping needs.
// The richer teaching detail — which wrong country was clicked, how far off
// it was — lives entirely on the client, the same way GuessCountryQuestion's
// clue-reveal score never touches the generated question either.
//
// `country` carries the honest facts that "how far off" needs: the answer's
// `region` and `neighbours`, straight from the deck. The client-side map
// bundle (world-paths.ts) has shapes and names, not regions or borders, and
// the deck itself is a server-side artifact that never ships to the browser
// — so those two facts ride along on the question, the same way
// ForgeryQuestion's `country` does.
import type { Deck, DeckCountry, DeckIndicator, WhereInTheWorldQuestion } from "../types";
import type { Rng } from "../rng";
import { deckValue, dossierHref, formatMeasure, sovereignCountries } from "../quiz-indicators";
import { COUNTRY_PATHS } from "../../geo/world-paths";

/** Countries to try before giving up on this question. */
const MAX_ATTEMPTS = 60;

/** World Bank code the verdict's population line reads from. */
const POPULATION_CODE = "SP.POP.TOTL";

/**
 * ISO3 codes that actually have a shape at the map's bundled 110m
 * resolution. Derived from the real geometry file — never hand-typed, so it
 * can never drift out of sync with what a player can actually click.
 */
const GEOMETRY_ISO3: ReadonlySet<string> = new Set(COUNTRY_PATHS.map((c) => c.iso3));

/**
 * The pool: sovereign states (the same hard filter every generator here
 * uses — see quiz-indicators.ts's `sovereignCountries` for why) that also
 * have a shape on the map, and a region to name if the click misses.
 */
function mapPool(deck: Deck): DeckCountry[] {
  return sovereignCountries(deck).filter((c) => GEOMETRY_ISO3.has(c.iso3) && c.region !== null);
}

/** "Capital New Delhi · Asia · 1.44B people" — the verdict's teaching line. */
function factsLine(deck: Deck, popIndicator: DeckIndicator | null, country: DeckCountry): string {
  const parts: string[] = [];
  if (country.capital) parts.push(`Capital ${country.capital}`);
  if (country.region) parts.push(country.region);
  if (popIndicator) {
    const pop = deckValue(deck, POPULATION_CODE, country.iso3);
    if (pop) parts.push(formatMeasure(popIndicator, pop[0]));
  }
  // `mapPool` already requires a region, so this can never come back empty —
  // there is always at least the region to print, unlike guess-country's
  // and flags.ts's own `factsLine`, which can fall back to an em dash.
  return parts.join(" · ");
}

/**
 * One click-the-map card, or `null` if the deck could not produce a clean
 * one.
 *
 * `usedIso3` is the set of answers already used in this round, so no country
 * repeats across a run of ten — the same contract every other generator
 * here honours.
 */
export function buildWhereInTheWorld(
  deck: Deck,
  rng: Rng,
  usedIso3: ReadonlySet<string>
): WhereInTheWorldQuestion | null {
  const pool = mapPool(deck);
  if (pool.length === 0) return null;

  const popIndicator = deck.indicators.find((i) => i.code === POPULATION_CODE) ?? null;
  const byIso3 = new Map(deck.countries.map((c) => [c.iso3, c] as const));

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const answerCountry = rng.pick(pool);
    if (usedIso3.has(answerCountry.iso3)) continue;

    const neighbourNames = answerCountry.neighbours
      .map((iso) => byIso3.get(iso)?.name)
      .filter((name): name is string => Boolean(name));

    return {
      id: `where-in-the-world:${answerCountry.iso3}`,
      game: "where-in-the-world",
      prompt: `Click ${answerCountry.name} on the map.`,
      answer: 0,
      country: {
        iso3: answerCountry.iso3,
        name: answerCountry.name,
        region: answerCountry.region,
        neighbours: answerCountry.neighbours,
      },
      options: [
        { iso3: answerCountry.iso3, name: answerCountry.name },
        // A sentinel, not a real ISO3 — see the file header for why every
        // other click resolves here rather than to a second real country.
        { iso3: "ELSEWHERE", name: "Elsewhere" },
      ],
      verdict: {
        headline: `${answerCountry.name} — ${factsLine(deck, popIndicator, answerCountry)}`,
        rows: [
          {
            label: answerCountry.name,
            value: factsLine(deck, popIndicator, answerCountry),
            year: null,
            href: dossierHref(answerCountry.iso3),
          },
          {
            label: "Elsewhere",
            value: "Any other country on the map.",
            year: null,
            // Honestly null rather than pointed somewhere misleading —
            // "Elsewhere" is not a country and has no dossier of its own.
            // Verdict.tsx already renders a blank placeholder for a row
            // with no href, the same way it does for guess-country's and
            // flags.ts's distractor rows.
            href: null,
          },
        ],
        note:
          neighbourNames.length > 0
            ? `Borders ${neighbourNames.join(", ")}.`
            : "No shared land borders.",
      },
      // The fact under test is the country's identity and shape, not a
      // yearly reading — the same reason flags.ts cites Wikidata with a
      // null year rather than the World Bank.
      provenance: [{ source: "Wikidata", year: null, href: dossierHref(answerCountry.iso3) }],
    };
  }

  return null;
}
