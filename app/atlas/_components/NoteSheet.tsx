import type { AtlasSection, IndicatorValue, TimeSeries } from '@/lib/atlas/types'
import { indicatorsBySection } from '@/lib/atlas/indicators'
import { DenominationNote } from './DenominationNote'
import styles from './dossier.module.css'

export interface NoteSheetProps {
  indicators: readonly IndicatorValue[]
  timeSeries: readonly TimeSeries[]
}

/** Cutting-guide order — matches the spec's §4.2 list exactly. */
const SECTION_ORDER: readonly AtlasSection[] = [
  'LAND',
  'PEOPLE',
  'MONEY',
  'TRADE',
  'HEALTH',
  'LEARNING',
  'WORK',
  'CONNECTED',
  'NATURE',
  'STATE',
]

/** Each section shows its first 9 indicators, then an issue stamp for
 * the rest. "First" means the catalogue's own order in lib/atlas/indicators.ts
 * (GDP before GDP-PPP before GDP-per-person, etc.) — that ordering is
 * already curated by importance, unlike the raw numbers themselves,
 * which have no shared unit to rank across. */
const INITIAL_PER_SECTION = 9

/** A country with nothing at all for this indicator still gets a note —
 * every format helper renders null gracefully as "—", and a composed
 * empty state is the whole point for Tuvalu and North Korea. */
function emptyValue(code: string, unit: string): IndicatorValue {
  return { code, value: null, year: null, unit, rank: null, outOf: null, worldAverage: null, percentile: null }
}

export function NoteSheet({ indicators, timeSeries }: NoteSheetProps) {
  const byCode = new Map(indicators.map((v) => [v.code, v] as const))
  const seriesByCode = new Map(timeSeries.map((s) => [s.code, s] as const))

  return (
    <div className={styles.sheet}>
      {SECTION_ORDER.map((section) => {
        const defs = indicatorsBySection(section)
        if (defs.length === 0) return null

        const rows = defs.map((def) => byCode.get(def.code) ?? emptyValue(def.code, def.unit))
        const visibleDefs = defs.slice(0, INITIAL_PER_SECTION)
        const visibleRows = rows.slice(0, INITIAL_PER_SECTION)
        const hiddenDefs = defs.slice(INITIAL_PER_SECTION)
        const hiddenRows = rows.slice(INITIAL_PER_SECTION)

        return (
          <section key={section} className={styles.section} aria-label={section}>
            {/* Per-country ink tints the cutting guide, alongside the
                guilloché and note edges — see lib/atlas/ink.ts. */}
            <div className="atlas-section-rule" style={{ color: 'var(--note-ink)' }}>
              — {section} —
            </div>

            <div className={styles.grid}>
              {visibleRows.map((row, i) => (
                <DenominationNote
                  key={row.code}
                  indicator={visibleDefs[i]}
                  value={row}
                  timeSeries={seriesByCode.get(row.code)}
                />
              ))}
            </div>

            {hiddenRows.length > 0 && (
              <details className={styles.issue}>
                <summary className={styles.issueSummary}>▸ ISSUE {hiddenRows.length} MORE</summary>
                <div className={`${styles.grid} ${styles.issueGrid} atlas-cascade`}>
                  {hiddenRows.map((row, i) => (
                    <DenominationNote
                      key={row.code}
                      indicator={hiddenDefs[i]}
                      value={row}
                      timeSeries={seriesByCode.get(row.code)}
                      cascadeIndex={i}
                    />
                  ))}
                </div>
              </details>
            )}
          </section>
        )
      })}
    </div>
  )
}
