'use client'

import { useRef, useState } from 'react'
import type { GuessCountryQuestion as GuessCountryQuestionData } from '@/lib/atlas/learn/types'
import { answeredAtFor, pointsForClueCount } from '@/lib/atlas/learn/guess-country-score'
import styles from './play.module.css'

export interface GuessCountryQuestionProps {
  question: GuessCountryQuestionData
  picked: number | null
  disabled: boolean
  onPick: (index: number) => void
}

/**
 * One hidden country, described by clues revealed one at a time, broadest
 * first — region, then a population band, then (where the deck has them) an
 * official language and a neighbour, then the capital last.
 *
 * The clue list only ever grows: `revealedCount` tracks how many are showing.
 * PlayScreen keys this component by `question.id`, so every new question
 * mounts fresh at one clue — no reset effect, and so no frame where the
 * previous question's reveal count is painted over the new question's clues.
 *
 * The score (lib/atlas/learn/guess-country-score.ts) quotes how many clues
 * were showing the instant the player picked. Once picked, the reveal button
 * is gone, so `revealedCount` is already frozen — after that the panel
 * quietly shows every remaining clue for the read-through, but the score
 * line keeps quoting the moment of the decision.
 */
export function GuessCountryQuestion({ question, picked, disabled, onPick }: GuessCountryQuestionProps) {
  const answered = picked !== null
  const [revealedCount, setRevealedCount] = useState(1)
  const answeredAt = answeredAtFor(picked, revealedCount)
  const firstOptionRef = useRef<HTMLButtonElement>(null)

  function revealNext() {
    if (disabled) return
    const next = Math.min(question.clues.length, revealedCount + 1)
    setRevealedCount(next)
    // Revealing the last clue removes the button that has focus, which
    // would drop a keyboard player back to the top of the page. Hand focus
    // to the first answer instead.
    if (next >= question.clues.length) firstOptionRef.current?.focus()
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

      {/* Only for a right answer: a wrong name is worth nothing, and the
          line used to tell a player who missed that they had earned 100. */}
      {answeredAt !== null && picked === question.answer && (
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
              ref={i === 0 ? firstOptionRef : undefined}
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
