import { ISO_COUNTRIES } from '@/lib/atlas/iso-countries'
import styles from './compare.module.css'

export interface ComparePickerProps {
  invalidSelection: boolean
}

const SORTED_COUNTRIES = [...ISO_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name))

function CountrySelect({ id, name, required }: { id: string; name: string; required?: boolean }) {
  return (
    <select id={id} name={name} className={styles.pickerSelect} defaultValue="" required={required}>
      <option value="" disabled={required}>
        {required ? 'Select a country…' : '— None —'}
      </option>
      {SORTED_COUNTRIES.map((c) => (
        <option key={c.iso3} value={c.iso3}>
          {c.name}
        </option>
      ))}
    </select>
  )
}

/**
 * Up to five countries, no JavaScript required (spec §4.3 hard rule). The
 * two required slots (a, b) are always visible; three optional ones
 * (c, d, e) sit behind a native `<details>` — "add a country" without a
 * client component, the same progressive-disclosure device the dossier's
 * own "ISSUE N MORE" already uses. Leaving an optional slot on "— None —"
 * is how you "remove" a country: there is nothing to wire up for that
 * either. `<form method="get">` does the rest — submitting builds
 * `?a=..&b=..&c=..` and the picker page (a Server Component reading
 * `searchParams`) redirects to the pretty `ind-vs-fra-vs-...` URL before
 * any client JS would even have a chance to run.
 */
export function ComparePicker({ invalidSelection }: ComparePickerProps) {
  return (
    <>
      {invalidSelection && (
        <p className="atlas-serial" style={{ color: 'var(--note-thread)' }} role="alert">
          Pick at least two countries from the list below.
        </p>
      )}

      <form method="get" action="/atlas/compare" className={`atlas-note ${styles.pickerForm}`}>
        <div className={styles.pickerRequired}>
          <div className={styles.pickerField}>
            <label htmlFor="compare-a" className="atlas-label">
              Country A
            </label>
            <CountrySelect id="compare-a" name="a" required />
          </div>

          <div className={styles.pickerField}>
            <label htmlFor="compare-b" className="atlas-label">
              Country B
            </label>
            <CountrySelect id="compare-b" name="b" required />
          </div>
        </div>

        <details className={styles.pickerMore}>
          <summary className={styles.pickerMoreSummary}>+ Add up to three more</summary>
          <div className={styles.pickerMoreFields}>
            <div className={styles.pickerField}>
              <label htmlFor="compare-c" className="atlas-label">
                Country C
              </label>
              <CountrySelect id="compare-c" name="c" />
            </div>

            <div className={styles.pickerField}>
              <label htmlFor="compare-d" className="atlas-label">
                Country D
              </label>
              <CountrySelect id="compare-d" name="d" />
            </div>

            <div className={styles.pickerField}>
              <label htmlFor="compare-e" className="atlas-label">
                Country E
              </label>
              <CountrySelect id="compare-e" name="e" />
            </div>
          </div>
        </details>

        <button type="submit" className={styles.pickerSubmit}>
          Compare →
        </button>
      </form>
    </>
  )
}
