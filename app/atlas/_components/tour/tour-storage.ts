/**
 * The tour's memory — two things it remembers, in two different places.
 *
 * Written in the same spirit as lib/atlas/learn/progress.ts: it never throws
 * and it is safe to import anywhere. Storage can be missing (a server render),
 * switched off, full, or holding something a different build left behind, and
 * none of that is worth a broken page. Every call is wrapped, and a failure
 * just means the visitor is treated as someone who has not seen the tour — so
 * they get it again. Annoying at worst, never broken.
 *
 * **Seen** lives in `localStorage`, under the key in tour-steps.ts. The stored
 * value is the string `"done"`. Nothing reads the value itself; "the key
 * exists" is the whole signal. The value is there so a human poking at
 * devtools can see what it means.
 *
 * **Resume** lives in `sessionStorage`, and is a much shorter-lived thing: it
 * is written only in the moment the tour walks you from /atlas to
 * /atlas/learn (or back), and wiped the instant it has been used. Its whole
 * job is to survive a hard reload landing in that gap, so a refresh mid-walk
 * picks the walk back up instead of dropping it. sessionStorage rather than
 * localStorage because a half-finished walk belongs to this sitting in this
 * tab and to nothing else.
 */

const DONE = 'done';

/** Has the tour already been finished or skipped in this browser? */
export function hasSeenTour(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(key) === DONE;
  } catch {
    return false;
  }
}

/**
 * Remember that the tour is over.
 *
 * Called both when the tour is finished and when it is skipped. Skipping
 * deliberately counts as done: someone dismissing a tour means "not now and
 * not again", and showing it to them on the next visit would read as the page
 * ignoring them.
 */
export function markTourSeen(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, DONE);
  } catch {
    /* Storage blocked or full. The tour simply runs again next visit. */
  }
}

/** Forget it, so the tour runs again. Used by the "Take the tour" link. */
export function clearTourSeen(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* Nothing to do — if we cannot clear it we still fire the start event. */
  }
}

/** Where a walk in progress should pick back up. */
export interface TourResume {
  /** The `id` of the step to show next. */
  at: string;
  /**
   * The route the walk was *started* on, which is what decides how many steps
   * it has — see `queueForStart` in tour-steps.ts. Without this, a reload on
   * /atlas/learn could not tell a walk that began on the plate (ten steps,
   * currently at seven) from one that began on the floor (four steps).
   */
  from: string;
}

const RESUME_KEY = 'atlas.tour.resume';

/**
 * Read the marker, or `null` if there isn't one worth trusting.
 *
 * Anything unexpected in there — half-written JSON, a shape an older build
 * wrote, a key some other tab left — reads as `null` rather than throwing.
 * The caller checks the step id against the real step list anyway, so a stale
 * marker cannot resume a step that no longer exists.
 */
export function readTourResume(): TourResume | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(RESUME_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const { at, from } = parsed as { at?: unknown; from?: unknown };
    if (typeof at !== 'string' || typeof from !== 'string') return null;
    return { at, from };
  } catch {
    return null;
  }
}

/** Leave a note saying where to pick back up, just before navigating. */
export function writeTourResume(resume: TourResume): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(RESUME_KEY, JSON.stringify(resume));
  } catch {
    /* Storage blocked or full. The walk still crosses the page fine — it just
       would not survive a hard reload landing in the gap. */
  }
}

/**
 * Tear the note up. Called the moment it has been used, and again whenever the
 * tour ends by any route — finished, skipped, Escaped, or navigated away from.
 * A marker left lying around would restart a walk somebody had already left.
 */
export function clearTourResume(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(RESUME_KEY);
  } catch {
    /* Nothing to do. */
  }
}
