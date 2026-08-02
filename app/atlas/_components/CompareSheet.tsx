import type { AtlasSection, IndicatorValue } from '@/lib/atlas/types'
import { indicatorsBySection } from '@/lib/atlas/indicators'
import { CompareNote } from './CompareNote'
import styles from './compare.module.css'
import dossierStyles from './dossier.module.css'

export interface CompareSheetProps {
  nameA: string
  nameB: string
  indicatorsA: readonly IndicatorValue[]
  indicatorsB: readonly IndicatorValue[]
}

/** Matches NoteSheet's own SECTION_ORDER exactly — the compare screen is
 * "the same sectioned sheet" (spec §4.3), just with paired rows. */
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
 * The dossier sheet rendered as pairs — one CompareNote per indicator
 * instead of DenominationNote, same section order, same progressive
 * disclosure via native <details>. A country missing an indicator
 * entirely (Taiwan against the World Bank, for instance) still gets a
 * row: emptyValue() renders "no data" on that side rather than dropping
 * the row or defaulting it to zero.
 */
export function CompareSheet({ nameA, nameB, indicatorsA, indicatorsB }: CompareSheetProps) {
  const byCodeA = new Map(indicatorsA.map((v) => [v.code, v] as const))
  const byCodeB = new Map(indicatorsB.map((v) => [v.code, v] as const))

  return (
    <div className={dossierStyles.sheet}>
      {SECTION_ORDER.map((section) => {
        const defs = indicatorsBySection(section)
        if (defs.length === 0) return null

        const rowsA = defs.map((def) => byCodeA.get(def.code) ?? emptyValue(def.code, def.unit))
        const rowsB = defs.map((def) => byCodeB.get(def.code) ?? emptyValue(def.code, def.unit))

        const visibleDefs = defs.slice(0, INITIAL_PER_SECTION)
        const visibleA = rowsA.slice(0, INITIAL_PER_SECTION)
        const visibleB = rowsB.slice(0, INITIAL_PER_SECTION)
        const hiddenDefs = defs.slice(INITIAL_PER_SECTION)
        const hiddenA = rowsA.slice(INITIAL_PER_SECTION)
        const hiddenB = rowsB.slice(INITIAL_PER_SECTION)

        return (
          <section key={section} className={dossierStyles.section} aria-label={section}>
            <div className="atlas-section-rule">— {section} —</div>

            <div className={`${dossierStyles.grid} ${styles.compareGrid}`}>
              {visibleDefs.map((def, i) => (
                <CompareNote
                  key={def.code}
                  indicator={def}
                  nameA={nameA}
                  nameB={nameB}
                  a={visibleA[i]}
                  b={visibleB[i]}
                />
              ))}
            </div>

            {hiddenDefs.length > 0 && (
              <details className={dossierStyles.issue}>
                <summary className={dossierStyles.issueSummary}>▸ ISSUE {hiddenDefs.length} MORE</summary>
                <div className={`${dossierStyles.grid} ${styles.compareGrid} ${dossierStyles.issueGrid} atlas-cascade`}>
                  {hiddenDefs.map((def, i) => (
                    <CompareNote
                      key={def.code}
                      indicator={def}
                      nameA={nameA}
                      nameB={nameB}
                      a={hiddenA[i]}
                      b={hiddenB[i]}
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
