'use client'

import { useEffect, useRef, useState } from 'react'
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
 * One hidden country, described by clues revealed one at a time, broadest
 * first — region, then a population band, then (where the deck has them) an
 * official language and a neighbour, then the capital last.
 *
 * The clue list only ever grows: `revealedCount` tracks how many are showing
 * and resets on every new question via the `question.id` effect below, the
 * same pattern PlayScreen itself uses for `picked`. `answeredAtRef` freezes
 * the count the instant the player picks an option — after that the panel
 * quietly reveals every remaining clue (for the read-through) but the score
 * badge keeps quoting the moment of the decision, not the state after it.
 */
export function GuessCountryQuestion({ question, picked, disabled, onPick }: GuessCountryQuestionProps) {
  const answered = picked !== null
  const [revealedCount, setRevealedCount] = useState(1)
  const answeredAtRef = useRef(1)

  useEffect(() => {
    setRevealedCount(1)
    answeredAtRef.current = 1
  }, [question.id])

  function revealNext() {
    if (disabled) return
    setRevealedCount((n) => Math.min(question.clues.length, n + 1))
  }

  function pick(index: number) {
    if (disabled) return
    answeredAtRef.current = revealedCount
    onPick(index)
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
          Answered after {answeredAtRef.current} of {question.clues.length}{' '}
          {answeredAtRef.current === 1 ? 'clue' : 'clues'} — worth {pointsForClueCount(answeredAtRef.current)}{' '}
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
              onClick={() => pick(i)}
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
