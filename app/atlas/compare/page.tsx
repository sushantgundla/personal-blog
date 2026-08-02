import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BY_ISO3, ISO_COUNTRIES } from '@/lib/atlas/iso-countries'
import dossierStyles from '../_components/dossier.module.css'
import styles from '../_components/compare.module.css'

export const metadata: Metadata = {
  title: 'Compare — The Atlas',
  description:
    'Put any two countries head to head — the same sheet of denomination notes, rendered as pairs.',
}

const SORTED_COUNTRIES = [...ISO_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name))

/**
 * The compare picker (spec §4.3). This is the whole no-JavaScript path
 * into `/atlas/compare/[pair]`: a plain `<form method="get">` submits
 * `?a=..&b=..` to this same route, and — because this is a Server
 * Component reading `searchParams` — the redirect to the pretty
 * `ind-vs-fra` URL happens on the server, before any client JS would
 * even have a chance to run.
 */
export default function ComparePickerPage({
  searchParams,
}: {
  searchParams: { a?: string; b?: string }
}) {
  const a = searchParams.a?.toUpperCase()
  const b = searchParams.b?.toUpperCase()

  if (a && b && BY_ISO3[a] && BY_ISO3[b]) {
    redirect(`/atlas/compare/${a.toLowerCase()}-vs-${b.toLowerCase()}`)
  }

  const attemptedSelection = Boolean(a || b)
  const invalidSelection = attemptedSelection && (!a || !b || !BY_ISO3[a] || !BY_ISO3[b])

  return (
    <div className={`${styles.pickerPage} atlas-fade-in`}>
      <div className={dossierStyles.pageToolbar} style={{ width: '100%' }}>
        <Link href="/atlas" className={dossierStyles.backLink}>
          ← Back to the plate
        </Link>
      </div>

      <div className={styles.pickerIntro}>
        <h1 className="atlas-face-name" style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}>
          Two notes, head to head
        </h1>
        <p className="atlas-body">
          Pick any two countries. Every denomination note on the sheet renders as a pair, and the
          higher value strikes in ember.
        </p>
      </div>

      {invalidSelection && (
        <p className="atlas-serial" style={{ color: 'var(--note-thread)' }} role="alert">
          Pick a country from the list for both sides.
        </p>
      )}

      <form method="get" action="/atlas/compare" className={`atlas-note ${styles.pickerForm}`}>
        <div className={styles.pickerField}>
          <label htmlFor="compare-a" className="atlas-label">
            Country A
          </label>
          <select id="compare-a" name="a" className={styles.pickerSelect} defaultValue="" required>
            <option value="" disabled>
              Select a country…
            </option>
            {SORTED_COUNTRIES.map((c) => (
              <option key={c.iso3} value={c.iso3}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.pickerField}>
          <label htmlFor="compare-b" className="atlas-label">
            Country B
          </label>
          <select id="compare-b" name="b" className={styles.pickerSelect} defaultValue="" required>
            <option value="" disabled>
              Select a country…
            </option>
            {SORTED_COUNTRIES.map((c) => (
              <option key={c.iso3} value={c.iso3}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className={styles.pickerSubmit}>
          Compare →
        </button>
      </form>
    </div>
  )
}
