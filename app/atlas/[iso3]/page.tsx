import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BY_ISO3, ISO_COUNTRIES } from '@/lib/atlas/iso-countries'
import { getDossier } from '@/lib/atlas/dossier'
import { attachRankings } from '@/lib/atlas/rankings'
import { countryInk } from '@/lib/atlas/ink'
import { FaceNote } from '../_components/FaceNote'
import { NoteSheet } from '../_components/NoteSheet'
import { UvLamp } from '../_components/UvLamp'
import { Sources } from '../_components/Sources'
import styles from '../_components/dossier.module.css'

// World Bank data (§3.1) is on a 7-day cycle — matches the revalidate
// window every lib/atlas/sources client already fetches with.
export const revalidate = 604800

export function generateStaticParams() {
  return ISO_COUNTRIES.map((c) => ({ iso3: c.iso3.toLowerCase() }))
}

export async function generateMetadata({
  params,
}: {
  params: { iso3: string }
}): Promise<Metadata> {
  const country = BY_ISO3[params.iso3.toUpperCase()]
  if (!country) return {}
  return {
    title: `${country.name} — The Atlas`,
    description: `${country.name}'s dossier: geography, economy, trade, society and history, rendered as an uncut sheet of banknotes.`,
  }
}

function hexToRgbString(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

export default async function CountryDossierPage({
  params,
}: {
  params: { iso3: string }
}) {
  // Both cases work: the URL is case-insensitive, even though
  // generateStaticParams only pre-renders the lowercase form.
  const iso3 = params.iso3.toUpperCase()
  const country = BY_ISO3[iso3]
  if (!country) notFound()

  const dossier = await getDossier(iso3)

  // Rankings are fetched once per indicator code for the whole site (see
  // lib/atlas/rankings.ts's module-level cache), not once per country —
  // safe to ask for every indicator this country actually has a value for.
  const codes = dossier.worldBank.ok ? dossier.worldBank.data.indicators.map((i) => i.code) : []
  const rankedIndicators = dossier.worldBank.ok
    ? await attachRankings(iso3, dossier.worldBank.data.indicators, codes)
    : []

  // One muted hue for this country, tinting its guilloché, note edges
  // and section rules throughout the page — see lib/atlas/ink.ts.
  const ink = countryInk(iso3)

  return (
    <div
      className={`${styles.page} atlas-fade-in`}
      style={{
        ['--note-ink' as string]: ink.hex,
        ['--note-ink-rgb' as string]: hexToRgbString(ink.hex),
      }}
    >
      <div className={styles.pageToolbar}>
        <Link href="/atlas" className={styles.backLink}>
          ← Back to the plate
        </Link>
        <UvLamp />
      </div>

      <FaceNote dossier={dossier} country={country} />

      <NoteSheet
        indicators={rankedIndicators}
        timeSeries={dossier.timeSeries.ok ? dossier.timeSeries.data : []}
      />

      <Sources dossier={dossier} country={country} />
    </div>
  )
}
