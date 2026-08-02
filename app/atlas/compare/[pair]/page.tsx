import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BY_ISO3 } from '@/lib/atlas/iso-countries'
import { getDossier } from '@/lib/atlas/dossier'
import { countryInk } from '@/lib/atlas/ink'
import { FaceNote } from '../../_components/FaceNote'
import { CompareSheet } from '../../_components/CompareSheet'
import { TradeBond } from '../../_components/TradeBond'
import { Sources } from '../../_components/Sources'
import dossierStyles from '../../_components/dossier.module.css'
import styles from '../../_components/compare.module.css'

// Same 7-day cycle as the single-country dossier (§3.1) — both countries'
// World Bank data already sits on that window, so there is nothing to gain
// from a different one here.
export const revalidate = 604800

/** `ind-vs-fra`, case-insensitive, either order. Never throws on garbage —
 * callers check for null and 404 themselves. */
function parsePair(pair: string): [string, string] | null {
  const match = /^([a-z]{3})-vs-([a-z]{3})$/i.exec(pair)
  if (!match) return null
  return [match[1].toUpperCase(), match[2].toUpperCase()]
}

function hexToRgbString(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

export async function generateMetadata({
  params,
}: {
  params: { pair: string }
}): Promise<Metadata> {
  const parsed = parsePair(params.pair)
  if (!parsed) return {}
  const [isoA, isoB] = parsed
  const a = BY_ISO3[isoA]
  const b = BY_ISO3[isoB]
  if (!a || !b) return {}
  return {
    title: `${a.name} vs ${b.name} — The Atlas`,
    description: `${a.name} and ${b.name} head to head: every indicator paired, the higher value struck in ember.`,
  }
}

export default async function ComparePairPage({ params }: { params: { pair: string } }) {
  const parsed = parsePair(params.pair)
  if (!parsed) notFound()
  const [isoA, isoB] = parsed

  const countryA = BY_ISO3[isoA]
  const countryB = BY_ISO3[isoB]
  if (!countryA || !countryB) notFound()

  // Promise.all, not allSettled: getDossier itself never throws — every
  // source inside it is already wrapped in a SourceResult — so there is
  // nothing here that can reject.
  const [dossierA, dossierB] = await Promise.all([getDossier(isoA), getDossier(isoB)])

  const inkA = countryInk(isoA)
  const inkB = countryInk(isoB)

  const indicatorsA = dossierA.worldBank.ok ? dossierA.worldBank.data.indicators : []
  const indicatorsB = dossierB.worldBank.ok ? dossierB.worldBank.data.indicators : []

  return (
    <div className={`${styles.pairPage} atlas-fade-in`}>
      <div className={styles.pairToolbar}>
        <Link href="/atlas/compare" className={dossierStyles.backLink}>
          ← Choose different countries
        </Link>
      </div>

      <div className={styles.faceRow}>
        <div
          style={{
            ['--note-ink' as string]: inkA.hex,
            ['--note-ink-rgb' as string]: hexToRgbString(inkA.hex),
          }}
        >
          <FaceNote dossier={dossierA} country={countryA} />
        </div>
        <div
          style={{
            ['--note-ink' as string]: inkB.hex,
            ['--note-ink-rgb' as string]: hexToRgbString(inkB.hex),
          }}
        >
          <FaceNote dossier={dossierB} country={countryB} />
        </div>
      </div>

      <CompareSheet
        nameA={dossierA.name}
        nameB={dossierB.name}
        indicatorsA={indicatorsA}
        indicatorsB={indicatorsB}
      />

      {/* Each TradeBond carries its own "— TRADE —" cutting guide, so the
          pair sits side by side with no extra heading duplicating it. */}
      <div className={styles.faceRow}>
        <TradeBond trade={dossierA.trade} countryName={dossierA.name} />
        <TradeBond trade={dossierB.trade} countryName={dossierB.name} />
      </div>

      <div className={styles.sourcesRow}>
        <Sources dossier={dossierA} country={countryA} />
        <Sources dossier={dossierB} country={countryB} />
      </div>
    </div>
  )
}
