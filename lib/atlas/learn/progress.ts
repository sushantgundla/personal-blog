/**
 * The apprentice's record — the only state the learning section keeps.
 *
 * `localStorage` only, under one key (`atlas.learn.v1`), one JSON object. No
 * accounts, no server, no cookies: a visitor's record lives in their own
 * browser and nowhere else. The version is baked into the key, so a future
 * shape change is a new key and never a migration.
 *
 * Two rules this module lives by:
 *
 *  1. **It never throws.** `localStorage` can be absent (server render),
 *     disabled (Safari private mode historically threw on write), full, or
 *     hold something another tab / an older build / a curious visitor put
 *     there. Every read runs through `sanitise` and every failure path
 *     returns a fresh empty record instead of propagating. A broken quiz
 *     score is not worth a broken page.
 *
 *  2. **It is safe to import anywhere.** No top-level `window` touch, so a
 *     server component can import the grade ladder (`GRADES`, `gradeFor`)
 *     without Next complaining. The storage functions guard on
 *     `typeof window` themselves and simply no-op on the server.
 *
 * Callers must still only *call* the storage functions from inside
 * `useEffect` — see the note on `readProgress` — so the server render and
 * the first client render agree.
 */

import type { GameId } from './types';

/** The one localStorage key. The `v1` is the schema version. */
export const STORAGE_KEY = 'atlas.learn.v1';

/** The wall holds the last 20 runs. Older ones fall off the bottom. */
export const MAX_RUNS = 20;

/** The three real games, in the order the floor lays them out. */
export const GAME_IDS: readonly GameId[] = ['forgery', 'higher-lower', 'flags'];

/**
 * Plain-English names for the games, shared by the floor's cards and the
 * wall's ledger cards. Kept here rather than in a page so client components
 * can reach them without importing from a server component.
 */
export const GAME_LABELS: Record<GameId, string> = {
  forgery: 'Spot the forgery',
  'higher-lower': 'Higher or lower',
  flags: 'Guess the flag',
};

/** One game's lifetime record. */
export interface GameStat {
  /** Questions answered, ever. */
  asked: number;
  /** Of those, how many were right. */
  correct: number;
  /** Complete runs of ten finished, ever. */
  plays: number;
}

/** One finished run, as it hangs on the wall. */
export interface RunRecord {
  /** Stable key for React. Generated client-side; never meaningful. */
  id: string;
  game: GameId;
  correct: number;
  total: number;
  /** Epoch milliseconds, so it sorts without parsing. */
  at: number;
}

export interface Progress {
  version: 1;
  games: Record<GameId, GameStat>;
  /** Consecutive correct answers right now, across games. */
  currentStreak: number;
  /** The longest that streak has ever been. */
  bestStreak: number;
  /** Newest first, at most `MAX_RUNS`. */
  runs: RunRecord[];
}

/** One rung of the ladder. `at` is the lifetime-correct count that earns it. */
export interface Grade {
  name: string;
  at: number;
}

/**
 * The grade ladder, from §8 of the design doc. Ascending by `at` — `gradeFor`
 * below walks it backwards and relies on that order.
 */
export const GRADES: readonly Grade[] = [
  { name: 'Apprentice', at: 0 },
  { name: 'Engraver', at: 25 },
  { name: 'Plate-maker', at: 75 },
  { name: 'Inspector', at: 200 },
  { name: 'Master of the Mint', at: 500 },
];

/** The grade a given number of lifetime correct answers has earned. */
export function gradeFor(correct: number): Grade {
  const n = Number.isFinite(correct) ? correct : 0;
  let earned = GRADES[0];
  for (const grade of GRADES) {
    if (n >= grade.at) earned = grade;
  }
  return earned;
}

/** The next rung up, or `null` at the top of the ladder. */
export function nextGrade(correct: number): Grade | null {
  const n = Number.isFinite(correct) ? correct : 0;
  for (const grade of GRADES) {
    if (n < grade.at) return grade;
  }
  return null;
}

function emptyStat(): GameStat {
  return { asked: 0, correct: 0, plays: 0 };
}

/** A clean record. Returned by every failed read, so callers never see null. */
export function emptyProgress(): Progress {
  return {
    version: 1,
    games: {
      forgery: emptyStat(),
      'higher-lower': emptyStat(),
      flags: emptyStat(),
    },
    currentStreak: 0,
    bestStreak: 0,
    runs: [],
  };
}

/** A non-negative whole number, or the fallback. Rejects NaN, Infinity, text. */
function count(value: unknown, fallback = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return fallback;
  return Math.floor(value);
}

function isGameId(value: unknown): value is GameId {
  return value === 'forgery' || value === 'higher-lower' || value === 'flags';
}

