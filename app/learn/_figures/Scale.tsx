import type { CSSProperties } from 'react'
import { Figure } from './Figure'
import { withUnit } from './format'
import s from './figures.module.css'

/**
 * <Scale> — magnitudes placed against each other on one line.
 *
 * Context sizes from 4k to a million, token prices from cents to
 * dollars, a latency budget from 50ms to a minute. Use it when the
 * point is how far apart two numbers are, not which is bigger — for
 * which is bigger, use <Bars>.
 *
 * `log` is the default and it is the right default for this subject:
 * 4,000 next to 1,000,000 on a linear rule puts every mark but one in
 * the first four pixels. Set `log={false}` where the span is narrow
 * and a linear rule tells the truth better.
 *
 * The ticks ride above the line in two ranks, alternating, so a
 * crowded rule reads as two rows of labels rather than one collision.
 * Past about six marks a number line stops being readable at any
 * width; that is a <Bars> or a markdown table.
 */

/** One mark on the line. */
export interface ScaleMark {
  /** Where it sits, in the same unit as every other mark. */
  at: number
  /** What sits there. "GPT-3, 2020", "A long PDF", "Sonnet". */
  label: string
  /**
   * What to print as the figure. Defaults to `at`, formatted with the
   * unit — set it where a rounded word reads better: "~1M".
   */
  value?: string
  /**
   * The mark the figure is about. It takes the warm ink and nothing
   * else does. At most one per Scale.
   */
  subject?: boolean
}

export interface ScaleProps {
  /** The caption. Printed after "FIG. n —"; it is the accessible name. */
  caption: string
  /** The text equivalent. Built from the marks when left out. */
  alt?: string
  /** The marks. Any order; they are sorted onto the line. Two to six. */
  marks: ScaleMark[]
  /** The low end of the rule. Defaults to the smallest mark. */
  min?: number
  /** The high end. Defaults to the largest mark. */
  max?: number
  /** "tokens", "ms", "$". Printed after every figure. */
  unit?: string
  /** Logarithmic placement. On by default; see above. */
  log?: boolean
  /** What the low end is, printed under it. "One sentence". */
  fromLabel?: string
  /** What the high end is, printed under it. "A novel". */
  toLabel?: string
}

export function Scale({
  caption,
  alt,
  marks,
  min,
  max,
  unit,
  log = true,
  fromLabel,
  toLabel,
}: ScaleProps) {
  const kept = marks
    .filter((mark) => mark.label && Number.isFinite(mark.at))
    .sort((a, b) => a.at - b.at)

  if (kept.length === 0) return null

  const low = min ?? kept[0].at
  const high = max ?? kept[kept.length - 1].at

  // A log rule cannot hold zero or a negative, so it silently falls
  // back to linear rather than rendering NaN positions. Better a
  // truthful linear rule than a drawing with every mark at the left
  // edge.
  const logOk = log && low > 0 && high > 0
  const span = logOk ? Math.log10(high) - Math.log10(low) : high - low

  const place = (value: number): number => {
    if (!(span > 0)) return 50
    const offset = logOk ? Math.log10(value) - Math.log10(low) : value - low
    return Math.max(0, Math.min(100, (offset / span) * 100))
  }

  const spoken =
    alt ??
    `${logOk ? 'A logarithmic scale' : 'A scale'} from ${withUnit(low, unit)} to ${withUnit(
      high,
      unit
    )}. ${kept
      .map((mark) => `${mark.label}, ${mark.value ?? withUnit(mark.at, unit)}`)
      .join('. ')}.`

  return (
    <Figure caption={caption} alt={spoken}>
      <div className={s.scale}>
        <div className={s.scaleLine} aria-hidden="true">
          {kept.map((mark, index) => (
            <span
              key={mark.label}
              className={`${s.tick} ${index % 2 === 0 ? s.tickHigh : s.tickLow} ${
                mark.subject ? s.tickOn : ''
              }`.trim()}
              style={{ insetInlineStart: `${place(mark.at)}%` } as CSSProperties}
            >
              <span className={`${s.num} ${s.tickVal}`}>
                {mark.value ?? withUnit(mark.at, unit)}
              </span>
              <span className={`${s.lab} ${s.tickName}`}>{mark.label}</span>
              <span className={s.tickStem} />
            </span>
          ))}
        </div>

        <div className={s.scaleEnds}>
          <span className={s.lab}>
            {fromLabel ? `${fromLabel} · ` : ''}
            {withUnit(low, unit)}
          </span>
          <span className={s.lab}>
            {withUnit(high, unit)}
            {toLabel ? ` · ${toLabel}` : ''}
            {logOk ? ' · LOG' : ''}
          </span>
        </div>
      </div>
    </Figure>
  )
}
