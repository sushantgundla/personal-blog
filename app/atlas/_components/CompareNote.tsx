import type { CSSProperties } from 'react'
import type { IndicatorDef, IndicatorValue } from '@/lib/atlas/types'
import { formatValue, formatYear } from '@/lib/atlas/format'
import styles from './compare.module.css'

export interface CompareNoteProps {
  indicator: IndicatorDef
  /** One value per country, same order as the ledger's header row. */
  values: readonly IndicatorValue[]
  /** Same order as `values` — used only for a screen-reader label per
   * cell, since the visible country names live once in the header row. */
  names: readonly string[]
  /** The shared `grid-template-columns` string — see CompareSheet's
   * `ledgerColumns`. Applied to every row so the whole sheet lines up as
   * one continuous ledger even though each row is its own grid. */
  columns: string
  cascadeIndex?: number
}

/**
 * Which column, if any, honestly wins this row. Never the same question as
 * "which number is biggest":
 *  - `indicator.higherIsBetter === null` (population, land area, ...): there
 *    is no "better", so no winner, ever, no matter how the numbers compare.
 *  - a missing value can never win, and is never treated as zero.
 *  - a genuine tie among the remaining values also has no winner — awarding
 *    one side arbitrarily would be a claim the data doesn't support.
 *  - fewer than two countries actually have a value: one lone number
 *    "wins" against nothing.
 */
function winnerIndex(indicator: IndicatorDef, values: readonly IndicatorValue[]): number | null {
  if (indicator.higherIsBetter === null) return null

  const present = values
    .map((v, i) => (v.value === null ? null : { i, value: v.value }))
    .filter((x): x is { i: number; value: number } => x !== null)
  if (present.length < 2) return null

  const extreme = indicator.higherIsBetter
    ? Math.max(...present.map((p) => p.value))
    : Math.min(...present.map((p) => p.value))
  const winners = present.filter((p) => p.value === extreme)
  return winners.length === 1 ? winners[0].i : null
}

/**
 * One indicator, one ledger row, one cell per country (2-5) — the compare
 * screen's equivalent of DenominationNote. Replaces the old two-column
 * "note" card and its split security thread: a two-sided lean bar doesn't
 * generalise past two countries, so the honest-winner rule now speaks
 * entirely through colour — ember (`atlas-remarkable` + `.ledgerWinnerValue`)
 * on the winning cell, muted everywhere else, an em dash (never zero, never
 * highlighted) for a value that genuinely doesn't exist for that country.
 * `formatValue` itself already renders `null` as `—` — no separate branch
 * needed here, which is what guarantees the dash is the same character
 * used for every other missing value on the site.
 */
export function CompareNote({ indicator, values, names, columns, cascadeIndex }: CompareNoteProps) {
  const win = winnerIndex(indicator, values)
  const style: CSSProperties & Record<string, string | number> = { gridTemplateColumns: columns }
  if (cascadeIndex !== undefined) style['--atlas-cascade-i'] = cascadeIndex

  return (
    <div className={styles.ledgerRow} style={style}>
      <div className={styles.ledgerRowLabel}>
        <span className="atlas-label">{indicator.label}</span>
        <span className="atlas-serial">{indicator.unit}</span>
      </div>

      {values.map((v, i) => {
        const isWinner = win === i
        const valueClass = [
          'atlas-denomination',
          styles.ledgerValue,
          isWinner ? `atlas-remarkable ${styles.ledgerWinnerValue}` : '',
          v.value === null ? styles.ledgerNoData : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <div key={indicator.code + i} className={styles.ledgerCell}>
            <span className="sr-only">{names[i]}: </span>
            <span className={valueClass}>{formatValue(v.value, indicator.format)}</span>
            {v.year && <span className="atlas-serial">{formatYear(Number(v.year))}</span>}
          </div>
        )
      })}
    </div>
  )
}
