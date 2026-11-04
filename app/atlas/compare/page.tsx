import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BY_ISO3, ISO_COUNTRIES } from '@/lib/atlas/iso-countries'
import { CompareSlots } from '../_components/CompareSlots'
import dossierStyles from '../_components/dossier.module.css'
import styles from '../_components/compare.module.css'

const SLOT_KEYS = ['a', 'b', 'c', 'd', 'e'] as const
const MIN_COMPARE = 2
const MAX_COMPARE = 5

type PickerSearchParams = { a?: string; b?: string; c?: string; d?: string; e?: string }

/** What the no-JS form asked for, and where it should land if it is valid. */
function readSelection(searchParams: PickerSearchParams) {
  const raw = SLOT_KEYS.map((k) => searchParams[k]?.trim()).filter((v): v is string => Boolean(v))
  // The same country picked in two selects counts once.
  const isos = Array.from(new Set(raw.map((v) => v.toUpperCase())))
  const valid =
    isos.every((iso) => BY_ISO3[iso]) && isos.length >= MIN_COMPARE && isos.length <= MAX_COMPARE
  return {
    attempted: raw.length > 0,
    target: valid ? `/atlas/compare/${isos.map((i) => i.toLowerCase()).join('-vs-')}` : null,
  }
}

export const metadata: Metadata = {
  title: 'Compare — The Atlas',
  description:
    'Put up to five countries head to head — the same sheet of denomination notes, rendered as a ledger.',
  alternates: { canonical: '/atlas/compare' },
}

/**
 * `/atlas/compare` with no countries chosen — the same screen as
 * `/atlas/compare/[countries]`, just with every slot empty (owner's
 * request: no separate picker screen). This is also still the whole
 * no-JavaScript path in: a plain `<form method="get">` (rendered by
 * CompareSlots' own `<noscript>`) submits `?a=..&b=..&c=..` here, and —
 * because this is a Server Component reading `searchParams` — the redirect
 * to the pretty `ind-vs-fra-vs-jpn` URL happens on the server, before any
 * client JS would even have a chance to run.
 */
export default function ComparePickerPage({
  searchParams,
}: {
  searchParams: PickerSearchParams
}) {
  const { attempted, target } = readSelection(searchParams)
  if (target) redirect(target)
  const invalidSelection = attempted

  return (
    <div className={`${styles.pickerPage} atlas-fade-in`}>
      <div className={dossierStyles.pageToolbar} style={{ width: '100%' }}>
        <Link href="/atlas" className={dossierStyles.backLink}>
          ← Back to the plate
        </Link>
      </div>

      <div className={styles.pickerIntro}>
        <h1 className="atlas-face-name" style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}>
          Up to five notes, head to head
        </h1>
        <p className="atlas-body">
          Add two to five countries below. Every indicator on the sheet renders as a ledger row,
          one column per country, and the honest best value strikes in ember.
        </p>
      </div>

      {invalidSelection && (
        <p className="atlas-serial" style={{ color: 'var(--note-thread)' }} role="alert">
          Pick at least two countries from the list below.
        </p>
      )}

      <CompareSlots allCountries={ISO_COUNTRIES} initialIsos={[]} flagUrls={{}} />
    </div>
  )
}
