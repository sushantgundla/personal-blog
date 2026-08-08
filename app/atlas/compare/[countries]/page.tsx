import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BY_ISO3, ISO_COUNTRIES, type IsoCountry } from '@/lib/atlas/iso-countries'
import { getDossier } from '@/lib/atlas/dossier'
import { countryInk, type CountryInk } from '@/lib/atlas/ink'
import { formatValue, formatYear } from '@/lib/atlas/format'
import type { IndicatorValue } from '@/lib/atlas/types'
import { FaceNote } from '../../_components/FaceNote'
import { CompareSheet } from '../../_components/CompareSheet'
import { CompareSlots } from '../../_components/CompareSlots'
import { TradeBond } from '../../_components/TradeBond'
import { Sources } from '../../_components/Sources'
import dossierStyles from '../../_components/dossier.module.css'
import styles from '../../_components/compare.module.css'

/** Above two countries, a full FaceNote (its name sized off viewport width,
 * spec §4.2's "clamp(3.5rem, 11vw, 9rem)") cannot shrink to fit a third of
 * a shared row — the name clips and the guilloché turns to noise. Two
 * countries still get the full banknote treatment; three or more get the
 * compact identity strip below instead, and the ledger's own header
 * (flag, ink, name — CompareSheet.tsx's LedgerHeader) carries the rest. */
const MAX_FULL_FACE_NOTES = 2

interface CompactIdentity {
  iso3: string
  name: string
  ink: CountryInk
  population: IndicatorValue | null
}

/**
 * The three-to-five-country identity row: one headline number (population —
 * the same figure FaceNote leads with), colour-coded to the country via the
 * ink bar. Flag and name are deliberately not repeated here — the slots row
 * right above and the ledger header right below already carry both, so a
 * third copy here was pure duplication (spec §6.2). The country name is
 * still present for screen readers via the sr-only span, so this remains
 * identifiable without sight; sighted users read the colour against the
 * slot/ledger header it matches.
 *
 * Sized for this row, not shrunk from the full face note: the
 * denomination's clamp tops out at 2rem regardless of viewport width, so
 * it never overflows even the narrowest of five columns.
 */
