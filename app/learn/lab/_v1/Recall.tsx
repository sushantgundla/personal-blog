'use client'

import { useEffect, useRef, useState } from 'react'
import type { QuizQuestion } from '@/lib/learn'
import { useProgress } from '../../_components/useProgress'
import s from './specimen.module.css'

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
 * The check band. Every question is on screen at once and there is no submit
 * button: clicking an option marks it straight away, shows the explanation
 * and locks that question. Finishing the last one is what marks the lesson
 * read.
 *
 * On this sheet the checkpoint's header is hung out in the margin, where
 * every other label on the page sits, and the questions run down the reading
 * column — so the reader's eye does not move between the last paragraph and
 * the first question. The two rules top and bottom are quiet ink rather than
 * the sheet's hairline, because this is a checkpoint and not one more band of
 * writing.
 *
 * Right and wrong carry no colour of their own. This sheet has one ink, the
 * course's, and it is structural; so the answer is simply at full ink with a
 * tick beside it, and a wrong pick is struck through — the mark this drawing
 * office already uses for a candidate that was dropped. The word beside each
 * is what a screen reader hears, because the glyph is decoration.
 *
 * There is no score. The count of what has been answered is the whole of the
 * numbers here.
 */
export function Recall({ courseSlug, lessonSlug, questions }: Props) {
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
      // because the real `disabled` attribute fires in the same frame as the
      // click and the browser drops focus to <body>.
      questionIndex in current ? current : { ...current, [questionIndex]: optionIndex }
    )
  }

  return (
    <section id="lesson-recall" className={s.check} aria-labelledby="lesson-quiz">
      <div className={`${s.row} ${s.checkRow}`}>
        <div className={s.railCell}>
          <div className={`${s.margin} ${s.sticks} ${s.checkHead}`}>
            {/* Two halves, because the second is an instruction rather than
                part of the label: retrieval practice only works if the reader
                answers from memory first. */}
            <h2 id="lesson-quiz" className={s.checkHeading}>
              <span className={`sign ${s.headingLead}`}>RECALL</span>{' '}
              <span className="sign-quiet">NO SCROLLING BACK</span>
            </h2>

            {/* Server and first client render both start at zero, so there is
                nothing to mismatch. Deliberately not a live region: it would
                change on the same click as the explanation below and queue a
                second announcement in front of the one the reader asked for. */}
            <p className={`num ${s.counter}`}>
              {pad2(answeredCount)} / {pad2(total)} answered
            </p>
          </div>
        </div>

        <ol className={`${s.col} ${s.questions}`}>
          {questions.map((question, questionIndex) => {
            const picked = chosen[questionIndex]
            const answered = questionIndex in chosen
            const labelId = `recall-q${questionIndex}-label`
            const textId = `recall-q${questionIndex}-text`

            return (
              <li key={question.q} className={s.question}>
                <p className={`sign-quiet ${s.qLabel}`} id={labelId}>
                  QUESTION {pad2(questionIndex + 1)}
                </p>
                <p className={s.qText} id={textId}>
                  {question.q}
                </p>

                <div
                  className={s.options}
                  role="group"
                  aria-labelledby={`${labelId} ${textId}`}
                >
                  {question.options.map((option, optionIndex) => {
                    const isAnswer = optionIndex === question.answer
                    const isPicked = optionIndex === picked

                    // Before the click every option looks the same. After it,
                    // the answer is always marked — so a wrong pick shows both
                    // what was chosen and what it should have been.
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
                        aria-disabled={answered}
                        aria-pressed={isPicked}
                        onClick={() => choose(questionIndex, optionIndex)}
                      >
                        <span className={`num ${s.key}`} aria-hidden="true">
                          {KEYS[optionIndex] ?? '·'}
                        </span>
                        <span className={s.optionLabel}>{option}</span>
                        {answered && (isAnswer || isPicked) && (
                          <>
                            <span className={s.sr}>
                              {isAnswer ? 'Correct' : 'Incorrect'}
                            </span>
                            <span className={`num ${s.mark}`} aria-hidden="true">
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
                    region added at the same moment as its text is not announced
                    by most screen readers. The verdict leads, off screen: no
                    explanation in content/learn/ says in words whether the
                    reader was right. */}
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
      </div>
    </section>
  )
}
