'use client'

import { useMemo, useRef, useState } from 'react'
import type { CountryPath } from '@/lib/atlas/geo/world-paths'
import { WORLD_VIEWBOX } from '@/lib/atlas/geo/world-paths'
import type { IsoCountry } from '@/lib/atlas/iso-countries'
import type { IndicatorDef, Ranking } from '@/lib/atlas/types'
import { INDICATORS_BY_CODE } from '@/lib/atlas/indicators'
import { formatValue, formatRank } from '@/lib/atlas/format'
import { Cartouche } from './Cartouche'
import { MetricDial, METRIC_RAMP } from './MetricDial'
import { RankRail, type RailRow } from './RankRail'
import styles from './plate.module.css'

export interface PlateProps {
  countryPaths: readonly CountryPath[]
  /** All 250 — including the 76 with no geometry at this resolution. */
  allCountries: readonly IsoCountry[]
  /** Only the codes that actually fetched successfully; a dead World Bank
   * call for one dial indicator degrades that chip away rather than the page. */
  rankings: Record<string, Ranking>
  dialIndicators: IndicatorDef[]
  /** The metric prefetched server-side and used as the resting rank-rail
   * order and the cartouche's "population" line — SP.POP.TOTL. */
  defaultMetric: string
}

const [VB_X, VB_Y, VB_W, VB_H] = WORLD_VIEWBOX.split(' ').map(Number)

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)]
}

function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  return `rgb(${Math.round(ar + (br - ar) * t)}, ${Math.round(ag + (bg - ag) * t)}, ${Math.round(ab + (bb - ab) * t)})`
}

/** percentile 100 (best end of the distribution) -> warm end of the ramp,
 * percentile 0 -> cold end. `lib/atlas/rankings.ts` already orients
 * percentile for higherIsBetter, so this needs no direction logic of its own. */
function rampColor(percentile: number): string {
  const t = Math.max(0, Math.min(100, percentile)) / 100
  const pos = (1 - t) * (METRIC_RAMP.length - 1)
  const i0 = Math.floor(pos)
  const i1 = Math.min(METRIC_RAMP.length - 1, i0 + 1)
  return mixHex(METRIC_RAMP[i0], METRIC_RAMP[i1], pos - i0)
}

function RegCross({ x, y }: { x: number; y: number }) {
  const s = 9
  return (
    <g className={styles.regCross} aria-hidden="true" fill="none" strokeWidth={1}>
      <line x1={x - s} y1={y} x2={x + s} y2={y} />
      <line x1={x} y1={y - s} x2={x} y2={y + s} />
      <circle cx={x} cy={y} r={s * 1.6} />
    </g>
  )
}

