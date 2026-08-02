import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { INDICATORS_BY_CODE } from '@/lib/atlas/indicators'

export const metadata: Metadata = {
  title: 'World rankings — The Atlas',
  description: 'Rank every country by any of the roughly 150 indicators on the Atlas, not just population.',
}

// Population is the one ranking that shows everywhere else on the Atlas
// (the owner's own framing: "population is the one that shows always") —
// so it is the sensible default when nobody has picked anything yet.
const DEFAULT_INDICATOR = 'SP.POP.TOTL'

/**
 * `/atlas/rankings` on its own has nothing to render — a ranking needs an
 * indicator. This is also the entire no-JavaScript path for
 * IndicatorPicker.tsx: its `<form method="get" action="/atlas/rankings">`
 * lands here with `?indicator=CODE`, and this Server Component redirects
 * to the pretty `/atlas/rankings/CODE` before any client JS would even
 * have a chance to run — the same contract compare/page.tsx already uses
 * for ComparePicker.
 */
export default function RankingsIndexPage({
  searchParams,
}: {
  searchParams: { indicator?: string }
}) {
  const requested = searchParams.indicator?.trim()
  const code = requested && INDICATORS_BY_CODE[requested] ? requested : DEFAULT_INDICATOR
  redirect(`/atlas/rankings/${code}`)
}
