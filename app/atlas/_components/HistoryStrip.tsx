import type { HistoryEvent } from '@/lib/atlas/types'
import styles from './extras.module.css'

export interface HistoryStripProps {
  independenceDate: string | null
  historyEvents: HistoryEvent[] | undefined
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
  // String(Number(year)) strips the zero-padding Wikidata's xsd:dateTime
  // literal carries (France's P571 is "0481-01-01" — this rendered as the
  // literal string "0481" until now).
  if (month === '01' && day === '01') return String(Number(year))
  const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  const mi = Number(month) - 1
  return mi >= 0 && mi < 12 ? `${day} ${MONTHS[mi]} ${year}` : year
}

/**
 * Builds the strip's entries from whatever dated facts this dossier
 * actually has: the Wikidata P571 inception/independence date, plus
 * fetchHistoryEvents' P793 significant-event and UN-membership rows (see
 * that function's doc comment in lib/atlas/sources/wikidata.ts for what
 * those are and why nothing else is mixed in). Wikipedia's section
 * extraction is not reliable enough to build a trustworthy narrative
 * timeline from, so this never invents a fact to fill space — a country
 * with only one dated fact on file shows one entry, and that is the honest
 * state, not a stub.
 *
 * Two entries can land on the same calendar day (a P793 "independence of
 * X" event duplicating P571's own inception date, confirmed live on India
 * and Brazil) — the independence entry wins and the duplicate is dropped.
 */
function buildTimeline(
  independenceDate: string | null,
  historyEvents: HistoryEvent[] | undefined,
  countryName: string
): HistoryEvent[] {
  const entries: HistoryEvent[] = []
  const seenDays = new Set<string>()

  if (independenceDate) {
    entries.push({ label: `${countryName} founded as a sovereign state`, date: independenceDate })
    seenDays.add(independenceDate.slice(0, 10))
  }

  for (const event of historyEvents ?? []) {
    const day = event.date.slice(0, 10)
    if (seenDays.has(day)) continue
    seenDays.add(day)
    entries.push(event)
  }

  entries.sort((a, b) => a.date.localeCompare(b.date))
  return entries
}

/**
 * History as a security strip: one metallic thread down the page with
 * events as hologram patches. See buildTimeline above for where its
 * entries come from and why the list can be short.
 */
export function HistoryStrip({ independenceDate, historyEvents, countryName }: HistoryStripProps) {
  const timeline = buildTimeline(independenceDate, historyEvents, countryName)

  if (timeline.length === 0) {
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
        {timeline.map((event) => (
          <div key={`${event.date}-${event.label}`} className={styles.historyEvent}>
            <span className={styles.historyDate}>{formatEventDate(event.date)}</span>
            <span className={styles.historyText}>{event.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
