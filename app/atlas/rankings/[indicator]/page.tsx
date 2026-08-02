import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CHART_INDICATOR_CODES, INDICATORS_BY_CODE } from '@/lib/atlas/indicators'
import { getRanking } from '@/lib/atlas/rankings'
import { formatValue, formatYear } from '@/lib/atlas/format'

export const revalidate = 604800 // World Bank indicators move a few times a year

interface RankingPageProps {
  params: { indicator: string }
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

export default async function RankingPage({ params }: RankingPageProps) {
  const def = INDICATORS_BY_CODE[params.indicator]
  if (!def) notFound()

  const result = await getRanking(params.indicator)

  return (
    <div className="atlas-fade-in" style={{ maxWidth: '52rem', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
      <p className="atlas-label">
        <Link href="/atlas" style={{ color: 'inherit' }}>
          ← the plate
        </Link>
      </p>
      <h1 className="atlas-face-name" style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', marginTop: '0.5rem' }}>
        {def.label}
      </h1>
      <p className="atlas-body" style={{ color: 'var(--note-intaglio-dim)', marginTop: '0.25rem' }}>
        {def.unit}
        {def.higherIsBetter === true && ' · higher ranks first'}
        {def.higherIsBetter === false && ' · lower ranks first'}
      </p>

      {!result.ok ? (
        <p className="atlas-body" style={{ marginTop: '2rem' }}>
          The World Bank did not answer for this indicator just now. Try again shortly — every number here is
          fetched live and cached for 7 days, so a single failed request never leaves this page broken for long.
        </p>
      ) : (
        <>
          {result.data.worldAverage !== null && (
            <p className="atlas-serial" style={{ marginTop: '0.75rem' }}>
              World average: {formatValue(result.data.worldAverage, def.format)}
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
              {result.data.rows.map((row) => (
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
