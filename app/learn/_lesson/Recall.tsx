'use client'

import { useEffect, useRef, useState } from 'react'
import type { QuizQuestion } from '@/lib/learn'
import { useProgress } from '../_components/useProgress'
import s from './lesson.module.css'

interface Props {
  courseSlug: string
  lessonSlug: string
  questions: QuizQuestion[]
}

/** a, b, c — the letter printed in front of each option. */
const KEYS = 'abcdefghij'

/**
 * The checkpoint at the end of the lesson.
 *
 * Every question is on screen at once and there is no submit button:
 * clicking an option marks it there and then, prints the explanation
 * under it, and locks the question. Nothing is counted and nothing
 * is sent anywhere — the point is that the reader has to retrieve
 * the answer, not that anyone finds out whether they could. There is
 * no score, no total, no percentage and no celebration, and there is
 * not meant to be.
 *
 * Answering the last question is the one thing it records: it marks
 * the lesson read, in localStorage and nowhere else, which is what
 * puts the read mark on the course page's schedule. See
 * app/learn/_components/useProgress.ts.
 *
 * An option is a row on a ruled list and not a box. Nothing on this
 * page is an enclosed shape, and the recall band is built out of the
 * same three materials as the prose above it: rules, space and type.
 *
 * The marking uses no hue at all. The page has no red and no green,
 * so right and wrong are a reversed key letter, a change of weight,
 * a change of rule, and a printed word on every option that was
 * marked.
 *
 * All the answers live in one object keyed by question index, so a
 * question is answered exactly when its index is present, and
 * "finished?" is one comparison against the length.
 */
export function Recall({ courseSlug, lessonSlug, questions }: Props) {
  const [chosen, setChosen] = useState<Record<number, number>>({})
  const { markDone } = useProgress(courseSlug)

  // markDone writes to localStorage, so it must fire exactly once when
  // the last question is answered. A ref, not state: flipping it must
  // not cause another render, and it has to survive markDone changing
  // identity.
  const marked = useRef(false)

  const total = questions.length
  const finished = total > 0 && Object.keys(chosen).length === total

  useEffect(() => {
    if (!finished || marked.current) return
    marked.current = true
    markDone(lessonSlug)
  }, [finished, lessonSlug, markDone])

  if (total === 0) return null

  function choose(questionIndex: number, optionIndex: number) {
    setChosen((current) =>
      // Already answered, so the click does nothing. This is the only
      // lock on a second answer: the buttons carry aria-disabled but
      // stay enabled, because the real disabled attribute takes a
      // button out of the tab order in the frame it was activated and
      // drops focus to the body.
      questionIndex in current ? current : { ...current, [questionIndex]: optionIndex }
    )
  }

  return (
    <section className={s.recall} aria-labelledby="lesson-recall">
      <div className={s.spread}>
        {/* RECALL carries the head, NO SCROLLING BACK sits beside it a
            step down. NO SCROLLING BACK is the instruction that makes
            retrieval practice work, so it stays exactly as written. */}
        <h2 className={s.sectionHead} id="lesson-recall">
          RECALL <span className={s.headNote}>NO SCROLLING BACK</span>
        </h2>

        <ol className={s.qList}>
          {questions.map((question, questionIndex) => {
            const picked = chosen[questionIndex]
            const answered = questionIndex in chosen
            const textId = `lesson-q${questionIndex}`

            return (
              <li key={question.q} className={s.q}>
                <p className={s.qText} id={textId}>
                  <span>{question.q}</span>
                </p>

                <div className={s.options} role="group" aria-labelledby={textId}>
                  {question.options.map((option, optionIndex) => {
                    const isAnswer = optionIndex === question.answer
                    const isPicked = optionIndex === picked

                    // Before the click every option looks the same.
                    // After it the right one is always marked, so a
                    // wrong pick shows both what was chosen and what
                    // it should have been.
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
                        <span className={s.optKey} aria-hidden="true">
                          {KEYS[optionIndex] ?? '*'}
                        </span>
                        <span>{option}</span>
                        {/* The verdict is a printed word, not only a
                            weight and never a colour. */}
                        {answered && (isAnswer || isPicked) ? (
                          <span className={s.verdict}>{isAnswer ? 'Correct' : 'Not this'}</span>
                        ) : (
                          <span />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Rendered empty rather than conditionally, so the live
                    region is already in the DOM when the explanation
                    arrives — a region added at the same moment as its
                    text is not announced by most screen readers.

                    The verdict leads, off screen: no explanation in
                    content/learn says in words whether the reader was
                    right, so without it the announcement explains a
                    result they were never told. */}
                <p
                  className={`${s.explain} ${answered ? s.explainOn : ''}`.trim()}
                  aria-live="polite"
                >
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
