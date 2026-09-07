'use client'

import { useEffect, useRef, useState } from 'react'
import type { QuizQuestion } from '@/lib/learn'
import { useProgress } from './useProgress'
import styles from './Quiz.module.css'

interface Props {
  courseSlug: string
  lessonSlug: string
  questions: QuizQuestion[]
}

/** a, b, c, d — the key printed in front of each option. */
const KEYS = 'abcdefghij'

/**
 * The end-of-lesson quiz. Every question is on screen at once and there is
 * no submit button: clicking an option marks it straight away, shows the
 * explanation, and locks that question. Finishing the last question is
 * what marks the lesson done.
 *
 * All the answers live in one `chosen` object keyed by question index —
 * one piece of state for the whole quiz, not one per question — so the
 * "have they finished?" check is a single comparison against the length.
 */
export function Quiz({ courseSlug, lessonSlug, questions }: Props) {
  const [chosen, setChosen] = useState<Record<number, number>>({})
  const { markDone } = useProgress(courseSlug)

  // markDone writes to localStorage, so it must fire exactly once when the
  // last question is answered. A ref, not state: flipping it must not cause
  // another render, and it has to survive markDone changing identity.
  const marked = useRef(false)

  const total = questions.length
  const answeredCount = Object.keys(chosen).length
  const finished = total > 0 && answeredCount === total
  const correct = questions.reduce(
    (sum, question, index) => (chosen[index] === question.answer ? sum + 1 : sum),
    0
  )

  useEffect(() => {
    if (!finished || marked.current) return
    marked.current = true
    markDone(lessonSlug)
  }, [finished, lessonSlug, markDone])

  if (total === 0) return null

  function choose(questionIndex: number, optionIndex: number) {
    setChosen((current) =>
      // Already answered — the click does nothing. The buttons are disabled
      // too; this is the guard for anything that gets past that.
      questionIndex in current ? current : { ...current, [questionIndex]: optionIndex }
    )
  }

  return (
    <section className={styles.quiz} aria-labelledby="lesson-quiz">
      {/* Two halves, because the second one is an instruction rather than
          part of the label. Retrieval practice only works if the reader
          answers from memory first, and nothing else on the page says so —
          set flat in one line it reads as decoration and gets skipped. */}
      <h2 id="lesson-quiz" className={styles.heading}>
        <span className={`sign ${styles.headingLead}`}>RECALL</span>{' '}
        <span className="sign-quiet">NO SCROLLING BACK</span>
      </h2>

      <ol className={styles.list}>
        {questions.map((question, questionIndex) => {
          const picked = chosen[questionIndex]
          const answered = questionIndex in chosen
          const labelId = `quiz-q${questionIndex}-label`
          const textId = `quiz-q${questionIndex}-text`

          return (
            <li key={question.q}>
              <p className={`sign-quiet ${styles.qLabel}`} id={labelId}>
                QUESTION {String(questionIndex + 1).padStart(2, '0')}
              </p>
              <p className={styles.qText} id={textId}>
                {question.q}
              </p>

              <div
                className={styles.options}
                role="group"
                aria-labelledby={`${labelId} ${textId}`}
              >
                {question.options.map((option, optionIndex) => {
                  const isAnswer = optionIndex === question.answer
                  const isPicked = optionIndex === picked

                  // Before the click every option looks the same. After it,
                  // the correct one is always green — so a wrong pick shows
                  // both what was chosen and what it should have been.
                  let state = ''
                  if (answered) {
                    if (isAnswer) state = styles.right
                    else if (isPicked) state = styles.wrong
                    else state = styles.muted
                  }

                  return (
                    <button
                      key={option}
                      type="button"
                      className={`${styles.option} ${state}`.trim()}
                      disabled={answered}
                      aria-disabled={answered}
                      aria-pressed={isPicked}
                      onClick={() => choose(questionIndex, optionIndex)}
                    >
                      <span className={`num ${styles.key}`} aria-hidden="true">
                        {KEYS[optionIndex] ?? '•'}
                      </span>
                      <span className={styles.label}>{option}</span>
                      {/* Right and wrong carry a glyph as well as a colour,
                          so neither signal stands on its own. */}
                      {answered && (isAnswer || isPicked) && (
                        <span className={`num ${styles.mark}`} aria-hidden="true">
                          {isAnswer ? '✓' : '✗'}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Rendered empty rather than conditionally, so the live region
                  is already in the DOM when the explanation arrives — a
                  region added at the same moment as its text is not
                  announced by most screen readers. */}
              <p className={styles.explain} aria-live="polite">
                {answered ? question.explain : ''}
              </p>
            </li>
          )
        })}
      </ol>

      {finished && (
        <p className={`num ${styles.score}`} aria-live="polite">
          <span className={styles.scoreValue}>
            {correct} of {total}
          </span>
          <span>{correct === total ? 'all correct' : 'recalled'}</span>
        </p>
      )}
    </section>
  )
}