export function Plate({ countryPaths, allCountries, rankings, dialIndicators, defaultMetric }: PlateProps) {
  const [activeMetric, setActiveMetric] = useState<string | null>(null)
  const [hoverIso3, setHoverIso3] = useState<string | null>(null)
  const [hoverSource, setHoverSource] = useState<'map' | 'rail' | null>(null)
  const [cartouchePos, setCartouchePos] = useState({ x: 0, y: 0 })

  const mapWrapRef = useRef<HTMLDivElement>(null)
  const serialRef = useRef<HTMLSpanElement>(null)
  const serialCount = useRef(0)

  const pathsByIso3 = useMemo(() => new Map(countryPaths.map((c) => [c.iso3, c] as const)), [countryPaths])
  const onPlateSet = useMemo(() => new Set(countryPaths.map((c) => c.iso3)), [countryPaths])

  const popRanking = rankings[defaultMetric] ?? null
  const popByIso3 = useMemo(
    () => new Map((popRanking?.rows ?? []).map((r) => [r.iso3, r] as const)),
    [popRanking]
  )

  const activeRanking = activeMetric ? rankings[activeMetric] ?? null : null

  const paintByIso3 = useMemo(() => {
    if (!activeRanking) return null
    const map = new Map<string, { color: string; delay: number }>()
    for (const row of activeRanking.rows) {
      if (row.value === null) continue
      const path = pathsByIso3.get(row.iso3)
      if (!path) continue
      const nx = (path.centroid[0] - VB_X) / VB_W
      map.set(row.iso3, { color: rampColor(row.percentile ?? 50), delay: Math.round(nx * 900) })
    }
    return map
  }, [activeRanking, pathsByIso3])

  const nodataCount = activeRanking ? activeRanking.rows.filter((r) => r.value === null).length : null

  const railMetricCode = activeMetric ?? defaultMetric
  const railRanking = rankings[railMetricCode] ?? null
  const railRows: RailRow[] = useMemo(() => {
    const present = new Set(railRanking?.rows.map((r) => r.iso3) ?? [])
    const missing = allCountries.filter((c) => !present.has(c.iso3))
    const missingRows: RailRow[] = missing.map((c) => ({
      iso3: c.iso3,
      name: c.name,
      value: null,
      year: null,
      rank: null,
      percentile: null,
    }))
    return [...(railRanking?.rows ?? []), ...missingRows]
  }, [railRanking, allCountries])

  function handleContainerMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    serialCount.current += 1
    if (serialRef.current) serialRef.current.textContent = String(serialCount.current).padStart(8, '0')
    const rect = mapWrapRef.current?.getBoundingClientRect()
    if (rect) setCartouchePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  function handleCountryEnter(iso3: string) {
    setHoverIso3(iso3)
    setHoverSource('map')
  }

  function handleCountryFocus(c: CountryPath) {
    setHoverIso3(c.iso3)
    setHoverSource('map')
    const rect = mapWrapRef.current?.getBoundingClientRect()
    if (rect) {
      setCartouchePos({
        x: ((c.centroid[0] - VB_X) / VB_W) * rect.width,
        y: ((c.centroid[1] - VB_Y) / VB_H) * rect.height,
      })
    }
  }

  function handleCountryLeave() {
    setHoverIso3(null)
    setHoverSource(null)
  }

  function handleRailHover(iso3: string | null) {
    setHoverIso3(iso3)
    setHoverSource(iso3 ? 'rail' : null)
  }

  const hoveredPath = hoverIso3 ? pathsByIso3.get(hoverIso3) : null
  const hoveredPopRow = hoverIso3 ? popByIso3.get(hoverIso3) : undefined
  const hoveredMetricRow = hoverIso3 && activeRanking ? activeRanking.rows.find((r) => r.iso3 === hoverIso3) : undefined
  const activeIndicatorDef = activeMetric ? INDICATORS_BY_CODE[activeMetric] : null

  return (
    <div className={styles.layout}>
      <aside className={styles.rail}>
        <MetricDial
          indicators={dialIndicators}
          active={activeMetric}
          onChange={setActiveMetric}
          nodataCount={nodataCount}
        />
        <RankRail
          rows={railRows}
          indicator={activeIndicatorDef}
          worldAverage={railRanking?.worldAverage ?? null}
          hoveredIso3={hoverIso3}
          onHover={handleRailHover}
          onPlate={onPlateSet}
        />
      </aside>

      <section className={styles.mapCol}>
        <div className={styles.furnitureRow}>
          <div className={styles.serialBox}>
            <span className="atlas-label">Serial</span>
            <span className="atlas-serial" ref={serialRef} aria-hidden="true">
              00000000
            </span>
          </div>
          <div className={styles.denomPanel}>
            <span className="atlas-denomination figure" style={{ fontSize: '1.75rem' }}>
              {allCountries.length}
            </span>
            <span className="caption">
              <span className="atlas-label">Countries catalogued</span>
              <span className="atlas-serial">{countryPaths.length} engraved on the plate</span>
            </span>
          </div>
        </div>

        <div
          className={styles.mapWrap}
          ref={mapWrapRef}
          onMouseMove={handleContainerMouseMove}
        >
          <svg
            viewBox={WORLD_VIEWBOX}
            className={styles.svg}
            role="img"
            aria-label={`World map, ${countryPaths.length} of ${allCountries.length} countries engraved. Use search or the standings list to reach any country.`}
          >
            <rect x={VB_X} y={VB_Y} width={VB_W} height={VB_H} fill="var(--note-plate)" />

            <RegCross x={VB_X + 22} y={VB_Y + 22} />
            <RegCross x={VB_X + VB_W - 22} y={VB_Y + 22} />
            <RegCross x={VB_X + 22} y={VB_Y + VB_H - 22} />
            <RegCross x={VB_X + VB_W - 22} y={VB_Y + VB_H - 22} />

            {countryPaths.map((c) => {
              const paint = paintByIso3?.get(c.iso3)
              const isHover = hoverIso3 === c.iso3
              const popRow = popByIso3.get(c.iso3)
              const headline = popRow?.value
                ? `${c.name} — population ${formatValue(popRow.value, 'number')} (${popRow.year ?? '—'})`
                : c.name

              const classNames = [
                styles.countryPath,
                paint ? styles.painted : 'atlas-hatch',
                'atlas-vt-map-path',
                !paint && isHover ? 'is-active' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <a
                  key={c.iso3}
                  href={`/atlas/${c.iso3}`}
                  className={styles.countryLink}
                  aria-label={headline}
                >
                  <path
                    d={c.d}
                    className={classNames}
                    style={
                      {
                        fill: paint ? paint.color : undefined,
                        transitionDelay: paint ? `${paint.delay}ms` : undefined,
                        '--atlas-vt-name': `atlas-country-${c.iso3}`,
                      } as React.CSSProperties
                    }
                    onMouseEnter={() => handleCountryEnter(c.iso3)}
                    onMouseLeave={handleCountryLeave}
                    onFocus={() => handleCountryFocus(c)}
                    onBlur={handleCountryLeave}
                  >
                    <title>{headline}</title>
                  </path>
                </a>
              )
            })}
          </svg>

          {hoveredPath && hoverSource === 'map' && (
            <Cartouche
              iso3={hoveredPath.iso3}
              name={hoveredPath.name}
              primaryLabel="Population"
              primaryValue={
                hoveredPopRow?.value != null
                  ? `${formatValue(hoveredPopRow.value, 'number')}${hoveredPopRow.year ? ` · ${hoveredPopRow.year}` : ''}`
                  : '—'
              }
              secondaryLabel={activeIndicatorDef ? activeIndicatorDef.label : 'World rank'}
              secondaryValue={
                activeIndicatorDef
                  ? formatValue(hoveredMetricRow?.value ?? null, activeIndicatorDef.format)
                  : formatRank(
                      hoveredPopRow?.rank ?? null,
                      popRanking ? popRanking.rows.filter((r) => r.value !== null).length : 0
                    )
              }
              x={cartouchePos.x}
              y={cartouchePos.y}
              visible={true}
            />
          )}
        </div>

        <p className={`atlas-microtext ${styles.microtextLine}`} aria-hidden="true">
          THE WORLD · {allCountries.length} CATALOGUED STATES AND TERRITORIES · SPECIMEN — {countryPaths.length}{' '}
          ENGRAVED AT THIS RESOLUTION — NOT LEGAL TENDER
        </p>
        <p className="atlas-serial">Source: World Bank, World Development Indicators (CC BY 4.0)</p>
      </section>
    </div>
  )
}
