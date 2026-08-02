'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { IndicatorDef } from '@/lib/atlas/types'
import { formatValue, formatYear } from '@/lib/atlas/format'
import styles from './plate.module.css'

export interface RailRow {
  iso3: string
  name: string
  value: number | null
  year: string | null
  rank: number | null
  percentile: number | null
}

export interface RankRailProps {
  rows: RailRow[]
  indicator: IndicatorDef | null
  worldAverage: number | null
  hoveredIso3: string | null
  onHover: (iso3: string | null) => void
  /** Countries with geometry on the plate — used to flag the 76 without it. */
  onPlate: ReadonlySet<string>
  /** The indicator code this rail is currently sorted by (population when
   *  nothing is picked on the dial) — used only to link "Full rankings"
   *  at /atlas/rankings/[indicator], the same ledger the choropleth reads. */
  metricCode: string
}

/** Rendering all ~250 rows is fine for React, but a 70vh scroll box of 250
 * live rows with hover listeners is needless work for the ~90% of visits
 * that never scroll past the top of the standings. Render the top 60 and
 * let a plain button reveal the rest — no virtualisation library needed. */
const INITIAL_ROWS = 60

export function RankRail({ rows, indicator, worldAverage, hoveredIso3, onHover, onPlate, metricCode }: RankRailProps) {
  const [expanded, setExpanded] = useState(false)

  const sorted = useMemo(() => {
    // Ranked rows first (already in rank order from lib/atlas/rankings.ts),
    // then unranked/no-data rows alphabetically so nothing is ever dropped.
    const ranked = rows.filter((r) => r.rank !== null)
    const unranked = rows.filter((r) => r.rank === null).sort((a, b) => a.name.localeCompare(b.name))
    return [...ranked, ...unranked]
  }, [rows])

  const visible = expanded ? sorted : sorted.slice(0, INITIAL_ROWS)
  const format = indicator?.format ?? 'number'

  return (
    <div>
      <div className={styles.railHeader}>
        <div className={styles.railHeaderTop}>
          <div className="atlas-label">The standings — ranked by {indicator ? indicator.label.toLowerCase() : 'population'}</div>
          <Link href={`/atlas/rankings/${metricCode}`} className={styles.railFullLink}>
            Full rankings →
          </Link>
        </div>
        <div className="atlas-serial">
          {indicator ? indicator.label : 'Population'} · {sorted.length} countries
          {worldAverage !== null && ` · world avg ${formatValue(worldAverage, format)}`}
        </div>
        {/* Fixed 2026-08-03: the asterisk on a handful of names (Bahrain,
            Tonga, ...) is real information — those ~76 countries have no
            SVG shape on the map at this resolution, only a rail row and a
            search result — but the only explanation of it used to sit
            below all 250 rows, past the "Show all" button, where almost
            no one scrolls far enough to see it. Moved up here so it's
            visible without scrolling; the version at the foot of the list
            is gone; this is now the only copy. */}
        <p className="atlas-serial" style={{ marginTop: '0.15rem' }}>
          * no shape on the plate at this resolution — still linked here and in search
        </p>
      </div>
      <div className={styles.railList}>
        {visible.map((row) => {
          const hasGeometry = onPlate.has(row.iso3)
          return (
            <Link
              key={row.iso3}
              href={`/atlas/${row.iso3}`}
              className={`${styles.railRow} ${hoveredIso3 === row.iso3 ? styles.railRowActive : ''}`}
              onMouseEnter={() => onHover(row.iso3)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(row.iso3)}
              onBlur={() => onHover(null)}
              title={hasGeometry ? undefined : `${row.name} has no shape on the plate — reachable here and by search only`}
            >
              <span className={styles.railRank}>{row.rank ? `#${row.rank}` : '—'}</span>
              <span className={styles.railName}>
                {row.name}
                {!hasGeometry && ' *'}
              </span>
              <span className={styles.railValueCol}>
                <span className={styles.railValue}>
                  {formatValue(row.value, format)}
                  {row.year ? ` · ${formatYear(Number(row.year))}` : ''}
                </span>
                <span className="atlas-thread" style={{ width: '100%' }}>
                  <span
                    className="atlas-thread-fill"
                    style={{ transform: `scaleX(${(row.percentile ?? 0) / 100})` }}
                  />
                </span>
              </span>
              <span className={styles.railChevron} aria-hidden="true">
                ›
              </span>
            </Link>
          )
        })}
      </div>
      {!expanded && sorted.length > INITIAL_ROWS && (
        <div className={styles.railMore}>
          <button type="button" className={styles.railMoreButton} onClick={() => setExpanded(true)}>
            ▸ Show all {sorted.length}
          </button>
        </div>
      )}
    </div>
  )
}
