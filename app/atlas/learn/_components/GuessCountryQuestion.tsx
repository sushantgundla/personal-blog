'use client'

import { useEffect, useState } from 'react'
import type { GuessCountryQuestion as GuessCountryQuestionData } from '@/lib/atlas/learn/types'
import styles from './play.module.css'

export interface GuessCountryQuestionProps {
  question: GuessCountryQuestionData
  picked: number | null
  disabled: boolean
  onPick: (index: number) => void
}

/**
 * How much a correct answer is worth, by how many clues were showing when the
 * player committed to one. This is a display-only score — it never touches
 * `recordAnswer` or the ladder, which stay strictly right/wrong for every
 * game on the floor (see lib/atlas/learn/progress.ts). It exists purely to
 * make good on the promise printed on the reveal button: asking for more
 * costs you.
 *
 * A simple, honest scale: 100 for naming it on the first clue, falling by 20
 * for every clue asked for after that, with a floor of 20 so the last, most
 * revealing clue is never worth nothing.
 *
 *   clue 1 -> 100      clue 3 -> 60      clue 5 -> 20
 *   clue 2 -> 80        clue 4 -> 40
 */
function pointsForClueCount(cluesShown: number): number {
  return Math.max(20, 100 - (cluesShown - 1) * 20)
}

/**
 * Whether an answer has just landed and, if so, how many clues were showing.
 *
 * Pulled out as a pure function — no hooks, no component — so the parity it
 * guarantees between answering by click and answering by keyboard can be
 * unit tested without rendering anything. See
 * lib/atlas/learn/__tests__/guess-country-question.test.ts.
 *
 * `picked` is null while the question is still open; the moment it turns
 * non-null is exactly when `revealedCount` should freeze, regardless of
 * *how* it got picked — a click on an option here, or PlayScreen's window
 * `keydown` handler calling the `onPick` prop directly. Once picked,
 * `revealedCount` cannot change again (the reveal button disappears), so
 * returning it on every later call is harmless, not a second freeze.
 */
export function answeredAtFor(picked: number | null, revealedCount: number): number | null {
  return picked === null ? null : revealedCount
}

/**
 * One hidden country, described by clues revealed one at a time, broadest
 * first — region, then a population band, then (where the deck has them) an
 * official language and a neighbour, then the capital last.
 *
 * The clue list only ever grows: `revealedCount` tracks how many are showing
 * and resets on every new question via the `question.id` effect below, the
 * same pattern PlayScreen itself uses for `picked`. `answeredAt` freezes the
 * count the instant the player picks an option — after that the panel
 * quietly reveals every remaining clue (for the read-through) but the score
 * badge keeps quoting the moment of the decision, not the state after it.
 */
export function GuessCountryQuestion({ question, picked, disabled, onPick }: GuessCountryQuestionProps) {
  const answered = picked !== null
  const [revealedCount, setRevealedCount] = useState(1)
  /** How many clues were showing the instant the player picked — frozen in
   *  state (not a ref) because the freeze has to survive to the very render
   *  that shows the score line below; a ref written from an effect updates
   *  silently and never repaints the number it just changed. */
  const [answeredAt, setAnsweredAt] = useState(1)

  useEffect(() => {
    setRevealedCount(1)
    setAnsweredAt(1)
  }, [question.id])

  useEffect(() => {
    const next = answeredAtFor(picked, revealedCount)
    if (next !== null) setAnsweredAt(next)
  }, [picked, revealedCount])

  function revealNext() {
    if (disabled) return
    setRevealedCount((n) => Math.min(question.clues.length, n + 1))
  }

  // Once answered, show every clue that was on the card — this is a teaching
  // moment same as the verdict panel below it — but the score badge still
  // quotes how many were showing at the moment of the pick.
  const shown = answered ? question.clues.length : revealedCount
  const canRevealMore = !answered && revealedCount < question.clues.length

  function stateOf(index: number): 'idle' | 'right' | 'wrong' {
    if (!answered) return 'idle'
    if (index === question.answer) return 'right'
    if (index === picked) return 'wrong'
    return 'idle'
  }

  return (
    <div className={styles.question}>
      <p className={styles.prompt}>{question.prompt}</p>

      <ol className={styles.clueList} aria-live="polite">
        {question.clues.slice(0, shown).map((clue, i) => (
          <li key={`${question.id}-clue-${i}`} className={styles.clueRow}>
            <span className={styles.clueLabel}>{clue.label}</span>
            <span className={styles.clueText}>{clue.text}</span>
          </li>
        ))}
      </ol>

      {canRevealMore && (
        <button type="button" className={styles.revealButton} onClick={revealNext}>
          Reveal another clue — next one drops it to {pointsForClueCount(revealedCount + 1)} points
        </button>
      )}

      {answered && (
        <p className={styles.clueScore}>
          Answered after {answeredAt} of {question.clues.length}{' '}
          {answeredAt === 1 ? 'clue' : 'clues'} — worth {pointsForClueCount(answeredAt)}{' '}
          points.
        </p>
      )}

      <ul className={styles.options} data-answered={answered} data-layout="grid">
        {question.options.map((option, i) => (
          <li key={`${question.id}-${option.iso3}`}>
            <button
              type="button"
              className={styles.option}
              data-state={stateOf(i)}
              data-picked={picked === i}
              disabled={disabled}
              onClick={() => onPick(i)}
            >
              <span className={styles.optionKey} aria-hidden="true">
                {i + 1}
              </span>
              <span className={styles.optionBody}>
                <span className={styles.optionText}>{option.name}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
