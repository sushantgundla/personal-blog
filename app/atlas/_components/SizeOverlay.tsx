'use client'

import { useMemo, useState } from 'react'
import { COUNTRY_PATHS } from '@/lib/atlas/geo/world-paths'
import styles from './extras.module.css'

export interface SizeOverlayProps {
  iso3: string
  countryName: string
}

/** A handful of widely-recognised countries to try first as the default
 * comparison, so the panel shows something meaningful before the visitor
 * touches the picker. Falls through to the first available country if
 * none of these have geometry or match the current one. */
const DEFAULT_CANDIDATES = ['RUS', 'USA', 'CHN', 'BRA', 'IND', 'FRA', 'GBR', 'JPN', 'AUS', 'CAN']

const PATHS_BY_ISO3 = new Map(COUNTRY_PATHS.map((p) => [p.iso3, p] as const))

/**
 * Superimposes this country's outline on another, chosen from a picker,
 * both drawn at true relative scale: every entry in COUNTRY_PATHS already
 * lives in the same projected coordinate space (the world SVG's own
 * viewBox), so "true scale" needs no rescaling at all — just translating
 * the comparison path so its centroid lands on this country's centroid.
 * 76 of 250 countries have no geometry at 110m resolution; those are
 * simply absent from COUNTRY_PATHS, so the picker excludes them for free,
 * and the empty state says so plainly when the current country is one of
 * the 76.
 */
export function SizeOverlay({ iso3, countryName }: SizeOverlayProps) {
  const current = PATHS_BY_ISO3.get(iso3)

  const options = useMemo(
    () =>
      COUNTRY_PATHS.filter((p) => p.iso3 !== iso3)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [iso3]
  )

  const defaultCompare = useMemo(() => {
    const found = DEFAULT_CANDIDATES.find((code) => code !== iso3 && PATHS_BY_ISO3.has(code))
    return found ?? options[0]?.iso3 ?? ''
  }, [iso3, options])

  const [compareIso3, setCompareIso3] = useState(defaultCompare)

  if (!current) {
    return (
      <div className={`atlas-note ${styles.sizeCard}`}>
        <span className="atlas-label">Size, side by side</span>
        <div className={styles.emptyState}>
          No map geometry available for {countryName} at this resolution — size comparison isn&apos;t
          available for this country.
        </div>
      </div>
    )
  }

  const compare = PATHS_BY_ISO3.get(compareIso3)

  let viewBox = `${current.bbox[0]} ${current.bbox[1]} ${current.bbox[2] - current.bbox[0]} ${
    current.bbox[3] - current.bbox[1]
  }`
  let dx = 0
  let dy = 0

  if (compare) {
    dx = current.centroid[0] - compare.centroid[0]
    dy = current.centroid[1] - compare.centroid[1]
    const compareBbox: [number, number, number, number] = [
      compare.bbox[0] + dx,
      compare.bbox[1] + dy,
      compare.bbox[2] + dx,
      compare.bbox[3] + dy,
    ]
    const minX = Math.min(current.bbox[0], compareBbox[0])
    const minY = Math.min(current.bbox[1], compareBbox[1])
    const maxX = Math.max(current.bbox[2], compareBbox[2])
    const maxY = Math.max(current.bbox[3], compareBbox[3])
    const w = maxX - minX
    const h = maxY - minY
    const padX = w * 0.08
    const padY = h * 0.08
    viewBox = `${minX - padX} ${minY - padY} ${w + padX * 2} ${h + padY * 2}`
  }

  return (
    <div className={`atlas-note ${styles.sizeCard}`}>
      <span className="atlas-label">Size, side by side</span>

      <div className={styles.sizePickerRow}>
        <label htmlFor="atlas-size-compare" className="atlas-serial">
          Compare against
        </label>
        <select
          id="atlas-size-compare"
          className={styles.sizeSelect}
          value={compareIso3}
          onChange={(e) => setCompareIso3(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.iso3} value={o.iso3}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.sizeSvgWrap}>
        <svg viewBox={viewBox} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Outline of ${countryName} overlaid on ${compare?.name ?? 'a comparison country'}`}>
          {compare && (
            <path
              d={compare.d}
              transform={`translate(${dx} ${dy})`}
              fill="var(--note-intaglio-dim)"
              fillOpacity={0.25}
              stroke="var(--note-intaglio-dim)"
              strokeWidth={0.6}
            />
          )}
          <path d={current.d} fill="var(--note-ink)" fillOpacity={0.35} stroke="var(--note-ink)" strokeWidth={0.6} />
        </svg>
      </div>

      <div className={styles.sizeLegend}>
        <span className={styles.sizeLegendItem}>
          <span className={styles.sizeSwatch} style={{ background: 'var(--note-ink)' }} />
          {countryName}
        </span>
        {compare && (
          <span className={styles.sizeLegendItem}>
            <span className={styles.sizeSwatch} style={{ background: 'var(--note-intaglio-dim)' }} />
            {compare.name}
          </span>
        )}
      </div>
    </div>
  )
}
