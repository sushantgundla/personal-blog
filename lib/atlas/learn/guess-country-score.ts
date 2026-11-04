// The display-only score for "Guess the country" — kept out of the
// component (app/atlas/learn/_components/GuessCountryQuestion.tsx) so it is
// a plain .ts module that the unit tests in __tests__ can import without a
// JSX toolchain.
//
// It never touches `recordAnswer` or the ladder, which stay strictly
// right/wrong for every game on the floor (see ./progress.ts). It exists
// purely to make good on the promise printed on the reveal button: asking
// for more costs you.

/**
 * How much a correct answer is worth, by how many clues were showing when the
 * player committed to one.
 *
 * A simple, honest scale: 100 for naming it on the first clue, falling by 20
 * for every clue asked for after that, with a floor of 20 so the last, most
 * revealing clue is never worth nothing.
 *
 *   clue 1 -> 100      clue 3 -> 60      clue 5 -> 20
 *   clue 2 -> 80        clue 4 -> 40
 */
export function pointsForClueCount(cluesShown: number): number {
  return Math.max(20, 100 - (cluesShown - 1) * 20);
}

/**
 * Whether an answer has just landed and, if so, how many clues were showing.
 *
 * A pure function of the `picked` prop and the reveal count, so it gives the
 * same result whichever way `picked` got set — a click on an option, or
 * PlayScreen's window `keydown` handler calling `onPick` directly. That
 * parity is what lib/atlas/learn/__tests__/guess-country-question.test.ts
 * pins down: an earlier version froze the count inside a click-only wrapper,
 * so a keyboard answer always read "after 1 clue".
 *
 * `picked` is null while the question is still open. Once it is set the
 * reveal button is gone, so `revealedCount` cannot change again and this
 * keeps returning the count at the moment of the decision.
 */
export function answeredAtFor(picked: number | null, revealedCount: number): number | null {
  return picked === null ? null : revealedCount;
}
