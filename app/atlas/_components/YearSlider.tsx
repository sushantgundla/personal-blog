'use client'

import { useMemo, useState } from 'react'
import type { TimeSeries, TimeSeriesPoint } from '@/lib/atlas/types'
import { INDICATORS_BY_CODE } from '@/lib/atlas/indicators'
import { formatValue } from '@/lib/atlas/format'
import styles from './extras.module.css'

export interface YearSliderProps {
  timeSeries: readonly TimeSeries[]
}

/** A few headline, always-charted indicators (see indicators.ts's own
 * `chart: true` flag) — population and the two GDP measures give the
 * broadest read on a country across six decades without cluttering the
 * slider with all 60-80 notes. */
const HEADLINE_CODES = ['SP.POP.TOTL', 'NY.GDP.MKTP.CD', 'NY.GDP.PCAP.CD'] as const

const MIN_YEAR = 1960

function valueAtYear(points: readonly TimeSeriesPoint[], year: number): TimeSeriesPoint | null {
  const exact = points.find((p) => Number(p.year) === year && p.value !== null)
  if (exact) return exact
  // Nearest year with real data, preferring the most recent year at or
  // before the slider's position — this is what "drag and watch the
  // charted indicators change" means when a series has gaps.
  const before = points
    .filter((p) => p.value !== null && Number(p.year) <= year)
    .sort((a, b) => Number(b.year) - Number(a.year))[0]
  if (before) return before
  const after = points
    .filter((p) => p.value !== null && Number(p.year) > year)
    .sort((a, b) => Number(a.year) - Number(b.year))[0]
  return after ?? null
}

/** Builds a tiny security-thread sparkline with a marker at the point
 * nearest the slider's current year — not always the latest value, which
 * is the one difference from the always-latest-dot Sparkline component
 * used on the note sheet. */
function buildThread(points: readonly TimeSeriesPoint[], markedYear: string | null, width = 140, height = 30) {
  const valid = points.filter((p): p is TimeSeriesPoint & { value: number } => p.value !== null)
  if (valid.length < 2) return null

  const values = valid.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const padY = height * 0.15

  const coords = valid.map((p, i) => {
    const x = (i / (valid.length - 1)) * width
    const t = (p.value - min) / span
    const y = height - padY - t * (height - padY * 2)
    return { x, y, year: p.year }
  })

  const marked = markedYear ? coords.find((c) => c.year === markedYear) ?? coords[coords.length - 1] : coords[coords.length - 1]
  const polylinePoints = coords.map((c) => `${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' ')
  return { polylinePoints, marked, width, height }
}

/**
 * Drags from 1960 to the current year and re-reads the already-fetched
 * TimeSeries data at that year — never a network request, since every
 * value it needs was already pulled down for the sparklines on the note
 * sheet. A real `<input type="range">` so it is keyboard accessible for
 * free; under `prefers-reduced-motion` there is nothing to disable here,
 * since values simply update on each step rather than animating between
 * them.
 */
export function YearSlider({ timeSeries }: YearSliderProps) {
  const seriesByCode = useMemo(() => new Map(timeSeries.map((s) => [s.code, s] as const)), [timeSeries])
  const maxYear = new Date().getFullYear()

  const available = useMemo(() => {
    const rows: { code: string; def: (typeof INDICATORS_BY_CODE)[string]; series: TimeSeries }[] = []
    for (const code of HEADLINE_CODES) {
      const def = INDICATORS_BY_CODE[code]
      const series = seriesByCode.get(code)
      if (def && series && series.points.some((p) => p.value !== null)) {
        rows.push({ code, def, series })
      }
    }
    return rows
  }, [seriesByCode])

  const [year, setYear] = useState(maxYear)

  if (available.length === 0) {
    return (
      <div className={`atlas-note ${styles.yearCard}`}>
        <span className="atlas-label">1960 → now</span>
        <div className={styles.emptyState}>No historical time series available for this country</div>
      </div>
    )
  }

  return (
    <div className={`atlas-note ${styles.yearCard}`}>
      <span className="atlas-label">1960 → now</span>

      <div className={styles.yearRangeRow}>
        <label htmlFor="atlas-year-slider" className="sr-only">
          Year, {MIN_YEAR} to {maxYear}
        </label>
        <input
          id="atlas-year-slider"
          type="range"
          className={styles.yearRange}
          min={MIN_YEAR}
          max={maxYear}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          aria-valuetext={String(year)}
        />
        <span className={styles.yearValueBadge}>{year}</span>
      </div>

      <div className={styles.yearReadouts}>
        {available.map(({ code, def, series }) => {
          const point = valueAtYear(series.points, year)
          const thread = buildThread(series.points, point?.year ?? null)
          return (
            <div key={code} className={styles.yearIndicator}>
              <span className="atlas-label">{def.label}</span>
              <span className={styles.yearIndicatorValue}>
                {formatValue(point?.value ?? null, def.format)}
              </span>
              <span className="atlas-serial">{point?.year ?? '—'}</span>
              {thread && (
                <svg width={thread.width} height={thread.height} viewBox={`0 0 ${thread.width} ${thread.height}`} aria-hidden="true">
                  <polyline points={thread.polylinePoints} className="atlas-sparkline-path" />
                  <circle cx={thread.marked.x} cy={thread.marked.y} r={2.25} className="atlas-sparkline-dot" />
                </svg>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
