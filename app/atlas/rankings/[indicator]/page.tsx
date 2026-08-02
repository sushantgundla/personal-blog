import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CHART_INDICATOR_CODES, INDICATORS, INDICATORS_BY_CODE } from '@/lib/atlas/indicators'
import { getRanking } from '@/lib/atlas/rankings'
import { formatValue, formatYear } from '@/lib/atlas/format'
import { IndicatorPicker } from '../../_components/IndicatorPicker'
import dossierStyles from '../../_components/dossier.module.css'

export const revalidate = 604800 // World Bank indicators move a few times a year

/** Below this many countries with a value, buildRanking (lib/atlas/rankings.ts)
 * withholds rank/percentile/worldAverage — kept here only for the wording
 * below, not for any ranking math (that stays owned by rankings.ts). */
const MIN_RANKABLE_COUNTRIES = 30

const PICKER_OPTIONS = INDICATORS.map((i) => ({ code: i.code, label: i.label, section: i.section }))

interface RankingPageProps {
  params: { indicator: string }
  searchParams?: { dir?: string }
}

/** Which end of the distribution sorts first, in plain words — describes
 * `dir`, not the ranking itself (rank numbers never change with this). */
function orderNote(higherIsBetter: boolean | null, dir: 'asc' | 'desc'): string {
  if (higherIsBetter === null) {
    return dir === 'asc' ? 'no best or worst — smallest to largest' : 'no best or worst — largest to smallest'
  }
  if (dir === 'asc') return 'showing the worst first'
  return higherIsBetter ? 'higher ranks first' : 'lower ranks first'
}

/**
 * Pre-render the indicators worth charting on a dossier (indicators.ts's
 * `chart: true` set). Any other valid code still renders on demand — Next's
 * default `dynamicParams` — because this ledger is also the source of the
 * plate's choropleth data for indicators outside that set.
 */
export async function generateStaticParams() {
  return CHART_INDICATOR_CODES.map((indicator) => ({ indicator }))
}

export async function generateMetadata({ params }: RankingPageProps): Promise<Metadata> {
  const def = INDICATORS_BY_CODE[params.indicator]
  if (!def) return {}
  return {
    title: `${def.label} — world rankings — The Atlas`,
    description: `Every country ranked by ${def.label.toLowerCase()} (${def.unit}), from the World Bank's World Development Indicators.`,
  }
}