function sanitiseStat(raw: unknown): GameStat {
  if (!raw || typeof raw !== 'object') return emptyStat();
  const r = raw as Record<string, unknown>;
  const asked = count(r.asked);
  // Never more right than asked — a hand-edited record would otherwise put
  // the visitor on a grade they didn't earn, and the seal is the one thing
  // on this page that is supposed to mean something.
  const correct = Math.min(count(r.correct), asked);
  return { asked, correct, plays: count(r.plays) };
}

function sanitiseRun(raw: unknown): RunRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (!isGameId(r.game)) return null;
  const total = count(r.total);
  if (total <= 0) return null;
  const correct = Math.min(count(r.correct), total);
  const at = count(r.at);
  if (at <= 0) return null;
  const id = typeof r.id === 'string' && r.id ? r.id : `${at}-${r.game}`;
  return { id, game: r.game, correct, total, at };
}

/**
 * Turn whatever was in storage into a valid `Progress`. Anything unexpected
 * is dropped field by field rather than rejecting the whole record — a
 * visitor who somehow ends up with one bad run on the wall keeps their
 * lifetime counts.
 */
function sanitise(raw: unknown): Progress {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptyProgress();
  const r = raw as Record<string, unknown>;
  const games = (r.games && typeof r.games === 'object' ? r.games : {}) as Record<string, unknown>;

  const runs = Array.isArray(r.runs)
    ? r.runs
        .map(sanitiseRun)
        .filter((run): run is RunRecord => run !== null)
        .sort((a, b) => b.at - a.at)
        .slice(0, MAX_RUNS)
    : [];

  const currentStreak = count(r.currentStreak);
  return {
    version: 1,
    games: {
      forgery: sanitiseStat(games.forgery),
      'higher-lower': sanitiseStat(games['higher-lower']),
      flags: sanitiseStat(games.flags),
    },
    currentStreak,
    bestStreak: Math.max(currentStreak, count(r.bestStreak)),
    runs,
  };
}

/**
 * Read the record.
 *
 * Returns a fresh empty record on the server, when storage is unavailable,
 * and when what is stored is missing, unparseable or the wrong shape.
 *
 * **Call this inside `useEffect`, never during render.** The server has no
 * `localStorage`, so rendering from it directly would make the server HTML
 * and the first client render disagree; React then throws out the whole
 * subtree, and on this page that means the buttons stop working. This has
 * already bitten the project once.
 */
export function readProgress(): Progress {
  if (typeof window === 'undefined') return emptyProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    return sanitise(JSON.parse(raw));
  } catch {
    return emptyProgress();
  }
}

/** Persist the record. Silently does nothing if storage refuses the write. */
export function writeProgress(progress: Progress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* Storage full or disabled. The visitor keeps playing; the record
       simply doesn't carry over. Not worth an error on screen. */
  }
}

/**
 * Record one answered question: the lifetime counts for that game, and the
 * streak. Call it exactly once per question, the moment it is answered.
 *
 * Returns the record it wrote, so a caller can render from the return value
 * without a second read.
 */
export function recordAnswer(game: GameId, correct: boolean): Progress {
  const progress = readProgress();
  const stat = progress.games[game];
  stat.asked += 1;
  if (correct) {
    stat.correct += 1;
    progress.currentStreak += 1;
    if (progress.currentStreak > progress.bestStreak) {
      progress.bestStreak = progress.currentStreak;
    }
  } else {
    progress.currentStreak = 0;
  }
  writeProgress(progress);
  return progress;
}

/**
 * Hang a finished run on the wall and count the play. Call it once, at the
 * end of the ten — it deliberately does **not** touch `asked` / `correct` /
 * the streak, because `recordAnswer` already did that question by question.
 */
export function recordRun(game: GameId, correct: number, total: number): Progress {
  const progress = readProgress();
  const safeTotal = Math.max(1, count(total, 1));
  const run: RunRecord = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    game,
    correct: Math.min(count(correct), safeTotal),
    total: safeTotal,
    at: Date.now(),
  };
  progress.games[game].plays += 1;
  progress.runs = [run, ...progress.runs].slice(0, MAX_RUNS);
  writeProgress(progress);
  return progress;
}

/** Correct answers across every game — what the grade is measured on. */
export function lifetimeCorrect(progress: Progress): number {
  return GAME_IDS.reduce((sum, id) => sum + progress.games[id].correct, 0);
}

/** Questions answered across every game. */
export function lifetimeAsked(progress: Progress): number {
  return GAME_IDS.reduce((sum, id) => sum + progress.games[id].asked, 0);
}

/** Wipe the record. Not wired to any control yet; kept for the console. */
export function clearProgress(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to do */
  }
}
