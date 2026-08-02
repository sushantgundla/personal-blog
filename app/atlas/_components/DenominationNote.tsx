import type { CSSProperties } from 'react'
import type { IndicatorDef, IndicatorValue, TimeSeries } from '@/lib/atlas/types'
import { formatRank, formatValue, formatYear } from '@/lib/atlas/format'
import { SecurityThread } from './SecurityThread'
import { Sparkline } from './Sparkline'
import styles from './dossier.module.css'

export interface DenominationNoteProps {
  indicator: IndicatorDef
  value: IndicatorValue
  timeSeries?: TimeSeries
  /** Stagger index for the .atlas-cascade animation — only set for notes
   *  rendered inside a just-opened <details>, never the always-visible 9. */
  cascadeIndex?: number
}

/** World top-10 or bottom-10 rank — the only facts that fluoresce under
 * the UV lamp. Needs at least 10 ranked countries on both ends for
 * "top 10" and "bottom 10" to mean anything. */
function isRemarkable(rank: number | null, outOf: number | null): boolean {
  if (rank === null || outOf === null || outOf < 10) return false
  return rank <= 10 || rank > outOf - 10
}

/** Small four-point corner flourish, reused on every note. Purely decorative. */
function CornerOrnament() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={`atlas-ornament ${styles.noteCorner}`}
    >
      <path d="M6 0 L7.4 4.6 L12 6 L7.4 7.4 L6 12 L4.6 7.4 L0 6 L4.6 4.6 Z" fill="currentColor" />
    </svg>
  )
}

/**
 * One indicator, rendered as one banknote: mono label, value as a
 * denomination numeral, a rank line, the year the number is from, a
 * security-thread comparison bar, and a corner ornament. This repeats
 * 60-80 times per dossier, so it stays deliberately cheap — no client
 * state of its own beyond the Sparkline it may embed.
 */
export function DenominationNote({ indicator, value, timeSeries, cascadeIndex }: DenominationNoteProps) {
  const year = value.year ? Number(value.year) : null
  const remarkable = isRemarkable(value.rank, value.outOf)
  // A value with no rank isn't always "no data" — it can mean too few
  // countries reported this indicator to honestly rank against (see
  // MIN_RANKABLE_COUNTRIES in lib/atlas/rankings.ts). Say that plainly
  // instead of showing a bare "—", which reads as "nothing here at all".
  const rankSuppressed = value.value !== null && value.rank === null

  const style: CSSProperties | undefined =
    cascadeIndex !== undefined ? { ['--atlas-cascade-i' as string]: cascadeIndex } : undefined

  return (
    <article className={`atlas-note atlas-perforated ${styles.note}`} style={style}>
      <CornerOrnament />

      <div className={styles.noteTop}>
        <span className="atlas-label">{indicator.label}</span>
      </div>

      <div className={styles.noteValueRow}>
        <span className={`atlas-denomination ${remarkable ? 'atlas-remarkable' : ''}`}>
          {formatValue(value.value, indicator.format)}
        </span>
        <span className="atlas-serial">{indicator.unit}</span>
      </div>

      <div className={styles.noteMeta}>
        <span className={`atlas-serial ${remarkable ? 'atlas-remarkable' : ''}`}>
          {rankSuppressed ? 'not enough data to rank' : formatRank(value.rank, value.outOf ?? 0)}
        </span>
        <span className="atlas-serial">{formatYear(year)}</span>
      </div>

      <SecurityThread
        value={value.value}
        worldAverage={value.worldAverage}
        higherIsBetter={indicator.higherIsBetter}
      />

      {indicator.chart && timeSeries && (
        <div className={styles.noteChart}>
          <Sparkline points={timeSeries.points} />
        </div>
      )}
    </article>
  )
}
