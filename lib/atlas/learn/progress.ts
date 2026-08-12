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

/**
 * The five real games, in the order the floor lays them out.
 *
 * Reordered 2026-08-13, best first. The old order — forgery, higher-lower,
 * flags, guess-country, where-in-the-world — was simply the order they were
 * built in; the owner has since played all five and ranked them by how fun
 * they actually are, and the floor should lead with the best one rather
 * than with whatever happened to ship first.
 *
 * Reordering costs nothing anyone has earned: `Progress.games` is a
 * `Record<GameId, GameStat>` and `RunRecord.game` stores an id, so saved
 * progress is keyed by name and never by position. Nothing in the codebase
 * indexes this array by number — keep it that way, and this list stays free
 * to be reordered again.
 *
 * Must stay in step with the second `GAME_IDS` in
 * lib/atlas/learn/questions/index.ts and with `GAMES` in
 * app/atlas/learn/page.tsx.
 */
export const GAME_IDS: readonly GameId[] = [
  'guess-country',
  'flags',
  'where-in-the-world',
  'forgery',
  'higher-lower',
];

/**
 * Plain-English names for the games, shared by the floor's cards and the
 * wall's ledger cards. Kept here rather than in a page so client components
 * can reach them without importing from a server component.
 */
export const GAME_LABELS: Record<GameId, string> = {
  forgery: 'Spot the forgery',
  'higher-lower': 'Higher or lower',
  flags: 'Guess the flag',
  'guess-country': 'Guess the country',
  'where-in-the-world': 'Where in the world',
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
 * The grade ladder — the one source of truth for every rank on the floor.
 * Nothing else in the codebase may hard-code a rung name or a threshold; a
 * component that wants "what grade is this / what's next / how far" asks
 * `gradeFor`, `nextGrade`, `gradeProgress` or `ladderWindow` below.
 *
 * **Fifteen real trades, not invented ranks.** The section's whole conceit is
 * that the visitor is an apprentice at a mint, so the ladder walks an actual
 * security-printing career: the ink and the press first, then the engraving
 * bench, then the plate, then the offices that sign for it. A siderographer
 * transfers a finished engraving onto the printing plate; a rose-engine
 * turner cuts the guilloché lace. Both are jobs someone really held.
 *
 * **The thresholds are the game.** They are tight at the bottom and widen
 * hard at the top, and that shape is deliberate:
 *
 *  - The first promotion lands at 8 correct — inside a first run of ten for
 *    a decent player, inside a second run for anybody. The old ladder put
 *    the first rung at 25, so a new player finished a whole run, got four
 *    right, and the seal did not move at all. That is the bug this fixes.
 *  - The steps then grow 8, 12, 20, 30, 40, 50, 65, 75, 100, 125, 175, 250,
 *    350, 500. Early runs each move you up; by the middle a rung is a few
 *    sittings; the summit at 1800 is a genuinely long haul.
 *
 * Ascending by `at`, and `GRADES[0].at` must stay 0 — `gradeFor` relies on
 * both, and on there always being a rung a score of zero already holds.
 *
 * Changing a threshold is safe for existing players: the ladder is read-only
 * over the lifetime counts already in `atlas.learn.v1` and stores nothing of
 * its own, so a visitor simply re-reads their same number against the new
 * rungs. It can move someone's grade, never their score.
 */
export const GRADES: readonly Grade[] = [
  { name: 'Apprentice', at: 0 },
  { name: 'Ink-hand', at: 8 },
  { name: 'Press-feeder', at: 20 },
  { name: 'Pressman', at: 40 },
  { name: 'Proof-puller', at: 70 },
  { name: 'Die-sinker', at: 110 },
  { name: 'Engraver', at: 160 },
  { name: 'Rose-engine Turner', at: 225 },
  { name: 'Siderographer', at: 300 },
  { name: 'Plate-maker', at: 400 },
  { name: 'Inspector', at: 525 },
  { name: 'Assayer', at: 700 },
  { name: 'Chief Engraver', at: 950 },
  { name: 'Warden of the Mint', at: 1300 },
  { name: 'Master of the Mint', at: 1800 },
];

/** The top rung. Held once `lifetimeCorrect` reaches its `at`. */
export const TOP_GRADE: Grade = GRADES[GRADES.length - 1];

/** A count that is safe to compare against a threshold. */
function safeCorrect(correct: number): number {
  return Number.isFinite(correct) && correct > 0 ? Math.floor(correct) : 0;
}

/** The index of the grade a given lifetime-correct count has earned. */
function gradeIndexFor(correct: number): number {
  const n = safeCorrect(correct);
  let earned = 0;
  for (let i = 0; i < GRADES.length; i += 1) {
    if (n >= GRADES[i].at) earned = i;
  }
  return earned;
}

/** The grade a given number of lifetime correct answers has earned. */
export function gradeFor(correct: number): Grade {
  return GRADES[gradeIndexFor(correct)];
}

/** The next rung up, or `null` at the top of the ladder. */
export function nextGrade(correct: number): Grade | null {
  const n = safeCorrect(correct);
  for (const grade of GRADES) {
    if (n < grade.at) return grade;
  }
  return null;
}

/**
 * Everything a component needs to say about where a visitor stands, worked
 * out once, here.
 *
 * The point is that no component does this arithmetic itself. A view that
 * subtracts `next.at - correct` on its own prints "NaN more to undefined"
 * the day someone reaches the top rung — this returns `next: null`,
 * `remaining: 0` and `climbed: 1` for that case, so the caller only has to
 * choose a different sentence, never guard a sum.
 */
export interface GradeProgress {
  /** The grade held right now. Never null — everyone holds `GRADES[0]`. */
  grade: Grade;
  /** The rung above, or `null` at the summit. */
  next: Grade | null;
  /** 1-based rung number, for "Rung 4 of 15". */
  rung: number;
  /** How many rungs the ladder has. */
  rungs: number;
  /** Correct answers still needed for `next`. 0 at the summit. */
  remaining: number;
  /** How far across the current rung, 0..1. 1 at the summit. */
  climbed: number;
  /** True once the top grade is held. */
  atTop: boolean;
}

export function gradeProgress(correct: number): GradeProgress {
  const n = safeCorrect(correct);
  const index = gradeIndexFor(n);
  const grade = GRADES[index];
  const next = index + 1 < GRADES.length ? GRADES[index + 1] : null;
  const span = next ? next.at - grade.at : 0;
  return {
    grade,
    next,
    rung: index + 1,
    rungs: GRADES.length,
    remaining: next ? Math.max(0, next.at - n) : 0,
    climbed: span > 0 ? Math.min(1, Math.max(0, (n - grade.at) / span)) : 1,
    atTop: next === null,
  };
}

/** One printed row of the shortened ladder. */
export interface LadderRow {
  grade: Grade;
  /** 1-based rung number on the full ladder. */
  rung: number;
  /** Already reached. */
  earned: boolean;
  /** The rung held right now. */
  held: boolean;
  /** Rungs were skipped between the row above and this one. */
  gapBefore: boolean;
}

/**
 * The few rungs worth printing: the one below, the one held, the next two,
 * and the summit.
 *
 * Fifteen rows is a wall of text and it overflows a phone. What a climber
 * actually wants is where they are, what is immediately next, and what they
 * are ultimately climbing towards — so this window follows them up the
 * ladder and `gapBefore` marks the stretch it skipped, which the panel draws
 * as a break rather than pretending the rungs are adjacent.
 *
 * Always returns at least one row, and never a duplicate.
 */
export function ladderWindow(correct: number): LadderRow[] {
  const n = safeCorrect(correct);
  const held = gradeIndexFor(n);
  const last = GRADES.length - 1;

  // A Set because the windows overlap at both ends: near the bottom
  // `held - 1` falls off, near the top the neighbours *are* the summit.
  const wanted = new Set<number>([held, last]);
  if (held > 0) wanted.add(held - 1);
  if (held + 1 <= last) wanted.add(held + 1);
  if (held + 2 <= last) wanted.add(held + 2);
  // At the summit the two rungs below are the interesting ones — otherwise
  // the panel would print a single lonely line.
  if (held === last && last >= 2) wanted.add(last - 2);

  const indices = Array.from(wanted).sort((a, b) => a - b);
  return indices.map((index, position) => ({
    grade: GRADES[index],
    rung: index + 1,
    earned: n >= GRADES[index].at,
    held: index === held,
    gapBefore: position > 0 && index - indices[position - 1] > 1,
  }));
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
      'guess-country': emptyStat(),
      'where-in-the-world': emptyStat(),
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
  return (
    value === 'forgery' ||
    value === 'higher-lower' ||
    value === 'flags' ||
    value === 'guess-country' ||
    value === 'where-in-the-world'
  );
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
      'guess-country': sanitiseStat(games['guess-country']),
      'where-in-the-world': sanitiseStat(games['where-in-the-world']),
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
