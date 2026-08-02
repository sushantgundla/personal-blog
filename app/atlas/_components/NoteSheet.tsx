import type { AtlasSection, IndicatorValue, TimeSeries } from '@/lib/atlas/types'
import { indicatorsBySection } from '@/lib/atlas/indicators'
import { DenominationNote } from './DenominationNote'
import styles from './dossier.module.css'

export interface NoteSheetProps {
  indicators: readonly IndicatorValue[]
  timeSeries: readonly TimeSeries[]
  /** For the honest "N of M unavailable for {countryName}" line. Optional
   *  so this still renders sanely if a caller doesn't have it handy. */
  countryName?: string
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

/** A note is only worth printing if it has a real value — a rank or a
 * world-average is a nice-to-have on top of that, never the thing that
 * decides whether the note exists. See docs spec: "never suppress a real
 * value because a secondary field is missing." */
function hasValue(row: IndicatorValue | undefined): row is IndicatorValue {
  return row !== undefined && row.value !== null
}

/**
 * .grid is a CSS grid with a fixed column count per breakpoint (3 desktop,
 * 2 tablet, 1 mobile — see dossier.module.css). Grid always reserves every
 * column track it declares, even in a row with nothing left to place, so a
 * note count that isn't a multiple of the active column count leaves a
 * bare cell that paints the grid's own seam colour — a solid, out-of-place
 * rectangle (this is what the design review flagged). Mobile never has a
 * remainder (one column, one note per row), so only desktop and tablet
 * need padding, and never more than one column's worth.
 *
 * These filler cells carry both breakpoints' answers as data attributes;
 * dossier.module.css's media queries decide, per breakpoint, which ones
 * actually need to occupy a cell. No JavaScript, no layout measurement —
 * the same server-rendered markup is correct at every width.
 */
function GridFillers({ count }: { count: number }) {
  const desktopNeeded = (3 - (count % 3)) % 3
  const tabletNeeded = (2 - (count % 2)) % 2
  const slots = Math.max(desktopNeeded, tabletNeeded)
  if (slots === 0) return null

  return (
    <>
      {Array.from({ length: slots }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={styles.noteFiller}
          data-need-desktop={i < desktopNeeded}
          data-need-tablet={i < tabletNeeded}
        />
      ))}
    </>
  )
}

export function NoteSheet({ indicators, timeSeries, countryName }: NoteSheetProps) {
  const byCode = new Map(indicators.map((v) => [v.code, v] as const))
  const seriesByCode = new Map(timeSeries.map((s) => [s.code, s] as const))
  const who = countryName ?? 'this country'

  // A handful of entities — Taiwan, Western Sahara, Vatican City — aren't
  // World Bank reporting members at all, so every one of the ten sections
  // below would come back with zero values: ten "0 of N unavailable"
  // cards in a row, which reads as a broken page rather than an honest
  // gap in one source. Detected from the data itself (never a hardcoded
  // ISO3 list), so it applies to whichever country this happens to be
  // true for. A country with merely patchy coverage still falls through
  // to the per-section handling below, unchanged.
  const hasAnyWorldBankData = SECTION_ORDER.some((section) =>
    indicatorsBySection(section).some((def) => hasValue(byCode.get(def.code)))
  )

  if (!hasAnyWorldBankData) {
    return (
      <div className={styles.sheet}>
        <p className={styles.sheetNoData}>
          The World Bank does not publish figures for {who}, so this note carries no economic or social
          statistics.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.sheet}>
      {SECTION_ORDER.map((section) => {
        const defs = indicatorsBySection(section)
        if (defs.length === 0) return null

        // Only the notes with a real number get printed — a note with no
        // value at all is dropped, not rendered blank (spec: "missing data
        // must look deliberate, not broken").
        const availableDefs: typeof defs = []
        const availableRows: IndicatorValue[] = []
        for (const def of defs) {
          const row = byCode.get(def.code)
          if (hasValue(row)) {
            availableDefs.push(def)
            availableRows.push(row)
          }
        }

        const missingCount = defs.length - availableRows.length

        // Nothing at all for this section — one quiet line, not a wall of
        // blank cards.
        if (availableRows.length === 0) {
          return (
            <section key={section} className={styles.section} aria-label={section}>
              <div className="atlas-section-rule" style={{ color: 'var(--note-ink)' }}>
                — {section} —
              </div>
              <p className={styles.sectionEmpty}>
                {missingCount} of {defs.length} figures unavailable for {who}.
              </p>
            </section>
          )
        }

        const visibleDefs = availableDefs.slice(0, INITIAL_PER_SECTION)
        const visibleRows = availableRows.slice(0, INITIAL_PER_SECTION)
        const hiddenDefs = availableDefs.slice(INITIAL_PER_SECTION)
        const hiddenRows = availableRows.slice(INITIAL_PER_SECTION)

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
              <GridFillers count={visibleRows.length} />
              {/* GridFillers computes 0 desktop cells here whenever
                  hiddenRows.length > 0 — that only happens when
                  visibleRows.length is exactly INITIAL_PER_SECTION (9),
                  which is divisible by 3 (desktop) but NOT by 2 (tablet:
                  9 % 2 === 1), so the tablet breakpoint still needs its
                  own filler even on a "full page" of 9. */}
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
                  <GridFillers count={hiddenRows.length} />
                </div>
              </details>
            )}

            {missingCount > 0 && (
              <p className={styles.sectionPartial}>
                {missingCount} of {defs.length} figures unavailable for {who}.
              </p>
            )}
          </section>
        )
      })}
    </div>
  )
}
