import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { COUNTRY_PATHS } from '@/lib/atlas/geo/world-paths'
import { ISO_COUNTRIES } from '@/lib/atlas/iso-countries'
import { INDICATORS_BY_CODE } from '@/lib/atlas/indicators'
import { getRanking } from '@/lib/atlas/rankings'
import type { Ranking } from '@/lib/atlas/types'
import { FloorBand } from './_components/FloorBand'
import { Plate } from './_components/Plate'
import styles from './_components/plate.module.css'

// World Bank indicators move a few times a year — see docs spec §3.1 — which
// is why this used to sit at 604800 (a week). Dropped to an hour on
// 2026-08-11 when FloorBand (below) started carrying the daily Country of
// the day: a week-long window would freeze that pick until the next deploy.
// This doesn't cost extra World Bank calls — getRanking (lib/atlas/rankings.ts)
// reads a committed snapshot file cached forever via
// unstable_cache(..., { revalidate: false }), reset only by a new deploy — so
// lowering this number only changes how often this page's own HTML
// regenerates, which is cheap, not how often outside data gets fetched.
// Matches the cadence app/atlas/learn/page.tsx already uses for the same
// reason.
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'The Atlas — every country in the world, engraved',
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
  //
  // Fixed 2026-08-03: this used to filter out DEFAULT_METRIC (population),
  // on the theory that it's already the rail's resting sort order so it
  // didn't need its own chip too. In practice that meant population could
  // never be painted onto the map at all — there was no chip for it — which
  // is exactly the "population colouring doesn't work" the owner reported.
  // Population gets a chip like every other indicator; it just also happens
  // to be the default rail order and cartouche line.
  const dialIndicators = DIAL_CODES.filter((code) => rankings[code]).map(
    (code) => INDICATORS_BY_CODE[code]
  )

  return (
    <div className={styles.page}>
      {/* Plain-language orientation for a first-time visitor — see the
          design review: "not easy to understand or navigate". A real
          heading (there wasn't one before — just this paragraph), one
          sentence beneath it, no marketing copy, plus the two routes the
          plate itself doesn't otherwise link to. */}
      <div className={styles.intro}>
        <div className={styles.introText}>
          <h1 className={`atlas-face-name ${styles.introTitle}`}>The Atlas</h1>
          <p className={styles.introLine}>
            The world, engraved as banknotes — one note per country. Hover the map, search, or pick
            a row in the standings, then open a country to read its note.
          </p>
        </div>
        <nav className={styles.introLinks} aria-label="More ways into The Atlas">
          <Link href="/atlas/compare" className={styles.introLink}>
            Compare countries →
          </Link>
          <Link href={`/atlas/rankings/${DEFAULT_METRIC}`} className={styles.introLink}>
            Full rankings →
          </Link>
        </nav>
      </div>

      {/* Redesigned 2026-08-11: the training floor's entry used to be
          .floorDoor, a card in this corner — the owner looked at it live and
          said "cant see it". Full-width band instead, its own row between
          .intro and the map+rail below; see FloorBand.tsx. */}
      <FloorBand />

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
