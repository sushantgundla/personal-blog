/**
 * The tour's memory — three functions over one localStorage key each.
 *
 * Written in the same spirit as lib/atlas/learn/progress.ts: it never throws
 * and it is safe to import anywhere. `localStorage` can be missing (a server
 * render), switched off, full, or holding something a different build left
 * behind, and none of that is worth a broken page. Every call is wrapped, and
 * a failure just means the visitor is treated as someone who has not seen the
 * tour — so they get it again. Annoying at worst, never broken.
 *
 * The stored value is the string `"done"`. Nothing reads the value itself;
 * "the key exists" is the whole signal. The value is there so a human poking
 * at devtools can see what it means.
 */

const DONE = 'done';

/** Has this tour already been finished or skipped in this browser? */
export function hasSeenTour(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(key) === DONE;
  } catch {
    return false;
  }
}

/**
 * Remember that this tour is over.
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
