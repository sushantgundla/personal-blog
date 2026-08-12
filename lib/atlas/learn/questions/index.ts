// The one entry point the route handler and the self-check both call.
//
// `buildRound` is where the per-round de-duplication lives, because it is the
// only place that can see a whole run of ten at once:
//
//   - forgery        — no country appears twice
//   - higher-lower   — no pairing appears twice, in either order
//   - flags          — no flag appears twice
//   - guess-country  — no country appears twice
//   - where-in-the-world — no country appears twice
//
// Everything is driven by one `Rng` seeded from the round's seed, and each
// generator draws from it in order, so the same seed always produces the same
// ten questions. §7 of the spec promises that; scripts/atlas/learn-selfcheck.mjs
// checks it by building the same round twice and comparing the JSON.
//
// A generator that cannot build a clean question returns `null`, and this file
// answers that by ending the round short rather than by lowering a standard.
// Nine good questions beat ten with a broken one in it — see §6, "Never ship a
// forgery that failed its checks."
import type { GameId, Question, Round, SurpriseCard } from "../types";
import { getDeck } from "../deck";
import { makeRng } from "../rng";
import { hashString } from "../../hash";
import { buildForgery } from "./forgery";
import { buildHigherLower, pairKey } from "./higher-lower";
import { buildFlagQuestion } from "./flags";
import { buildGuessCountry } from "./guess-country";
import { buildWhereInTheWorld } from "./where-in-the-world";
import { buildSurpriseCard } from "./surprise";

export { buildForgery } from "./forgery";
export { buildHigherLower, pairKey } from "./higher-lower";
export { buildFlagQuestion } from "./flags";
export { buildGuessCountry, CLUE_ORDER, populationBand } from "./guess-country";
export { buildWhereInTheWorld } from "./where-in-the-world";
export { buildSurpriseCard, candidatesFor, ordinal } from "./surprise";
// Not a game — see country-of-day.ts's header. Exported here alongside
// everything else this file re-exports so the route handler and the
// self-check both have one door into lib/atlas/learn/questions/.
export { buildCountryOfDay, utcDateStamp } from "./country-of-day";

/** §7 clamps `count` to 1..20 at the route; this is the same ceiling, enforced here too. */
const MAX_QUESTIONS = 20;

/**
 * How many `null`s in a row before the round gives up. Each generator already
 * retries dozens of countries internally, so several consecutive failures mean
 * the deck genuinely has nothing left that satisfies the rules — not bad luck.
 */
const MAX_CONSECUTIVE_FAILURES = 5;

/**
 * The same five ids as `GAME_IDS` in lib/atlas/learn/progress.ts, in the same
 * order, so the questions module has its own door and a caller here never has
 * to reach into the progress module. Reordered with it on 2026-08-13 (best
 * first — see that file for why). Order does not matter to `isGameId` below,
 * which only asks whether an id is in the list; it is kept identical so the
 * two lists never look like they disagree.
 */
export const GAME_IDS: readonly GameId[] = [
  "guess-country",
  "flags",
  "where-in-the-world",
  "forgery",
  "higher-lower",
];

/** Type guard for the route handler's `?game=` parameter. */
export function isGameId(value: string): value is GameId {
  return GAME_IDS.indexOf(value as GameId) !== -1;
}

/**
 * A batch of ready-made questions.
 *
 * The same `seed` always gives the same round. `count` is clamped to 1..20.
 * Throws if not a single question could be built — an empty round is a bug the
 * caller must surface as an error, not an empty screen.
 */
export async function buildRound(
  game: GameId,
  count: number,
  seed: string
): Promise<Round> {
  const deck = await getDeck();
  const wanted = Math.max(1, Math.min(MAX_QUESTIONS, Math.floor(count) || 1));
  const rng = makeRng(`${game}:${seed}`);

  const questions: Question[] = [];
  // `usedIso3` is shared by forgery and flags; only one of them runs per round,
  // so there is no cross-game interference to worry about.
  const usedIso3 = new Set<string>();
  const usedPairs = new Set<string>();
  let consecutiveFailures = 0;

  while (questions.length < wanted && consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
    let question: Question | null = null;

    if (game === "forgery") {
      question = buildForgery(deck, rng, usedIso3);
      if (question) usedIso3.add(question.country.iso3);
    } else if (game === "higher-lower") {
      question = buildHigherLower(deck, rng, usedPairs);
      if (question) {
        usedPairs.add(pairKey(question.options[0]!.iso3, question.options[1]!.iso3));
      }
    } else if (game === "flags") {
      question = buildFlagQuestion(deck, rng, usedIso3);
      if (question) usedIso3.add(question.options[question.answer]!.iso3);
    } else if (game === "guess-country") {
      question = buildGuessCountry(deck, rng, usedIso3);
      if (question) usedIso3.add(question.options[question.answer]!.iso3);
    } else {
      question = buildWhereInTheWorld(deck, rng, usedIso3);
      if (question) usedIso3.add(question.country.iso3);
    }

    if (!question) {
      consecutiveFailures++;
      continue;
    }
    consecutiveFailures = 0;
    questions.push(question);
  }

  if (questions.length === 0) {
    throw new Error(
      `Could not build a single ${game} question from the deck captured ${deck.capturedAt} — ` +
        `rebuild it with \`npm run atlas:deck\`.`
    );
  }

  return {
    roundId: `${game}-${hashString(seed).toString(36)}`,
    game,
    questions,
  };
}

/**
 * One Surprise me card. Same seed, same card.
 *
 * Throws if nothing remarkable could be found in sixty attempts, which would
 * mean the deck has no ranks in it at all.
 */
export async function buildSurprise(seed: string): Promise<SurpriseCard> {
  const deck = await getDeck();
  const card = buildSurpriseCard(deck, makeRng(`surprise:${seed}`));
  if (!card) {
    throw new Error(
      `Could not find a remarkable fact in the deck captured ${deck.capturedAt} — ` +
        `rebuild it with \`npm run atlas:deck\`.`
    );
  }
  return card;
}
