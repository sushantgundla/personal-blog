import type { CSSProperties } from 'react'
import type { IndicatorDef, IndicatorValue } from '@/lib/atlas/types'
import { formatValue, formatYear } from '@/lib/atlas/format'
import styles from './compare.module.css'

export interface CompareNoteProps {
  indicator: IndicatorDef
  nameA: string
  nameB: string
  a: IndicatorValue
  b: IndicatorValue
  cascadeIndex?: number
}

type Side = 'a' | 'b' | null

/**
 * Which side is "better" per indicator.higherIsBetter — never the same
 * question as which side is bigger. Returns null (no winner) whenever
 * either value is missing, the indicator is genuinely neutral, or the
 * two values tie. A missing value can never win by default.
 */
function winner(indicator: IndicatorDef, a: IndicatorValue, b: IndicatorValue): Side {
  if (indicator.higherIsBetter === null) return null
  if (a.value === null || b.value === null) return null
  if (a.value === b.value) return null
  const aHigher = a.value > b.value
  if (indicator.higherIsBetter) return aHigher ? 'a' : 'b'
  return aHigher ? 'b' : 'a'
}

/**
 * The bar's lean is a separate question from `winner`: it always shows
 * which raw number is numerically larger, regardless of direction. Colour
 * (ember for the winner, thread for the loser, both dim when neutral) is
 * layered on afterward — see the render below. Ties or missing data lean
 * nowhere, matching the "neither wins" rule for a value the bar itself
 * cannot honestly award.
 */
function lean(a: IndicatorValue, b: IndicatorValue): Side {
  if (a.value === null || b.value === null) return null
  if (a.value === b.value) return null
  return a.value > b.value ? 'a' : 'b'
}

/** 0-100 magnitude of the lean, using absolute values so a negative
 * balance still measures sensibly against a positive one. */
function leanMagnitude(a: IndicatorValue, b: IndicatorValue): number {
  if (a.value === null || b.value === null) return 0
  const av = Math.abs(a.value)
  const bv = Math.abs(b.value)
  const total = av + bv
  if (total === 0) return 0
  return (Math.abs(av - bv) / total) * 100
}

function valueClass(side: 'a' | 'b', win: Side): string {
  if (win === null) return ''
  return win === side ? 'atlas-remarkable' : styles.noteValueLoser
}

/**
 * One indicator, two countries: the compare-screen equivalent of
 * DenominationNote (spec §4.3). Renders the value that exists for each
 * side and marks a genuinely missing one "no data" — never zero, and
 * never a winner.
 */
export function CompareNote({ indicator, nameA, nameB, a, b, cascadeIndex }: CompareNoteProps) {
  const win = winner(indicator, a, b)
  const leanSide = lean(a, b)
  const magnitude = leanMagnitude(a, b)

  const style: CSSProperties | undefined =
    cascadeIndex !== undefined ? { ['--atlas-cascade-i' as string]: cascadeIndex } : undefined

  const leanColor =
    win === null ? 'var(--note-intaglio-dim)' : leanSide === win ? 'var(--note-ember)' : 'var(--note-thread)'

  return (
    <article className={`atlas-note atlas-perforated ${styles.compareNote}`} style={style}>
      <div className={styles.compareTop}>
        <span className="atlas-label">{indicator.label}</span>
        <span className="atlas-serial">{indicator.unit}</span>
      </div>

      <div className={styles.compareValues}>
        <div className={styles.compareSide}>
          <span className="atlas-serial">{nameA}</span>
          <span className={`atlas-denomination ${styles.compareValue} ${valueClass('a', win)}`}>
            {a.value === null ? 'no data' : formatValue(a.value, indicator.format)}
          </span>
          {a.year && <span className="atlas-serial">{formatYear(Number(a.year))}</span>}
        </div>

        <div className={styles.compareSide} style={{ textAlign: 'right' }}>
          <span className="atlas-serial">{nameB}</span>
          <span className={`atlas-denomination ${styles.compareValue} ${valueClass('b', win)}`}>
            {b.value === null ? 'no data' : formatValue(b.value, indicator.format)}
          </span>
          {b.year && <span className="atlas-serial">{formatYear(Number(b.year))}</span>}
        </div>
      </div>

      {/* Split security thread — centre is a tie, the bar leans toward
          whichever raw value is numerically larger. Coloured by winner()
          above, not by lean(), so the two questions never get conflated. */}
      <div className={styles.splitTrack} aria-hidden="true">
        <span className={styles.splitCenter} />
        {leanSide === 'a' && (
          <span
            className={styles.splitFillLeft}
            style={{ width: `${magnitude / 2}%`, background: leanColor }}
          />
        )}
        {leanSide === 'b' && (
          <span
            className={styles.splitFillRight}
            style={{ width: `${magnitude / 2}%`, background: leanColor }}
          />
        )}
      </div>
    </article>
  )
}
