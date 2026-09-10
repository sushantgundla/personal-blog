import type { CSSProperties } from 'react'
import { Figure } from './Figure'
import { share, withUnit } from './format'
import s from './figures.module.css'

/**
 * <Bars> — a handful of numbers, compared.
 *
 * Latency, price per million tokens, recall@k, accuracy across three
 * prompts. Use it when the numbers are independent magnitudes on one
 * scale and the point is which is bigger. When they are parts of one
 * whole, that is <Budget>; when they span orders of magnitude, that is
 * <Scale>.
 *
 * One row per item: the name, then a measured rule under it with the
 * figure at the end. The rule is on its own grid row rather than
 * beside the name, so a long name never squeezes the drawing to
 * nothing on a phone.
 *
 * Every rule is the same ink at the same weight. Five bars are not
 * five hues here — difference is length, position and the label,
 * which is what a bar chart is actually made of. --lm-spark marks the
 * one bar that is the point of the figure, and nothing else is warm.
 *
 * An item with no number is drawn as a dashed gap and named. A figure
 * that quietly leaves out the case it has no data for is a figure
 * that lies about its own coverage.
 */

/** One bar. */
export interface Bar {
  /** What is being measured. "Claude Sonnet", "top_k = 20", "Middle". */
  label: string
  /**
   * The number. Leave it out — or pass null — where there genuinely is
   * no number; the row is drawn with a dashed gap and `no` beside it
   * rather than dropped.
   */
  value?: number | null
  /** One clause under the name. Optional. */
  note?: string
  /** Printed where the value would be, when there is no value. */
  no?: string
  /**
   * The bar the figure is about. It takes the warm ink and nothing
   * else does. At most one per Bars.
   */
  subject?: boolean
}

export interface BarsProps {
  /** The caption. Printed after "FIG. n —"; it is the accessible name. */
  caption: string
  /**
   * The text equivalent. Leave it out and one is built from the bars,
   * which is usually better than one written by hand and left to drift
   * from the numbers above it.
   */
  alt?: string
  /** The bars, in the order they should be read. Two to about eight. */
  bars: Bar[]
  /** "ms", "$", "%", "tokens". Printed after every figure. */
  unit?: string
  /**
   * The length the longest bar is drawn at. Defaults to the largest
   * value present. Set it when the scale has a meaningful ceiling —
   * 100 for a percentage — so a set of small numbers is not drawn as
   * though one of them were full marks.
   */
  max?: number
  /** What the scale is, printed under the bars: "0 to 100% recall". */
  axis?: string
}

export function Bars({ caption, alt, bars, unit, max, axis }: BarsProps) {
  const kept = bars.filter((bar) => bar.label)
  if (kept.length === 0) return null

  const values = kept
    .map((bar) => bar.value)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))

  const ceiling = max && max > 0 ? max : values.length > 0 ? Math.max(...values) : 0

  const spoken =
    alt ??
    kept
      .map((bar) =>
        typeof bar.value === 'number'
          ? `${bar.label}, ${withUnit(bar.value, unit)}`
          : `${bar.label}, ${bar.no ?? 'no figure'}`
      )
      .join('. ') + '.'

  return (
    <Figure caption={caption} alt={spoken}>
      <ol className={s.list}>
        {kept.map((bar) => {
          const has = typeof bar.value === 'number' && Number.isFinite(bar.value)

          return (
            <li key={bar.label} className={`${s.row} ${s.barRow}`}>
              <span className={s.barName}>
                {bar.label}
                {bar.note ? <span className={s.barNote}>{bar.note}</span> : null}
              </span>

              <span className={`${s.num} ${bar.subject ? s.subject : ''}`.trim()}>
                {has ? withUnit(bar.value as number, unit) : (bar.no ?? '—')}
              </span>

              <span className={s.barTrack} aria-hidden="true">
                {has ? (
                  <span
                    className={`${s.barFill} ${bar.subject ? s.barOn : ''}`.trim()}
                    style={
                      {
                        inlineSize: `${share(bar.value as number, ceiling)}%`,
                      } as CSSProperties
                    }
                  />
                ) : (
                  <span className={s.barNone} />
                )}
              </span>
            </li>
          )
        })}
      </ol>

      {axis ? <div className={`${s.lab} ${s.barsAxis}`}>{axis}</div> : null}
    </Figure>
  )
}
