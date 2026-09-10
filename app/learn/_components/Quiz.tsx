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
      // Already answered — the click does nothing. This is the only lock on
      // a second answer: the buttons carry aria-disabled but stay enabled,
      // because the `disabled` attribute used to fire in the same frame as
      // the click and the browser dropped focus to <body>, sending the next
      // Tab back to the top of the page.
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
              render both start at zero, so there is nothing to mismatch.

              Deliberately not a live region. It used to be one, and it
              changed on the same click as the explanation below, so every
              answer queued two announcements — the count first, then the
              thing the reader actually asked for. The explanation is the
              one that speaks; this stays on screen and keeps quiet. */}
          <p className={`num ${styles.counter}`}>
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
                        // aria-disabled, never the real `disabled` attribute:
                        // that removed the button from the tab order in the
                        // frame it was activated, so focus fell to <body> and
                        // an answered option could not be read back. choose()
                        // is what stops a second answer.
                        aria-disabled={answered}
                        aria-pressed={isPicked}
                        onClick={() => choose(questionIndex, optionIndex)}
                      >
                        <span className={`num ${styles.key}`} aria-hidden="true">
                          {KEYS[optionIndex] ?? '•'}
                        </span>
                        <span className={styles.label}>{option}</span>
                        {/* Right and wrong carry a glyph, a colour and a word,
                            so no one signal stands on its own. The glyph is
                            decoration — the word beside it, off screen, is
                            what a screen reader reads out of the row. */}
                        {answered && (isAnswer || isPicked) && (
                          <>
                            <span className={styles.sr}>
                              {isAnswer ? 'Correct' : 'Incorrect'}
                            </span>
                            <span className={`num ${styles.mark}`} aria-hidden="true">
                              {isAnswer ? '✓' : '✗'}
                            </span>
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Rendered empty rather than conditionally, so the live region
                    is already in the DOM when the explanation arrives — a
                    region added at the same moment as its text is not
                    announced by most screen readers. The CSS collapses the
                    empty box without display: none, which would take it back
                    out of the accessibility tree and undo all of this.

                    The verdict leads, off screen: no explanation in
                    content/learn/ says in words whether the reader was right,
                    so without it the announcement is an explanation of a
                    result they were never told. */}
                <p className={styles.explain} aria-live="polite">
                  {answered && (
                    <>
                      <span className={styles.sr}>
                        {picked === question.answer ? 'Correct.' : 'Incorrect.'}{' '}
                      </span>
                      {question.explain}
                    </>
                  )}
                </p>
              </li>
            )
          })}
        </ol>

        {/* Mounted from the first render, empty, for the same reason as the
            explanation above: this used to appear only once `finished` went
            true, which put the region and its text into the DOM in one go,
            and a region born with its content is not announced. */}
        <p className={`num ${styles.score}`} aria-live="polite">
          {finished && (
            <>
              <span className={styles.scoreValue}>
                {correct} of {total}
              </span>
              <span>{correct === total ? 'all correct' : 'recalled'}</span>
            </>
          )}
        </p>
      </div>
    </section>
  )
}
