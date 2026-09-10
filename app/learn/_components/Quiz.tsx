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

/** Two digits, so the answered counter stays in one tabular column. */
function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * The end-of-lesson quiz. Every question is on screen at once and there is
 * no submit button: clicking an option marks it straight away, shows the
 * explanation, and locks that question. Finishing the last question is
 * what marks the lesson done.
 *
 * It is its own full-width band, not another block of the reading column:
 * a rule top and bottom spanning the window, the same shape as the
 * position strip at the head of the page. Inside, everything sits in
 * .measure, so its left edge is the h1's left edge to the pixel. Read as
 * one more stretch of body text it got skipped; as a checkpoint between
 * the lesson and what comes after it, it does not — which is why those
 * two rules are quiet ink rather than the page's hairline, RECALL is set
 * at heading size, and each question opens on a bar in the course's ink.
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
    <section className={styles.band} aria-labelledby="lesson-quiz">
      <div className="measure">
        {/* The checkpoint header: what this is on the left, how far
            through it the reader is on the right. */}
        <div className={styles.head}>
          {/* Two halves, because the second one is an instruction rather
              than part of the label. Retrieval practice only works if the
              reader answers from memory first, and nothing else on the
              page says so — set flat in one line it reads as decoration
              and gets skipped. */}
          <h2 id="lesson-quiz" className={styles.heading}>
            <span className={`sign ${styles.headingLead}`}>RECALL</span>{' '}
            <span className="sign-quiet">NO SCROLLING BACK</span>
          </h2>

          {/* Counts up as questions are answered. Server and first client
              render both start at zero, so there is nothing to mismatch. */}
          <p className={`num ${styles.counter}`} aria-live="polite">
            {pad2(answeredCount)} / {pad2(total)} answered
          </p>
        </div>

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
      </div>
    </section>
  )
}
