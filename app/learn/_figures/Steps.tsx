'use client'

import { useId, useState } from 'react'
import { Figure } from './Figure'
import s from './figures.module.css'

/**
 * <Steps> — one state at a time, the reader clicking through.
 *
 * A loop going round, a cache being written and then read, a retry
 * after a failure, a conversation growing a turn at a time. Use it
 * where seeing the state CHANGE beats seeing every state at once —
 * which is the case whenever the same fields hold different values at
 * each step, because that is exactly what a static drawing of five
 * boxes cannot show.
 *
 * Where all the steps are true at the same time and the reader needs
 * them side by side, that is <Flow>. Where they are a sequence of
 * instructions to follow, that is a numbered markdown list.
 *
 * The buttons are real buttons: keyboard operable, with a visible
 * focus ring from the page's own rule, and carrying aria-pressed so a
 * screen reader hears which one is in force. The panel is an
 * aria-live region in the DOM from the first render, for the same
 * reason Recall.tsx's explanation is.
 *
 * There is no progress bar, no track, no counter and no percentage.
 * The section refuses all four, and a stepper is exactly where they
 * try to come back.
 *
 * Nothing transitions, so under a reduced-motion preference the panel
 * simply arrives in its new state with nothing to switch off.
 */

/** One fact about the state at this step. */
export interface StepFact {
  /** What the field is. "cache_read_input_tokens", "messages". */
  label: string
  /** What it holds at this step. Set in mono, so keep it short. */
  value: string
}

/** One step. */
export interface Step {
  /** The button's text. Two or three words, because it sits in a row. */
  label: string
  /** The panel's heading. Defaults to the label. */
  title?: string
  /** What is happening at this step, in a sentence or two. */
  body: string
  /** The state at this step, ruled one fact per row. Optional. */
  facts?: StepFact[]
}

export interface StepsProps {
  /** The caption. Printed after "FIG. n —"; it is the accessible name. */
  caption: string
  /** The steps, in order. Two to about six. */
  steps: Step[]
}

export function Steps({ caption, steps }: StepsProps) {
  const kept = steps.filter((step) => step.label)
  const [at, setAt] = useState(0)
  const id = useId()

  if (kept.length === 0) return null

  // A step index can only be stale if the array shrank between
  // renders, which cannot happen from MDX — but clamping is one line
  // and an out-of-range read is a blank figure.
  const current = kept[Math.min(at, kept.length - 1)]

  return (
    <Figure caption={caption}>
      <div className={s.steps}>
        <ol className={s.stepBar}>
          {kept.map((step, index) => {
            const on = step === current

            return (
              <li key={step.label}>
                <button
                  type="button"
                  className={`${s.stepBtn} ${on ? s.stepOn : ''}`.trim()}
                  aria-pressed={on}
                  aria-controls={id}
                  onClick={() => setAt(index)}
                >
                  <span className={s.stepBtnN} aria-hidden="true">
                    {index + 1}
                  </span>
                  <span>{step.label}</span>
                </button>
              </li>
            )
          })}
        </ol>

        <div className={s.stepPanel} id={id} aria-live="polite">
          {/* A div and not an h3: a figure is annotation on the
              section it sits in, and a heading here would put a rung
              in the page's outline that the reading column does not
              have. */}
          <div className={s.stepTitle}>{current.title ?? current.label}</div>
          <div className={s.say}>{current.body}</div>

          {current.facts && current.facts.length > 0 ? (
            <ol className={`${s.list} ${s.stepState}`}>
              {current.facts.map((fact) => (
                <li key={fact.label} className={`${s.row} ${s.stepStateRow}`}>
                  <span className={s.barName}>{fact.label}</span>
                  <span className={s.num}>{fact.value}</span>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      </div>
    </Figure>
  )
}
