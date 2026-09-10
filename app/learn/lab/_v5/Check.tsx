'use client'

import { useEffect, useRef, useState } from 'react'
import type { QuizQuestion } from '@/lib/learn'
import { useProgress } from '../../_components/useProgress'
import s from './worksheet.module.css'

/**
 * The check at the foot of the sheet.
 *
 * A check column on a worksheet is a list of items, each of which is
 * either verified or not yet. That is the shape retrieval practice wants
 * and it is one step from the shape this product refuses, so the line is
 * drawn deliberately: the box in the margin says *answered*, never
 * *right*. Nothing here totals, ranks or congratulates. There is no score
 * line, and the only number on the band is how many of the five have been
 * done, in tabular numerals, which is the same count the section already
 * prints elsewhere.
 *
 * Clicking an option marks it immediately — no submit button — and locks
 * that question. Whether the reader recalled it is carried inside the row,
 * three ways over: the glyph, the weight of the type, and a word off
 * screen for anyone not looking at either. No colour is spent on it, so
 * nothing here needs a value that is not already an --ln-* token.
 *
 * Every item is a row of the sheet's own two-column grid, so the boxes
 * land in the same figures column as the head's quantities and the work
 * items' numerals. That alignment is the whole reason this is not the
 * shipped Quiz.
 *
 * Answering the last question is what marks the lesson read, which is what
 * flips the READ field in the figures column at the top of the sheet.
 */

interface Props {
  courseSlug: string
  lessonSlug: string
  questions: QuizQuestion[]
}

/** a, b, c, d — the key printed in front of each option. */
const KEYS = 'abcdefghij'

/** Two digits, so a column of counts stays in one tabular column. */
function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function Check({ courseSlug, lessonSlug, questions }: Props) {
  const [chosen, setChosen] = useState<Record<number, number>>({})
  const { markDone } = useProgress(courseSlug)

  // markDone writes to localStorage, so it must fire exactly once when the
  // last question is answered. A ref, not state: flipping it must not cause
  // another render, and it has to survive markDone changing identity.
  const marked = useRef(false)

  const total = questions.length
  const answeredCount = Object.keys(chosen).length
  const finished = total > 0 && answeredCount === total

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
      // because the `disabled` attribute fires in the same frame as the
      // click and the browser drops focus to <body>, which sends the next
      // Tab back to the top of the page.
      questionIndex in current ? current : { ...current, [questionIndex]: optionIndex }
    )
  }

  return (
    <section className={s.check} aria-labelledby="lesson-quiz">
      <div className={s.row}>
        {/* The count of items done, in the figures column with every other
            quantity on the sheet. Deliberately not a live region: it
            changes on the same click as the explanation below, and two
            announcements per answer buries the one the reader asked for. */}
        <div className={s.figs}>
          <p className={`num ${s.checkCount}`}>
            <span className={s.checkCountValue}>
              {pad2(answeredCount)} / {pad2(total)}
            </span>
            <span>answered</span>
          </p>
        </div>

        <div className={s.work}>
          <h2 id="lesson-quiz" className={s.checkHeading}>
            <span className={`sign ${s.checkHeadingLead}`}>RECALL</span>{' '}
            <span className="sign-quiet">NO SCROLLING BACK</span>
          </h2>
        </div>
      </div>

      {/* list-style: none costs a list its semantics in Safari, and this
          one has to stay a list of five items. */}
      <ol className={s.checkList} role="list">
        {questions.map((question, questionIndex) => {
          const picked = chosen[questionIndex]
          const answered = questionIndex in chosen
          const labelId = `quiz-q${questionIndex}-label`
          const textId = `quiz-q${questionIndex}-text`

          return (
            <li key={question.q} className={`${s.row} ${s.ruled}`}>
              <div className={s.figs}>
                <p className={`sign-quiet ${s.checkItemLabel}`} id={labelId}>
                  {/* The box says done or not yet, and nothing more. It is
                      the same mark the schedule uses for a read lesson. */}
                  <span className={s.box} data-done={answered} aria-hidden="true" />
                  QUESTION {pad2(questionIndex + 1)}
                </p>
              </div>

              <div className={s.work}>
                <p className={s.qText} id={textId}>
                  {question.q}
                </p>

                <div className={s.options} role="group" aria-labelledby={`${labelId} ${textId}`}>
                  {question.options.map((option, optionIndex) => {
                    const isAnswer = optionIndex === question.answer
                    const isPicked = optionIndex === picked

                    // Before the click every option looks the same. After it
                    // the correct one is always marked, so a wrong pick shows
                    // both what was chosen and what it should have been.
                    let state = ''
                    if (answered) {
                      if (isAnswer) state = s.right
                      else if (isPicked) state = s.wrong
                      else state = s.muted
                    }

                    return (
                      <button
                        key={option}
                        type="button"
                        className={`${s.option} ${state}`.trim()}
                        // aria-disabled, never the real `disabled` attribute:
                        // that removes the button from the tab order in the
                        // frame it was activated, so focus falls to <body> and
                        // an answered option cannot be read back. choose() is
                        // what stops a second answer.
                        aria-disabled={answered}
                        aria-pressed={isPicked}
                        onClick={() => choose(questionIndex, optionIndex)}
                      >
                        <span className={`num ${s.key}`} aria-hidden="true">
                          {KEYS[optionIndex] ?? '•'}
                        </span>
                        <span className={s.optionLabel}>{option}</span>
                        {/* The glyph is decoration; the word beside it, off
                            screen, is what a screen reader reads out of the
                            row. Nothing here rests on colour, because
                            nothing here spends any. */}
                        {answered && (isAnswer || isPicked) && (
                          <>
                            <span className={s.sr}>{isAnswer ? 'Correct' : 'Incorrect'}</span>
                            <span className={`num ${s.mark}`} aria-hidden="true">
                              {isAnswer ? '✓' : '✗'}
                            </span>
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Rendered empty rather than conditionally, so the live
                    region is already in the DOM when the explanation
                    arrives — a region added at the same moment as its text
                    is not announced by most screen readers. The CSS
                    collapses the empty box without display: none, which
                    would take it back out of the accessibility tree.

                    The verdict leads, off screen: no explanation in
                    content/learn/ says in words whether the reader was
                    right, so without it the announcement explains a result
                    they were never given. */}
                <p className={s.explain} aria-live="polite">
                  {answered && (
                    <>
                      <span className={s.sr}>
                        {picked === question.answer ? 'Correct.' : 'Incorrect.'}{' '}
                      </span>
                      {question.explain}
                    </>
                  )}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