export default async function RankingPage({ params, searchParams }: RankingPageProps) {
  const def = INDICATORS_BY_CODE[params.indicator]
  if (!def) notFound()

  const result = await getRanking(params.indicator)
  const dir: 'asc' | 'desc' = searchParams?.dir === 'asc' ? 'asc' : 'desc'

  // Presentation only — never touches lib/atlas/rankings.ts's rank/percentile
  // math. Below MIN_RANKABLE_COUNTRIES that module leaves rows in fetch
  // order (no rank assigned), so they are re-sorted here purely so the
  // table reads sensibly; the "—" in the Rank column still tells the truth.
  let displayRows = result.ok ? result.data.rows : []
  if (result.ok) {
    const withValue = result.data.rows.filter(
      (r): r is typeof r & { value: number } => r.value !== null
    )
    const withoutValue = result.data.rows.filter((r) => r.value === null)
    const sorted = [...withValue].sort((a, b) =>
      def.higherIsBetter === false ? a.value - b.value : b.value - a.value
    )
    const ordered = dir === 'asc' ? sorted.reverse() : sorted
    displayRows = [...ordered, ...withoutValue]
  }

  const totalCountries = result.ok ? result.data.rows.length : 0
  const withValueCount = result.ok ? result.data.rows.filter((r) => r.value !== null).length : 0
  const rankable = result.ok && result.data.worldAverage !== null

  const nextDir = dir === 'asc' ? 'desc' : 'asc'
  const flipLabel =
    def.higherIsBetter === null
      ? nextDir === 'asc'
        ? 'Show smallest first'
        : 'Show largest first'
      : nextDir === 'asc'
        ? 'Show worst first'
        : 'Show best first'

  return (
    <div className="atlas-fade-in" style={{ maxWidth: '52rem', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
      <div className={dossierStyles.pageToolbar} style={{ width: '100%' }}>
        <Link href="/atlas" className={dossierStyles.backLink}>
          ← Back to the plate
        </Link>
      </div>
      <h1 className="atlas-face-name" style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', marginTop: '0.5rem' }}>
        {def.label}
      </h1>
      <p className="atlas-body" style={{ color: 'var(--note-intaglio-dim)', marginTop: '0.25rem' }}>
        {def.unit} · {orderNote(def.higherIsBetter, dir)}
      </p>

      <IndicatorPicker options={PICKER_OPTIONS} current={params.indicator} />

      {!result.ok ? (
        <p className="atlas-body" style={{ marginTop: '2rem' }}>
          The World Bank did not answer for this indicator just now. Try again shortly — every number here is
          fetched live and cached for 7 days, so a single failed request never leaves this page broken for long.
        </p>
      ) : (
        <>
          <p className="atlas-serial" style={{ marginTop: '0.75rem' }}>
            {withValueCount} of {totalCountries} countries report a figure for {def.label.toLowerCase()}
            {withValueCount > 0 && !rankable && ` — fewer than ${MIN_RANKABLE_COUNTRIES}, so no rank is shown`}
          </p>

          {rankable && result.data.worldAverage !== null && (
            <p className="atlas-serial" style={{ marginTop: '0.25rem' }}>
              World average: {formatValue(result.data.worldAverage, def.format)}
            </p>
          )}

          {!rankable && withValueCount > 0 && (
            <p className="atlas-body" style={{ marginTop: '1rem', color: 'var(--note-thread)' }} role="note">
              Too few countries report {def.label.toLowerCase()} for a rank or a world average to mean anything —
              below is just what each country that has a figure actually reported, and the year it's from.
            </p>
          )}

          {withValueCount === 0 && (
            <p className="atlas-body" style={{ marginTop: '1rem', color: 'var(--note-thread)' }} role="note">
              The World Bank has no figure for {def.label.toLowerCase()} for any country right now.
            </p>
          )}

          {withValueCount > 0 && (
            <p style={{ marginTop: '0.75rem' }}>
              <Link
                href={`/atlas/rankings/${params.indicator}?dir=${nextDir}`}
                className="atlas-label"
                style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                {flipLabel}
              </Link>
            </p>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2rem' }}>
            <thead>
              <tr className="atlas-label" style={{ textAlign: 'left' }}>
                <th style={{ padding: '0.5rem 0.5rem 0.5rem 0' }}>Rank</th>
                <th style={{ padding: '0.5rem' }}>Country</th>
                <th style={{ padding: '0.5rem' }}>Value</th>
                <th style={{ padding: '0.5rem' }}>Year</th>
                <th style={{ padding: '0.5rem 0 0.5rem 0.5rem', width: '30%' }} aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => (
                <tr
                  key={row.iso3}
                  style={{ borderTop: '1px solid var(--note-rule)' }}
                  className={row.rank !== null && row.rank <= 10 ? 'atlas-remarkable' : undefined}
                >
                  <td className="atlas-serial" style={{ padding: '0.5rem 0.5rem 0.5rem 0' }}>
                    {row.rank ? `#${row.rank}` : '—'}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <Link href={`/atlas/${row.iso3}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {row.name}
                    </Link>
                  </td>
                  <td className="atlas-serial" style={{ padding: '0.5rem' }}>
                    {formatValue(row.value, def.format)}
                  </td>
                  <td className="atlas-serial" style={{ padding: '0.5rem' }}>
                    {row.year ? formatYear(Number(row.year)) : '—'}
                  </td>
                  <td style={{ padding: '0.5rem 0 0.5rem 0.5rem' }}>
                    <span className="atlas-thread" style={{ width: '100%' }}>
                      <span
                        className="atlas-thread-fill"
                        style={{ transform: `scaleX(${(row.percentile ?? 0) / 100})` }}
                      />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <p className="atlas-serial" style={{ marginTop: '2.5rem' }}>
        Source: World Bank, World Development Indicators (CC BY 4.0)
      </p>
    </div>
  )
}
