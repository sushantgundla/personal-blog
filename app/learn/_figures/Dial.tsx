'use client'

import { useId, useState } from 'react'
import type { CSSProperties } from 'react'
import { Figure } from './Figure'
import { withUnit } from './format'
import s from './figures.module.css'

/**
 * <Dial> — the reader turns the knob and the outcome changes.
 *
 * temperature, top_p, top_k, chunk size, max_tokens, k in a
 * retrieval, a similarity threshold. Anything with one number and a
 * few named regions of behaviour along it.
 *
 * It is config-driven and knows nothing about any one topic: you give
 * it a range and a list of bands, and it prints the band the value has
 * landed in. A band is chosen by the last boundary the value has
 * passed, so the bands have to be in ascending order of `at` and the
 * first one has to start at `min`.
 *
 * It is a real <input type="range"> with a real <label>, so it works
 * from the keyboard with arrow keys, Home and End, it announces its
 * value, and it draws a visible focus ring. The readout is an
 * aria-live region that is in the DOM from the first render, empty of
 * nothing — the same pattern Recall.tsx uses, and for the same reason:
 * a region added at the moment it has something to say is not
 * announced by most screen readers.
 *
 * Nothing transitions. Under a reduced-motion preference the figure
 * must simply arrive in its new state, and the cheapest way to be sure
 * of that is to have no transition to switch off.
 *
 * <Dial> is for a knob with a spectrum of outcomes. A switch with two
 * settings is <Compare>; a sequence of states is <Steps>.
 */

/** One region of behaviour along the dial. */
export interface DialBand {
  /**
   * The value this band starts at, on the dial's own scale. Bands
   * must ascend and the first must equal `min`.
   */
  at: number
  /** The band's name, printed as a tick under the rail. "GREEDY". */
  label: string
  /** What happens here, in a sentence. This is the point of the figure. */
  outcome: string
  /** Where it goes wrong, or what it costs. Optional. */
  note?: string
}

export interface DialProps {
  /** The caption. Printed after "FIG. n —"; it is the accessible name. */
  caption: string
  /**
   * What the knob is. Used as the input's label, so write it as the
   * reader would say it: "temperature", "chunk size in tokens".
   */
  name: string
  /** The low end of the range. */
  min: number
  /** The high end. */
  max: number
  /** How far one arrow key moves it. */
  step: number
  /** Where it sits when the figure arrives. Defaults to `min`. */
  start?: number
  /** Printed after the value: "tokens", "%". Optional. */
  unit?: string
  /** The bands, ascending. Two to five. */
  bands: DialBand[]
}

export function Dial({
  caption,
  name,
  min,
  max,
  step,
  start,
  unit,
  bands,
}: DialProps) {
  const ordered = [...bands].filter((band) => band.label).sort((a, b) => a.at - b.at)
  const [value, setValue] = useState<number>(start ?? min)
  const id = useId()

  if (ordered.length === 0 || !(max > min)) return null

  // The last boundary the value has passed. Never undefined: the loop
  // starts from the first band, so a value below every boundary still
  // gets the first one rather than nothing.
  let band = ordered[0]
  for (const candidate of ordered) {
    if (value >= candidate.at) band = candidate
  }

  const place = (at: number): number =>
    Math.max(0, Math.min(100, ((at - min) / (max - min)) * 100))

  return (
    <Figure caption={caption}>
      <div className={s.dial}>
        <div className={s.dialHead}>
          <label className={s.lab} htmlFor={id}>
            {name}
          </label>
          <span className={s.dialVal}>{withUnit(value, unit)}</span>
        </div>

        <div>
          <input
            id={id}
            className={s.dialRange}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
          />

          {/* The band boundaries, printed under the rail where they
              actually fall. aria-hidden: the readout below says the
              same thing in a sentence, and the input already
              announces its own value. */}
          <div className={s.dialTicks} aria-hidden="true">
            {ordered.map((candidate) => (
              <span
                key={candidate.label}
                className={`${s.dialTick} ${
                  candidate === band ? s.dialTickOn : ''
                }`.trim()}
                style={{ insetInlineStart: `${place(candidate.at)}%` } as CSSProperties}
              >
                <span className={s.dialTickStem} />
                <span className={s.lab}>{candidate.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* In the DOM from the first render, never display:none, so a
            screen reader has a region to announce into. */}
        <div className={s.dialOut} aria-live="polite">
          <span className={s.dialOutName}>{band.label}</span>
          <span className={s.say}>{band.outcome}</span>
          {band.note ? (
            <span className={`${s.say} ${s.quiet}`}> {band.note}</span>
          ) : null}
        </div>
      </div>
    </Figure>
  )
}
