import Image from 'next/image'
import type { SourceResult, WikidataFacts } from '@/lib/atlas/types'
import { toHttps } from '@/lib/atlas/format'
import styles from './facts.module.css'

export interface FactsPanelProps {
  wikidata: SourceResult<WikidataFacts>
  countryName: string
}

/** Wikidata dates arrive as full ISO timestamps ("1947-08-15T00:00:00Z");
 * a banknote wants an engraved date, not a datetime. Mirrors
 * HistoryStrip.tsx's own formatter — kept local rather than imported so
 * this panel doesn't reach into a component file it doesn't own. */
function formatFactDate(iso: string): string {
  const m = /^(-?\d{1,6})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  const [, year, month, day] = m
  if (month === '01' && day === '01') return year
  const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  const mi = Number(month) - 1
  return mi >= 0 && mi < 12 ? `${day} ${MONTHS[mi]} ${year}` : year
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s
}

interface Row {
  label: string
  value: string
}

/** Builds the ledger's rows, entirely from what this dossier actually
 * has — a row that would just say "—" is left out rather than printed,
 * per the spec's "every panel must have an empty state, missing fields
 * are normal" rule (§3.5). Most countries will not fill every row here,
 * and that is the honest state, not a stub. */
function buildRows(facts: WikidataFacts): Row[] {
  const rows: Row[] = []

  if (facts.motto) rows.push({ label: 'Motto', value: facts.motto })
  if (facts.capital) rows.push({ label: 'Capital', value: facts.capital })

  if (facts.currencyName || facts.currencyCode) {
    const value = facts.currencyName && facts.currencyCode
      ? `${facts.currencyName} (${facts.currencyCode})`
      : facts.currencyName ?? facts.currencyCode ?? ''
    rows.push({ label: 'Currency', value })
  }

  if (facts.officialLanguages.length > 0) {
    rows.push({ label: 'Official language', value: facts.officialLanguages.join(', ') })
  }

  if (facts.drivingSide) {
    rows.push({ label: 'Drives on the', value: capitalize(facts.drivingSide) })
  }

  if (facts.callingCode) {
    const code = facts.callingCode.startsWith('+') ? facts.callingCode : `+${facts.callingCode}`
    rows.push({ label: 'Calling code', value: code })
  }

  if (facts.licencePlateCode) {
    rows.push({ label: 'Licence plate code', value: facts.licencePlateCode })
  }

  if (facts.topLevelDomain) {
    const tld = facts.topLevelDomain.startsWith('.') ? facts.topLevelDomain : `.${facts.topLevelDomain}`
    rows.push({ label: 'Top-level domain', value: tld })
  }

  if (facts.independenceDate) {
    rows.push({ label: 'Independence / founding', value: formatFactDate(facts.independenceDate) })
  }

  if (facts.highestPoint) {
    const value = facts.highestPoint.elevationM != null
      ? `${facts.highestPoint.name} (${Math.round(facts.highestPoint.elevationM).toLocaleString('en-US')} m)`
      : facts.highestPoint.name
    rows.push({ label: 'Highest point', value })
  }

  if (facts.lowestPoint) {
    const value = facts.lowestPoint.elevationM != null
      ? `${facts.lowestPoint.name} (${Math.round(facts.lowestPoint.elevationM).toLocaleString('en-US')} m)`
      : facts.lowestPoint.name
    rows.push({ label: 'Lowest point', value })
  }

  if (facts.anthemName) rows.push({ label: 'Anthem', value: facts.anthemName })

  // P417 — populated for maybe a quarter of countries (mostly Catholic
  // ones); a genuine bonus row when present, never a blank when not.
  if (facts.patronSaints.length > 0) {
    rows.push({ label: 'Patron saint', value: facts.patronSaints.join(', ') })
  }

  return rows
}

/**
 * Feature 20 (spec §4.2.2 / checklist row 20) — the Wikidata facts panel:
 * motto, capital, currency, languages, driving side, calling code, licence
 * plate code, top-level domain, independence date, highest/lowest point,
 * anthem, patron saint. `dossier.wikidata` already carries every one of
 * these; almost none of it was ever rendered anywhere on the dossier. This
 * is exactly the "object" detail the banknote concept wants — a dense
 * engraved ledger of label/value pairs, not a paragraph.
 *
 * FaceNote already renders the flag as a seal; this panel adds the one
 * Wikidata image it doesn't — the coat of arms (P94, emblemImageUrl) —
 * as a matching seal of its own.
 */
export function FactsPanel({ wikidata, countryName }: FactsPanelProps) {
  if (!wikidata.ok) {
    return (
      <section className={`atlas-note ${styles.facts}`} aria-label="Facts">
        <div className="atlas-section-rule">— FACTS —</div>
        <p className={styles.empty}>No Wikidata facts on file for {countryName}.</p>
      </section>
    )
  }

  const facts = wikidata.data
  const rows = buildRows(facts)
  const emblemUrl = toHttps(facts.emblemImageUrl)

  return (
    <section className={`atlas-note ${styles.facts}`} aria-label="Facts">
      <div className={styles.header}>
        <div className={`atlas-section-rule ${styles.headerRule}`}>— FACTS —</div>
        {emblemUrl && (
          <div className={styles.emblemSeal}>
            <Image
              src={emblemUrl}
              alt={`Coat of arms of ${countryName}`}
              fill
              sizes="44px"
              className={styles.emblemSealImg}
            />
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <p className={styles.empty}>No Wikidata facts on file for {countryName}.</p>
      ) : (
        <dl className={styles.ledger}>
          {rows.map((row) => (
            <div key={row.label} className={styles.row}>
              <dt className={`atlas-label ${styles.rowLabel}`}>{row.label}</dt>
              <dd className={styles.rowValue}>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <span className="atlas-serial">Facts: Wikidata (CC0) · as of {facts.asOf.slice(0, 10)}</span>
    </section>
  )
}
