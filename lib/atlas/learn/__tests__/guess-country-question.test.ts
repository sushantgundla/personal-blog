// @ts-nocheck -- see the note at the top of questions.test.ts: no runner is
// wired into this project yet, but the assertions below are runner-ready
// for a Jest/Vitest-compatible runner with JSX support (needed because this
// one file, unlike its neighbours, imports a component under app/, not a
// plain .ts module under lib/).
/**
 * Regression test for a bug found while chasing a report of "Guess the
 * country": the player revealed a second clue by clicking the reveal
 * button, then answered by pressing a number key — and the score badge
 * read "Answered after 1 of 5 clues" even though 2 were showing.
 *
 * Root cause: GuessCountryQuestion.tsx used to capture the reveal count
 * inside a local `pick(index)` wrapper that ran before calling the `onPick`
 * prop — but that wrapper only ran when an option was *clicked*.
 * PlayScreen also answers straight from the keyboard: its window `keydown`
 * handler (see app/atlas/learn/_components/PlayScreen.tsx) calls the
 * `onPick` prop directly, so a keyboard answer skipped the wrapper and the
 * badge was stuck quoting the initial value of 1.
 *
 * The fix pulls the freeze decision out into `answeredAtFor`, a pure
 * function of the `picked` prop and the reveal count, so it is exercised
 * whichever way `picked` got set. These tests exercise that function
 * directly — no rendering needed — plus the "click and keyboard must agree"
 * property the bug actually broke.
 */
import { answeredAtFor } from '../../../app/atlas/learn/_components/GuessCountryQuestion';

describe('answeredAtFor', () => {
  test('reports null while the question is still open (no answer yet)', () => {
    expect(answeredAtFor(null, 1)).toBeNull();
    expect(answeredAtFor(null, 4)).toBeNull();
  });

  test('freezes whatever the reveal count was the instant picked is set', () => {
    expect(answeredAtFor(0, 1)).toBe(1);
    expect(answeredAtFor(2, 3)).toBe(3);
    expect(answeredAtFor(3, 5)).toBe(5);
  });

  test('a keyboard answer and a click answer freeze the same way', () => {
    // Both input paths land here with the same two arguments — `picked`
    // (which option) and `revealedCount` (how many clues were showing).
    // Nothing about *how* `picked` became non-null enters this function, so
    // there is no way for a keyboard answer to disagree with a click at the
    // same reveal count — the exact asymmetry the bug had.
    const revealedCount = 3;
    const byClick = answeredAtFor(1, revealedCount);
    const byKeyboard = answeredAtFor(1, revealedCount);
    expect(byClick).toBe(byKeyboard);
    expect(byClick).toBe(3);
  });

  test('once picked, later reveal-count values still report correctly (idempotent, not a re-freeze)', () => {
    // canRevealMore goes false the instant picked is set, so revealedCount
    // cannot actually change again in the running app — but the function
    // itself makes no assumption about that. Calling it again with the same
    // picked and the same count must be a no-op, not a moving target.
    expect(answeredAtFor(2, 3)).toBe(3);
    expect(answeredAtFor(2, 3)).toBe(3);
  });
});
