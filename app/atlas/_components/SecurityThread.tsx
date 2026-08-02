import { formatComparison } from '@/lib/atlas/format'
import styles from './dossier.module.css'

export interface SecurityThreadProps {
  value: number | null
  worldAverage: number | null
  /** true = higher is better, false = lower is better, null = genuinely
   *  neutral (population, land area — there is no "better"). */
  higherIsBetter: boolean | null
}

/**
 * The comparison bar on every denomination note, drawn as a banknote
 * security thread: a dashed metallic line, filled to this country's
 * position, with a small WORLD bead marking the average.
 *
 * The scale is purely arithmetic and fixed regardless of direction: the
 * WORLD bead always sits at the halfway mark, and the fill reaches it
 * exactly when value === worldAverage (fillPercent = 50). Reaching the
 * far end means the value is 2x the world average or more. This never
 * changes based on higherIsBetter — only the COLOUR does:
 *
 * - higherIsBetter is true or false: ember above the average, thread
 *   below it (matching the token meanings in atlas.css).
 * - higherIsBetter is null: rendered in neutral intaglio-dim. Colouring
 *   a genuinely neutral indicator (population, land area) as "above" or
 *   "below" would state a value judgement the data does not support.
 */
export function SecurityThread({ value, worldAverage, higherIsBetter }: SecurityThreadProps) {
  const hasData =
    value !== null &&
    worldAverage !== null &&
    Number.isFinite(worldAverage) &&
    worldAverage > 0

  const ratio = hasData ? (value as number) / (worldAverage as number) : null
  const fillPercent = ratio !== null ? Math.max(0, Math.min(100, ratio * 50)) : 0
  const isAbove = hasData && (value as number) > (worldAverage as number)
  const neutral = higherIsBetter === null

  const beadClass = !hasData || neutral ? '' : isAbove ? 'atlas-above-average' : 'atlas-below-average'
  const fillColor = neutral
    ? 'var(--note-intaglio-dim)'
    : isAbove
      ? 'var(--note-ember)'
      : 'var(--note-thread)'

  return (
    <div className={styles.threadRow}>
      <div className={styles.threadTrack}>
        <span className="atlas-thread">
          <span
            className="atlas-thread-fill"
            style={{ transform: `scaleX(${fillPercent / 100})`, background: fillColor }}
          />
          <span
            className={`atlas-thread-bead ${beadClass}`}
            style={{ left: '50%' }}
            title="World average"
          />
        </span>
      </div>
      <span className={`atlas-serial ${styles.threadCaption}`}>
        {hasData ? formatComparison(value, worldAverage) : 'no comparison'}
      </span>
    </div>
  )
}
