// Reads content/atlas/learn/deck.json once per server process and keeps it
// in module scope — the same pattern lib/atlas/rankings.ts uses for
// content/atlas/snapshot/rankings.json, for the same reason.
//
// The deck is what makes a question cheap. Without it, generating one would
// mean reading and parsing rankings.json plus up to 250 country files (~10 MB)
// on every cold start. With it, one file read of a couple of megabytes,
// once, and after that every question is pure CPU over an in-memory object —
// about a millisecond. See scripts/atlas/build-deck.mjs's header and §3.1 of
// docs/superpowers/specs/2026-08-03-atlas-learn-design.md.
//
// deck.json is a server-side artifact. It contains the answer to every
// question that can be asked, so nothing here may be imported into a client
// component — importing `node:fs/promises` from one would fail the build
// anyway, which is the guardrail working as intended.
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Deck, DeckCountry, DeckIndicator } from "./types";

const DECK_PATH = path.join(process.cwd(), "content", "atlas", "learn", "deck.json");

/**
 * The in-flight read, not the resolved deck. Memoising the *promise* is the
 * point: ten concurrent first requests to a fresh lambda all await the same
 * single read, instead of each starting their own. Once it resolves, every
 * later call gets the same already-settled promise for free.
 */
let deckPromise: Promise<Deck> | null = null;

/** Built once, on first use, from the deck the promise above resolved to. */
let countriesByIso3: Map<string, DeckCountry> | null = null;
let indicatorsByCode: Map<string, DeckIndicator> | null = null;

async function loadDeck(): Promise<Deck> {
  let raw: string;
  try {
    raw = await readFile(DECK_PATH, "utf-8");
  } catch (err) {
    // Deliberately fatal, and deliberately loud. Unlike the dossier snapshot
    // — which has a live World Bank fetch to fall back on — there is no
    // runtime path that can rebuild the deck, and a half-built round is worse
    // than an error page. The message names the fix rather than the cause.
    throw new Error(
      `The learning deck is missing or unreadable at ${DECK_PATH} — run \`npm run atlas:deck\` to build it. (${
        err instanceof Error ? err.message : String(err)
      })`
    );
  }

  const deck = JSON.parse(raw) as Deck;
  countriesByIso3 = new Map(deck.countries.map((c) => [c.iso3, c]));
  indicatorsByCode = new Map(deck.indicators.map((i) => [i.code, i]));
  return deck;
}

/** The whole deck. Reads the file at most once per server process. */
export function getDeck(): Promise<Deck> {
  if (!deckPromise) {
    deckPromise = loadDeck().catch((err) => {
      // Don't cache a failed read: a deploy where the file arrives late, or a
      // transient EMFILE, should be retryable rather than poisoning the
      // process for its whole life.
      deckPromise = null;
      throw err;
    });
  }
  return deckPromise;
}

/** One country by ISO3, or null if the deck has no entry for it. */
export async function getDeckCountry(iso3: string): Promise<DeckCountry | null> {
  await getDeck();
  return countriesByIso3?.get(iso3) ?? null;
}

/** One indicator by World Bank code, or null if it didn't clear the >= 30 bar. */
export async function getIndicator(code: string): Promise<DeckIndicator | null> {
  await getDeck();
  return indicatorsByCode?.get(code) ?? null;
}
