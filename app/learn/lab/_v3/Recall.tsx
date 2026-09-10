'use client'

import { useEffect, useRef, useState } from 'react'
import type { QuizQuestion } from '@/lib/learn'
import { useProgress } from '../../_components/useProgress'
import s from './v3.module.css'

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
 * The recall checkpoint, in the reading column.
 *
 * The lesson page this replaces made the quiz a full-width band, and the
 * band was what said "stop". This candidate has no band, so the break has
 * to be earned with type and space instead: the largest gap on the page
 * above it, the page's only double rule around it, RECALL set larger than
 * anything but the title, and the counter opposite so a reader can see
 * there are five and how many are left.
 *
 * Right and wrong carry no colour. The old quiz declared two hexes for
 * them, and this section owns no green and no red outside the five course
 * inks — where an ink means "this part of the machine is that course",
 * never "correct". So the answer is drawn the way the plate already draws
 * a retrieval candidate the reranker dropped: the wrong pick is struck
 * through and stepped back, the right one stays at full ink and steps up
 * in weight, both take a glyph, and both carry the verdict in a word off
 * screen. Four signals and not one of them hue, which is a stronger
 * position on "no meaning by colour alone" than the page it replaces.
 *
 * Everything else is the behaviour the real quiz already settled and it
 * is deliberately unchanged: every question on screen at once, no submit
 * button, a click marks and locks, and finishing the last one marks the
 * lesson read. All the answers live in one `chosen` object keyed by
 * question index, so "have they finished?" is one comparison.
 */
export function Recall({ courseSlug, lessonSlug, questions }: Props) {
  const [chosen, setChosen] = useState<Record<number, number>>({})
  const { markDone } = useProgress(courseSlug)

  // markDone writes to localStorage, so it must fire exactly once when
  // the last question is answered. A ref, not state: flipping it must not
  // cause another render, and it has to survive markDone changing
  // identity.
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
      // Already answered — the click does nothing. This is the only lock
      // on a second answer: the buttons carry aria-disabled but stay
      // enabled, because the `disabled` attribute fires in the same frame
      // as the click and the browser drops focus to <body>, sending the
      // next Tab back to the top of the page.
      questionIndex in current ? current : { ...current, [questionIndex]: optionIndex }
    )
  }

  return (
    <section className={s.recall} aria-labelledby="v3-recall">
      <div className={s.recallHead}>
        {/* Two halves, because the second is an instruction rather than
            part of the label. Retrieval practice only works if the reader
            answers from memory first, and nothing else on the page says
            so. */}
        <h2 id="v3-recall" className={s.recallHeading}>
          <span className={`sign ${s.recallLead}`}>RECALL</span>
          <span className="sign-quiet">NO SCROLLING BACK</span>
        </h2>

        {/* Counts up as questions are answered. Server and first client
            render both start at zero, so there is nothing to mismatch.

            Deliberately not a live region: it changes on the same click
            as the explanation below, and two announcements per answer put
            the count in front of the thing the reader asked for. */}
        <p className={`num ${s.counter}`}>
          {pad2(answeredCount)} / {pad2(total)} answered
        </p>
      </div>

      <ol className={s.questions}>
        {questions.map((question, questionIndex) => {
          const picked = chosen[questionIndex]
          const answered = questionIndex in chosen
          const labelId = `v3-q${questionIndex}-label`
          const textId = `v3-q${questionIndex}-text`

          return (
            <li key={question.q}>
              <p className={`sign-quiet ${s.qLabel}`} id={labelId}>
                QUESTION {pad2(questionIndex + 1)}
              </p>
              <p className={s.qText} id={textId}>
                {question.q}
              </p>

              <div className={s.options} role="group" aria-labelledby={`${labelId} ${textId}`}>
                {question.options.map((option, optionIndex) => {
                  const isAnswer = optionIndex === question.answer
                  const isPicked = optionIndex === picked

                  // Before the click every option looks the same. After
                  // it, the right one is always marked — so a wrong pick
                  // shows both what was chosen and what it should have
                  // been.
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
                      // aria-disabled, never the real `disabled`
                      // attribute: that removes the button from the tab
                      // order in the frame it was activated, so focus
                      // falls to <body> and an answered option cannot be
                      // read back. choose() is what stops a second
                      // answer.
                      aria-disabled={answered}
                      aria-pressed={isPicked}
                      onClick={() => choose(questionIndex, optionIndex)}
                    >
                      <span className={`num ${s.key}`} aria-hidden="true">
                        {KEYS[optionIndex] ?? '*'}
                      </span>
                      <span className={s.optionLabel}>{option}</span>
                      {/* The glyph is decoration — the word beside it,
                          off screen, is what a screen reader reads out of
                          the row. */}
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
                  would take it back out of the accessibility tree and
                  undo all of this.

                  The verdict leads, off screen: no explanation in
                  content/learn/ says in words whether the reader was
                  right, so without it the announcement explains a result
                  they were never told. */}
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
            </li>
          )
        })}
      </ol>

      {/* Mounted from the first render, empty, for the same reason as the
          explanation above. A count, never a score to chase: no
          percentage, no bar, no celebration. */}
      <p className={`num ${s.score}`} aria-live="polite">
        {finished && (
          <>
            <span className={s.scoreValue}>
              {correct} of {total}
            </span>
            <span>{correct === total ? 'all correct' : 'recalled'}</span>
          </>
        )}
      </p>
    </section>
  )
}
