// The contract for the learning section (`/atlas/learn`) — the mint's
// training floor.
//
// This file is copied verbatim from §4 of
// docs/superpowers/specs/2026-08-03-atlas-learn-design.md. Every other file
// under lib/atlas/learn/ and app/atlas/learn/ is written against exactly
// these shapes, by several people at once, so a field renamed or reordered
// here silently breaks work that is already finished elsewhere. Add fields
// if a new game genuinely needs them; do not rename or remove.
//
// Two things are deliberately absent and must stay absent:
//   - currency and motto (see §5 — Wikidata says France's currency is "CFP
//     Franc", and only 34 of 250 countries have a motto),
//   - anything a question could be built on that the dossier itself would
//     withhold. The >= 30-reporting-countries bar is enforced once, in
//     scripts/atlas/build-deck.mjs, so no generator can get it wrong.

/** The five games that make up a run of ten. "Surprise me" is not a game. */
export type GameId = 'forgery' | 'higher-lower' | 'flags' | 'guess-country' | 'where-in-the-world';

/** One country as the deck stores it. */
export interface DeckCountry {
  iso3: string;
  name: string;
  region: string | null;
  flagUrl: string | null;      // already https, already ?width= (a PNG, not the SVG)
  capital: string | null;
  languages: string[];
  drivingSide: string | null;
  tld: string | null;
  neighbours: string[];        // ISO3 only
  /**
   * A UN member state, or one of the two permanent observers (VAT, PSE).
   *
   * Not a political statement — a quiz filter. The deck holds all 250 ISO
   * entries, and a good third of them cannot carry a flag question:
   * Bouvet Island flies Norway's flag, Heard Island and McDonald Islands
   * fly Australia's, United States Minor Outlying Islands fly the USA's, so
   * a four-option question could show two identical images and have no
   * correct answer. Antarctica has no flag at all, and nobody can fairly be
   * asked to name Tokelau's.
   *
   * Every country stays in the deck; generators filter on this instead. See
   * SOVEREIGN_ISO3 in scripts/atlas/build-deck.mjs for the list and why it
   * is hand-written rather than derived.
   */
  sovereign: boolean;
}

/** One measure the deck considers safe to ask about. */
export interface DeckIndicator {
  code: string;
  label: string;               // plain English, straight from lib/atlas/indicators.ts
  unit: string;
  format: 'number' | 'currency' | 'percent' | 'years' | 'per1000';
  higherIsBetter: boolean | null;
  section: string;
  outOf: number;               // countries reporting — always >= 30, see §6
  min: number;                 // lowest reported value, for plausibility bounds
  max: number;                 // highest reported value
}

/** value, year, rank — packed as an array to keep deck.json small. */
export type DeckValue = [value: number, year: string, rank: number];

/**
 * The whole prebuilt deck: `content/atlas/learn/deck.json`, read once per
 * server process by lib/atlas/learn/deck.ts. A server-side artifact — it is
 * never sent to the browser.
 */
export interface Deck {
  capturedAt: string;
  countries: DeckCountry[];
  indicators: DeckIndicator[];
  /** values[indicatorCode][iso3] */
  values: Record<string, Record<string, DeckValue>>;
}

/** Where a fact came from — rendered on every question, no exceptions. */
export interface Provenance {
  source: 'World Bank' | 'Wikidata';
  year: string | null;
  /** Deep link to the dossier the fact is drawn from. */
  href: string;               // e.g. "/atlas/ind"
}

interface QuestionBase {
  id: string;                 // stable within a round, used as a React key
  game: GameId;
  prompt: string;
  /** Index into `options` that is correct. */
  answer: number;
  /** Shown after answering — this is where the learning happens. */
  verdict: {
    headline: string;
    rows: Array<{ label: string; value: string; year: string | null; href: string | null }>;
    note: string | null;
  };
  provenance: Provenance[];
}

/** Three statements about one country, one fabricated. Pick the fake. */
export interface ForgeryQuestion extends QuestionBase {
  game: 'forgery';
  country: { iso3: string; name: string; flagUrl: string | null };
  options: Array<{ text: string; measure: string }>;   // exactly 3, one is forged
}

/** Two countries, one measure, which is greater. Never "which is better". */
export interface HigherLowerQuestion extends QuestionBase {
  game: 'higher-lower';
  measure: string;            // the indicator label, e.g. "Life expectancy"
  options: Array<{ iso3: string; name: string; flagUrl: string | null }>;  // exactly 2
}

