import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BY_ISO3 } from '@/lib/atlas/iso-countries'
import { ComparePicker } from '../_components/ComparePicker'
import dossierStyles from '../_components/dossier.module.css'
import styles from '../_components/compare.module.css'

export const metadata: Metadata = {
  title: 'Compare — The Atlas',
  description:
    'Put up to five countries head to head — the same sheet of denomination notes, rendered as a ledger.',
}

const SLOT_KEYS = ['a', 'b', 'c', 'd', 'e'] as const
const MIN_COMPARE = 2
const MAX_COMPARE = 5

/**
 * The compare picker (spec §4.3). This is the whole no-JavaScript path
 * into `/atlas/compare/[countries]`: a plain `<form method="get">` submits
 * `?a=..&b=..&c=..` (up to five slots, `c`/`d`/`e` optional) to this same
 * route, and — because this is a Server Component reading `searchParams` —
 * the redirect to the pretty `ind-vs-fra-vs-jpn` URL happens on the server,
 * before any client JS would even have a chance to run.
 */
export default function ComparePickerPage({
  searchParams,
}: {
  searchParams: { a?: string; b?: string; c?: string; d?: string; e?: string }
}) {
  const raw = SLOT_KEYS.map((k) => searchParams[k]?.trim()).filter((v): v is string => Boolean(v))
  const attemptedSelection = raw.length > 0

  if (attemptedSelection) {
    const isos = raw.map((v) => v.toUpperCase())
    const allKnown = isos.every((iso) => BY_ISO3[iso])
    if (allKnown && isos.length >= MIN_COMPARE && isos.length <= MAX_COMPARE) {
      redirect(`/atlas/compare/${isos.map((i) => i.toLowerCase()).join('-vs-')}`)
    }
  }

  const invalidSelection =
    attemptedSelection && !(raw.length >= MIN_COMPARE && raw.every((v) => BY_ISO3[v.toUpperCase()]))

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
          Pick two to five countries. Every indicator on the sheet renders as a ledger row, one
          column per country, and the honest best value strikes in ember.
        </p>
      </div>

      <ComparePicker invalidSelection={invalidSelection} />
    </div>
  )
}