function CompactIdentityStrip({ countries }: { countries: readonly CompactIdentity[] }) {
  return (
    <div className={styles.miniStrip}>
      {countries.map((c) => (
        <div key={c.iso3} className={styles.miniCard} style={{ ['--note-ink' as string]: c.ink.hex }}>
          <span className="sr-only">{c.name}</span>
          <span className={styles.miniInkBar} aria-hidden="true" />
          <div className={styles.miniDenominationRow}>
            <span className="atlas-label">Population</span>
            <span className={`atlas-denomination ${styles.miniDenomination}`}>
              {c.population?.value != null ? formatValue(c.population.value, 'number') : '—'}
            </span>
            {c.population?.year && (
              <span className="atlas-serial">as of {formatYear(Number(c.population.year))}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Same 7-day cycle as the single-country dossier (§3.1) — every country's
// World Bank data already sits on that window, so there is nothing to gain
// from a different one here.
export const revalidate = 604800

const MIN_COMPARE = 2
const MAX_COMPARE = 5

type ParsedCountries =
  | { kind: 'ok'; isos: string[] }
  | { kind: 'malformed' }
  | { kind: 'too-many'; count: number }
  | { kind: 'unknown'; iso3: string }

/**
 * `ind-vs-fra`, or `ind-vs-fra-vs-jpn-vs-bra-vs-ken` — 2 to 5 country codes,
 * case-insensitive, order preserved. Never throws on garbage — callers
 * switch on `kind` and either 404 or render a message themselves.
 * `too-many` is kept separate from `malformed`: asking for six countries is
 * a real, well-formed request that just exceeds what one ledger holds, so
 * it earns its own explanatory page instead of a bare 404.
 */
function parseCountries(param: string): ParsedCountries {
  const tokens = param.split(/-vs-/i)
  if (tokens.length < MIN_COMPARE || !tokens.every((t) => /^[a-z]{3}$/i.test(t))) {
    return { kind: 'malformed' }
  }
  if (tokens.length > MAX_COMPARE) {
    return { kind: 'too-many', count: tokens.length }
  }
  const isos = tokens.map((t) => t.toUpperCase())
  for (const iso3 of isos) {
    if (!BY_ISO3[iso3]) return { kind: 'unknown', iso3 }
  }
  return { kind: 'ok', isos }
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
  params: { countries: string }
}): Promise<Metadata> {
  const parsed = parseCountries(params.countries)
  if (parsed.kind !== 'ok') return {}
  const names = parsed.isos.map((iso) => BY_ISO3[iso]?.name).filter((n): n is string => Boolean(n))
  if (names.length < MIN_COMPARE) return {}
  return {
    title: `${names.join(' vs ')} — The Atlas`,
    description: `${names.join(', ')} head to head: every indicator laid out as a ledger, the honest best value struck in ember.`,
  }
}

export default async function ComparePage({ params }: { params: { countries: string } }) {
  const parsed = parseCountries(params.countries)
  if (parsed.kind === 'malformed' || parsed.kind === 'unknown') notFound()

  if (parsed.kind === 'too-many') {
    return (
      <div className={`${styles.pairPage} atlas-fade-in`}>
        <div className={styles.pairToolbar}>
          <Link href="/atlas/compare" className={dossierStyles.backLink}>
            ← Choose different countries
          </Link>
        </div>
        <div className={styles.tooMany}>
          <h1 className="atlas-face-name" style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}>
            Five to a sheet
          </h1>
          <p className="atlas-body">
            You asked for {parsed.count} countries. One ledger holds five at a time — trim the
            list and try again.
          </p>
        </div>
      </div>
    )
  }

  const { isos } = parsed
  const countries = isos.map((iso) => BY_ISO3[iso]).filter((c): c is IsoCountry => Boolean(c))
  if (countries.length !== isos.length) notFound()

  // Promise.all, not sequential awaits and not allSettled: every country
  // fetched at once, not N times the wait, and getDossier itself never
  // throws — every source inside it is already wrapped in a SourceResult —
  // so there is nothing here that can reject.
  const dossiers = await Promise.all(countries.map((c) => getDossier(c.iso3)))
  const inks = countries.map((c) => countryInk(c.iso3))

  const columns = countries.map((country, i) => {
    const dossier = dossiers[i]
    return {
      iso3: country.iso3,
      name: dossier.name,
      ink: inks[i],
      flagUrl: dossier.wikidata.ok ? dossier.wikidata.data.flagImageUrl : null,
      indicators: dossier.worldBank.ok ? dossier.worldBank.data.indicators : [],
    }
  })

  const flagUrls = Object.fromEntries(columns.map((c) => [c.iso3, c.flagUrl]))

  return (
    <div className={`${styles.pairPage} atlas-fade-in`}>
      <div className={styles.pairToolbar}>
        <Link href="/atlas" className={dossierStyles.backLink}>
          ← Back to the plate
        </Link>
      </div>

      {/* The slots ARE the picker now — no separate screen to leave and
          come back from (owner's request). Adding, removing or swapping a
          country here pushes a new URL immediately; this page then
          re-fetches and re-renders everything below for whichever
          countries are now current. */}
      <CompareSlots allCountries={ISO_COUNTRIES} initialIsos={isos} flagUrls={flagUrls}>
        {/* Full-size face notes only for two countries — a banknote's name
            is sized off the viewport, not its column, so it cannot shrink
            to a third of a shared row without clipping. Three or more get
            the compact identity strip instead; the ledger's own header
            repeats flag + ink + name again right below, so nothing is
            lost. */}
        {countries.length <= MAX_FULL_FACE_NOTES ? (
          <div className={styles.faceRow}>
            {countries.map((country, i) => (
              <div
                key={country.iso3}
                style={{
                  ['--note-ink' as string]: inks[i].hex,
                  ['--note-ink-rgb' as string]: hexToRgbString(inks[i].hex),
                }}
              >
                <FaceNote dossier={dossiers[i]} country={country} compact />
              </div>
            ))}
          </div>
        ) : (
          <CompactIdentityStrip
            countries={countries.map((country, i) => ({
              iso3: country.iso3,
              name: dossiers[i].name,
              ink: inks[i],
              population: columns[i].indicators.find((v) => v.code === 'SP.POP.TOTL') ?? null,
            }))}
          />
        )}

        <CompareSheet countries={columns} />

        {/* Each TradeBond carries its own "— TRADE —" cutting guide, so the
            set sits side by side with no extra heading duplicating it. */}
        <div className={styles.faceRow}>
          {countries.map((country, i) => (
            <TradeBond key={country.iso3} trade={dossiers[i].trade} countryName={dossiers[i].name} />
          ))}
        </div>

        <div className={styles.sourcesRow}>
          {countries.map((country, i) => (
            <Sources key={country.iso3} dossier={dossiers[i]} country={country} />
          ))}
        </div>
      </CompareSlots>
    </div>
  )
}