/** A flag and four country names. */
export interface FlagQuestion extends QuestionBase {
  game: 'flags';
  flagUrl: string;
  options: Array<{ iso3: string; name: string }>;      // exactly 4
}

/** One fact revealed at a time, broadest first, on a `GuessCountryQuestion`. */
export interface GuessCountryClue {
  /** Short tag printed beside the clue — "Region", "Population", "Capital". */
  label: string;
  /** The clue itself, as printed on the card. */
  text: string;
  /** Where this one fact came from. Every clue cites its own source. */
  provenance: Provenance;
}

/**
 * Facts about one hidden country, revealed one at a time from vaguest to
 * most specific. Four country names are offered; the score for the question
 * falls with every extra clue the player asks for (see
 * app/atlas/learn/_components/GuessCountryQuestion.tsx for the scale — it is
 * a display-only score kept entirely on the client, the same right/wrong
 * `answer` below is still what the run records).
 */
export interface GuessCountryQuestion extends QuestionBase {
  game: 'guess-country';
  /** Broad to narrow. Never fewer than three, never reordered. */
  clues: GuessCountryClue[];
  options: Array<{ iso3: string; name: string }>;      // exactly 4
}

/**
 * Click the named country on the engraved map. The map itself is the real
 * answer surface — there is no short pick-list of names the way the other
 * four games have one — so `options` is deliberately just two entries: the
 * true country, and a sentinel standing in for every other click. See
 * lib/atlas/learn/questions/where-in-the-world.ts for why that shape still
 * satisfies the shared `answer`-indexes-`options` contract every other file
 * under this section relies on.
 */
export interface WhereInTheWorldQuestion extends QuestionBase {
  game: 'where-in-the-world';
  /**
   * The hidden target, plus the honest facts the client needs to judge how
   * far off a wrong click was. The map's geometry alone can say right or
   * wrong; "how far off" needs the answer's region and neighbours, which
   * live in the deck, not in the client-side geometry bundle
   * (lib/atlas/geo/world-paths.ts) — so they ride along on the question
   * itself, the same way ForgeryQuestion carries `country`.
   */
  country: { iso3: string; name: string; region: string | null; neighbours: string[] };
  /** Always exactly two: index 0 the true country, index 1 the "elsewhere"
   * sentinel every other click resolves to. `answer` is always 0. */
  options: Array<{ iso3: string; name: string }>;
}

export type Question =
  | ForgeryQuestion
  | HigherLowerQuestion
  | FlagQuestion
  | GuessCountryQuestion
  | WhereInTheWorldQuestion;

/** One run of ten, as `/atlas/learn/api/round` returns it. */
export interface Round {
  roundId: string;
  game: GameId;
  questions: Question[];
}

/** One fact on a Country of the day card. Same shape as a verdict row's
 *  headline/detail pair, plus its own provenance — every fact cites its own
 *  source and year, same honesty rule as everything else here. */
export interface CountryOfDayFact {
  headline: string;             // "3rd highest forest cover on Earth"
  detail: string;                // "31.2% of land area, 2022 — #3 of 189"
  provenance: Provenance;
}

/**
 * Country of the day — not a game, not part of a round. One country, the
 * same for everyone, changing daily. See
 * lib/atlas/learn/questions/country-of-day.ts for how the pick is derived
 * from the date rather than stored.
 */
export interface CountryOfDayCard {
  /** The UTC calendar date this pick belongs to — "YYYY-MM-DD". */
  date: string;
  iso3: string;
  name: string;
  flagUrl: string | null;
  /** A handful of remarkable facts, same §6 bar as SurpriseCard, never fewer
   *  than one. */
  facts: CountryOfDayFact[];
  href: string;
}

/** The Surprise me card — not part of a round. */
export interface SurpriseCard {
  iso3: string;
  name: string;
  flagUrl: string | null;
  headline: string;           // "3rd highest forest cover on Earth"
  detail: string;             // "31.2% of land area, 2022 — #3 of 189"
  href: string;
  provenance: Provenance;
  /**
   * The reverse of the dealt card: the plain identifying facts a visitor
   * wants once the remarkable one has landed. Added for the Surprise me
   * modal, which turns the card over.
   *
   * Optional and nullable on purpose — added fields, never renamed ones,
   * so everything already written against this shape still compiles, and a
   * card without them simply prints fewer rows on its reverse.
   */
  region?: string | null;
  capital?: string | null;
  drivingSide?: string | null;
  tld?: string | null;
  /** ISO3 codes only, exactly as `DeckCountry` stores them. */
  neighbours?: string[];
}
