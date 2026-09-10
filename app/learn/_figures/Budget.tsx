import type { CSSProperties } from 'react'
import { Figure } from './Figure'
import { round1, share, withUnit } from './format'
import s from './figures.module.css'

/**
 * <Budget> — one whole, cut into named parts.
 *
 * A context window filling up, where a request's latency goes, what a
 * bill is actually made of. Use it when the parts add up to something
 * and the point is the proportion. When the numbers are independent
 * magnitudes and nothing is a share of anything, that is <Bars>.
 *
 * The parts are told apart by hatch and by their names in the key,
 * never by hue: colouring six segments six colours is banned in this
 * section and the ban is the whole reason the kit exists. There are
 * four textures and they cycle, so a seventh segment repeats the
 * third — which is why the key under the bar is not optional.
 * --lm-spark marks the one segment the figure is about, if there is
 * one, and nothing else in the drawing is warm.
 *
 * A segment marked `spare` is drawn as empty ruled-off room, because
 * that is what headroom looks like.
 */

/** One named part of the whole. */
export interface BudgetSegment {
  /** What this part is. "Retrieved documents", "Time to first token". */
  label: string
  /** How much of the whole it takes, in whatever `unit` says. */
  value: number
  /** One clause under the name in the key. Optional. */
  note?: string
  /**
   * The part the figure is about. It takes the warm ink and nothing
   * else does. At most one per Budget.
   */
  subject?: boolean
  /** Room that is not spent: drawn empty rather than filled. */
  spare?: boolean
}

export interface BudgetProps {
  /** The caption. Printed after "FIG. n —"; it is the accessible name. */
  caption: string
  /**
   * The text equivalent. Leave it out and one is built from the
   * segments — every name, value and share, in order — which is
   * usually better than one written by hand and left to go stale.
   */
  alt?: string
  /** The parts, in the order they should be read across the bar. */
  segments: BudgetSegment[]
  /** "tokens", "ms", "$". Printed after every figure in the key. */
  unit?: string
  /**
   * The whole. Defaults to the sum of the segments, which is what you
   * want unless some of the whole is deliberately unaccounted for.
   */
  total?: number
  /** What the whole is: "a 200,000-token window". Printed at the foot. */
  totalLabel?: string
}

/** Four textures, cycled. See section 4 of figures.module.css. */
const TEXTURES = ['t0', 't1', 't2', 't3'] as const

export function Budget({
  caption,
  alt,
  segments,
  unit,
  total,
  totalLabel,
}: BudgetProps) {
  const kept = segments.filter((segment) => segment.label && segment.value > 0)
  if (kept.length === 0) return null

  const sum = kept.reduce((running, segment) => running + segment.value, 0)
  // A declared total smaller than the parts is an authoring mistake,
  // and drawing it would silently clip the last segment. The sum wins.
  const whole = total && total > sum ? total : sum

  let texture = 0
  const drawn = kept.map((segment) => {
    const cls = segment.spare
      ? 'tSpare'
      : segment.subject
        ? 'tOn'
        : TEXTURES[texture++ % TEXTURES.length]

    return { ...segment, cls, pct: share(segment.value, whole) }
  })

  const spoken =
    alt ??
    `${totalLabel ? `${totalLabel}. ` : ''}${drawn
      .map(
        (segment) =>
          `${segment.label}, ${withUnit(segment.value, unit)}, ${round1(segment.pct)} per cent`
      )
      .join('. ')}.`

  return (
    <Figure caption={caption} alt={spoken}>
      <div className={s.budget}>
        <div className={s.bar} aria-hidden="true">
          {drawn.map((segment) => (
            <span
              key={segment.label}
              className={`${s.seg} ${s[segment.cls]}`}
              style={{ inlineSize: `${segment.pct}%` } as CSSProperties}
            />
          ))}
        </div>

        <ol className={s.list}>
          {drawn.map((segment) => (
            <li key={segment.label} className={`${s.row} ${s.keyRow}`}>
              <span
                className={`${s.keySwatch} ${s[segment.cls]}`}
                aria-hidden="true"
              />
              <span className={s.keyName}>
                {segment.label}
                {segment.note ? (
                  <span className={s.keyNote}>{segment.note}</span>
                ) : null}
              </span>
              <span
                className={`${s.num} ${segment.subject ? s.subject : ''}`.trim()}
              >
                {withUnit(segment.value, unit)}
                <span className={s.quiet}> · {round1(segment.pct)}%</span>
              </span>
            </li>
          ))}
        </ol>

        <div className={s.total}>
          <span className={s.lab}>{totalLabel ?? 'Total'}</span>
          <span className={s.num}>{withUnit(whole, unit)}</span>
        </div>
      </div>
    </Figure>
  )
}
