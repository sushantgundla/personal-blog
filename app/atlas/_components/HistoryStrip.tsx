import styles from './extras.module.css'

export interface HistoryStripProps {
  independenceDate: string | null
  countryName: string
}

/** Wikidata dates arrive as full ISO timestamps ("1947-08-15T00:00:00Z");
 * a banknote wants an engraved date, not a datetime. */
function formatEventDate(iso: string): string {
  const m = /^(-?\d{1,6})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  const [, year, month, day] = m
  // Some inception dates on Wikidata carry only year precision with a
  // padded 01-01 — showing "1 Jan" on those would imply false precision.
  if (month === '01' && day === '01') return year
  const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  const mi = Number(month) - 1
  return mi >= 0 && mi < 12 ? `${day} ${MONTHS[mi]} ${year}` : year
}

/**
 * History as a security strip: one metallic thread down the page with
 * events as hologram patches. Wikipedia's section extraction is not
 * reliable enough to build a trustworthy narrative timeline from, so this
 * renders only the solid, dated facts the dossier actually has —
 * currently just the Wikidata P571 inception/independence date — rather
 * than inventing history around it. More dated facts can join this strip
 * later without changing its shape; today most countries will show one
 * event, and that is the honest state, not a stub.
 */
export function HistoryStrip({ independenceDate, countryName }: HistoryStripProps) {
  if (!independenceDate) {
    return (
      <div>
        <span className={`atlas-label ${styles.panelLabel}`}>History</span>
        <div className={styles.emptyState}>No confirmed dated history on file for {countryName}</div>
      </div>
    )
  }

  return (
    <div>
      <span className={`atlas-label ${styles.panelLabel}`}>History</span>
      <div className={styles.historyStrip}>
        <div className={styles.historyEvent}>
          <span className={styles.historyDate}>{formatEventDate(independenceDate)}</span>
          <span className={styles.historyText}>{countryName} — founding / independence (Wikidata)</span>
        </div>
      </div>
    </div>
  )
}
