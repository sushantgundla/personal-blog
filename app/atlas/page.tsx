import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { COUNTRY_PATHS } from '@/lib/atlas/geo/world-paths'
import { ISO_COUNTRIES } from '@/lib/atlas/iso-countries'
import { INDICATORS_BY_CODE } from '@/lib/atlas/indicators'
import { getRanking } from '@/lib/atlas/rankings'
import type { Ranking } from '@/lib/atlas/types'
import { Plate } from './_components/Plate'
import { AtlasSearch } from './_components/AtlasSearch'
import styles from './_components/plate.module.css'

export const revalidate = 604800 // World Bank indicators move a few times a year — see docs spec §3.1

export const metadata: Metadata = {
  title: 'The Atlas — the world, engraved',
  description:
    'The uncut printing plate of every country on Earth. Hover, search, or pick an indicator to paint the world — then open any country as its own banknote.',
}

/** The default rank-rail order and the cartouche's "population" line. */
const DEFAULT_METRIC = 'SP.POP.TOTL'

/** The metric dial's short list — a deliberate cross-section of
 * indicators.ts, each telling a different story about the world. Codes not
 * present here are still reachable from the dossier and the full rankings
 * ledger at /atlas/rankings/[indicator]; this is just what's worth a click
 * from the landing plate. */
const DIAL_CODES = [
  DEFAULT_METRIC,
  'NY.GDP.PCAP.CD',
  'SP.DYN.LE00.IN',
  'IT.NET.USER.ZS',
  'AG.LND.FRST.ZS',
  'EN.GHG.CO2.PC.CE.AR5',
  'SL.UEM.TOTL.ZS',
] as const

interface AtlasPageProps {
  searchParams: { c?: string }
}

/**
 * A Server Component: the world map is in the HTML before any JavaScript
 * runs. `searchParams.c` is how the no-JS search fallback (a plain
 * `<form method="get">` in AtlasSearch.tsx) reaches a country without any
 * client-side routing — the browser submits `/atlas?c=IND` and this
 * redirects to the real dossier URL, entirely server-side.
 */
export default async function AtlasPage({ searchParams }: AtlasPageProps) {
  const requested = searchParams?.c?.trim().toUpperCase()
  if (requested) {
    const match = ISO_COUNTRIES.find((c) => c.iso3 === requested || c.iso2 === requested)
    if (match) redirect(`/atlas/${match.iso3}`)
  }

  const settled = await Promise.allSettled(DIAL_CODES.map((code) => getRanking(code)))

  const rankings: Record<string, Ranking> = {}
  settled.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value.ok) {
      rankings[DIAL_CODES[i]] = result.value.data
    }
  })

  // A dead World Bank call for one dial indicator drops that chip rather
  // than the page — never Promise.all here (see spec §7).
  const dialIndicators = DIAL_CODES.filter((code) => code !== DEFAULT_METRIC && rankings[code]).map(
    (code) => INDICATORS_BY_CODE[code]
  )

  return (
    <div className={styles.page}>
      <AtlasSearch countries={ISO_COUNTRIES} />
      <Plate
        countryPaths={COUNTRY_PATHS}
        allCountries={ISO_COUNTRIES}
        rankings={rankings}
        dialIndicators={dialIndicators}
        defaultMetric={DEFAULT_METRIC}
      />
    </div>
  )
}
