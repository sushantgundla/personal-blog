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

/** The three games that make up a run of ten. "Surprise me" is not a game. */
export type GameId = 'forgery' | 'higher-lower' | 'flags';

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

export type Question = ForgeryQuestion | HigherLowerQuestion | FlagQuestion;

/** One run of ten, as `/atlas/learn/api/round` returns it. */
export interface Round {
  roundId: string;
  game: GameId;
  questions: Question[];
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
