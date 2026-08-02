import type { AtlasSection, IndicatorValue } from '@/lib/atlas/types'
import type { CountryInk } from '@/lib/atlas/ink'
import { indicatorsBySection } from '@/lib/atlas/indicators'
import { toHttps } from '@/lib/atlas/format'
import { CompareNote } from './CompareNote'
import styles from './compare.module.css'
import dossierStyles from './dossier.module.css'

export interface CompareColumn {
  iso3: string
  name: string
  ink: CountryInk
  flagUrl: string | null
  indicators: readonly IndicatorValue[]
}

export interface CompareSheetProps {
  countries: readonly CompareColumn[]
}

/** Matches NoteSheet's own SECTION_ORDER exactly — the compare screen is
 * "the same sectioned sheet" (spec §4.3), just laid out as a ledger. */
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

const INITIAL_PER_SECTION = 9

function emptyValue(code: string, unit: string): IndicatorValue {
  return { code, value: null, year: null, unit, rank: null, outOf: null, worldAverage: null, percentile: null }
}

/**
 * One `grid-template-columns` string, reused by the header row and every
 * single ledger row below it, so all `countries.length + 1` columns line
 * up as one continuous ledger even though each row is its own CSS grid. A
 * hard per-column minimum (not just `1fr`) is what makes `.ledgerScroll`'s
 * horizontal scrollbar kick in once five columns don't fit, instead of the
 * browser squeezing every value down to unreadable width.
 */
function ledgerColumns(count: number): string {
  return `minmax(11rem, 1.5fr) repeat(${count}, minmax(6.5rem, 1fr))`
}

function LedgerHeader({ countries, columns }: { countries: readonly CompareColumn[]; columns: string }) {
  return (
    <div className={styles.ledgerHeaderRow} style={{ gridTemplateColumns: columns }}>
      <span className={styles.ledgerCorner} aria-hidden="true" />
      {countries.map((c) => (
        <div key={c.iso3} className={styles.ledgerHeaderCell} style={{ ['--note-ink' as string]: c.ink.hex }}>
          {c.flagUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={toHttps(c.flagUrl)} alt="" className={styles.ledgerFlag} />
          )}
          <span className={styles.ledgerCountryName}>{c.name}</span>
          <span className={styles.ledgerInkBar} aria-hidden="true" />
        </div>
      ))}
    </div>
  )
}

/**
 * The dossier sheet rendered as a ledger (spec §4.3): the indicator label
 * in a fixed left column, one column per country (2-5), the honest best
 * value struck in ember. Same section order and progressive disclosure via
 * native `<details>` as the single-country sheet. A country missing an
 * indicator entirely (Taiwan against the World Bank, for instance) still
 * gets a cell: `emptyValue()` renders "no data" there rather than dropping
 * the row or defaulting it to zero.
 *
 * Five columns of numbers don't fit at every width, so the whole ledger —
 * header included — sits in one `.ledgerScroll` wrapper that scrolls
 * horizontally on its own; the page itself never gains a horizontal
 * scrollbar. See compare.module.css for how the fixed per-column minimums
 * make that handoff automatic.
 */
export function CompareSheet({ countries }: CompareSheetProps) {
  const maps = countries.map((c) => new Map(c.indicators.map((v) => [v.code, v] as const)))
  const names = countries.map((c) => c.name)
  const columns = ledgerColumns(countries.length)

  return (
    <div className={styles.ledgerScroll}>
      <LedgerHeader countries={countries} columns={columns} />

      <div className={dossierStyles.sheet}>
        {SECTION_ORDER.map((section) => {
          const defs = indicatorsBySection(section)
          if (defs.length === 0) return null

          const rows = defs.map((def) =>
            maps.map((byCode) => byCode.get(def.code) ?? emptyValue(def.code, def.unit))
          )

          const visibleDefs = defs.slice(0, INITIAL_PER_SECTION)
          const visibleRows = rows.slice(0, INITIAL_PER_SECTION)
          const hiddenDefs = defs.slice(INITIAL_PER_SECTION)
          const hiddenRows = rows.slice(INITIAL_PER_SECTION)

          return (
            <section key={section} className={dossierStyles.section} aria-label={section}>
              <div className="atlas-section-rule">— {section} —</div>

              <div className={styles.ledgerBody}>
                {visibleDefs.map((def, i) => (
                  <CompareNote
                    key={def.code}
                    indicator={def}
                    values={visibleRows[i]}
                    names={names}
                    columns={columns}
                  />
                ))}
              </div>

              {hiddenDefs.length > 0 && (
                <details className={dossierStyles.issue}>
                  <summary className={dossierStyles.issueSummary}>▸ ISSUE {hiddenDefs.length} MORE</summary>
                  <div className={`${styles.ledgerBody} ${dossierStyles.issueGrid} atlas-cascade`}>
                    {hiddenDefs.map((def, i) => (
                      <CompareNote
                        key={def.code}
                        indicator={def}
                        values={hiddenRows[i]}
                        names={names}
                        columns={columns}
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
    </div>
  )
}
