'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CountryPath } from '@/lib/atlas/geo/world-paths'
import { WORLD_VIEWBOX } from '@/lib/atlas/geo/world-paths'
import type { IsoCountry } from '@/lib/atlas/iso-countries'
import type { IndicatorDef, Ranking } from '@/lib/atlas/types'
import { INDICATORS_BY_CODE } from '@/lib/atlas/indicators'
import { formatValue, formatRank } from '@/lib/atlas/format'
import { AtlasSearch } from './AtlasSearch'
import { Cartouche } from './Cartouche'
import { MetricDial, METRIC_RAMP } from './MetricDial'
import { RankRail, type RailRow } from './RankRail'
import { useMapTransform } from './useMapTransform'
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
  const svgRef = useRef<SVGSVGElement>(null)

  const {
    transform,
    isDragging,
    zoomAt,
    zoomStep,
    panByKeys,
    reset: resetView,
    beginDrag,
    dragTo,
    endDrag,
    wasDragged,
    clearDragged,
    worldToClient,
    minScale,
    maxScale,
  } = useMapTransform(svgRef, VB_W, VB_H)

  // Wheel-to-zoom needs a non-passive native listener — React's own onWheel
  // prop is registered passive, so calling preventDefault() there is
  // silently ignored and the page would scroll (or, here, the sidebar next
  // to it would) at the same time as the map zoomed.
  useEffect(() => {
    const node = mapWrapRef.current
    if (!node) return
    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      const factor = Math.exp(-e.deltaY * 0.0015)
      zoomAt(e.clientX, e.clientY, factor)
    }
    node.addEventListener('wheel', handleWheel, { passive: false })
    return () => node.removeEventListener('wheel', handleWheel)
  }, [zoomAt])

  // Tracks every finger/pointer currently down, so two fingers pinch-zoom
  // while one finger (or the mouse) drag-pans — plain pointer events, no
  // gesture library, matching the "no runtime library" constraint.
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStartDist = useRef<number | null>(null)

  function pinchDistance(): number | null {
    if (activePointers.current.size !== 2) return null
    const [a, b] = Array.from(activePointers.current.values())
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    e.currentTarget.setPointerCapture(e.pointerId)
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (activePointers.current.size === 1) {
      beginDrag(e.clientX, e.clientY)
    } else if (activePointers.current.size === 2) {
      pinchStartDist.current = pinchDistance()
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!activePointers.current.has(e.pointerId)) return
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (activePointers.current.size === 2) {
      const [a, b] = Array.from(activePointers.current.values())
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      if (pinchStartDist.current) zoomAt(mid.x, mid.y, dist / pinchStartDist.current)
      pinchStartDist.current = dist
    } else if (activePointers.current.size === 1 && e.buttons === 1) {
      dragTo(e.clientX, e.clientY)
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    activePointers.current.delete(e.pointerId)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)

    if (activePointers.current.size === 0) {
      endDrag()
    } else if (activePointers.current.size === 1) {
      pinchStartDist.current = null
      // One finger lifted out of a pinch — restart the drag baseline from
      // the remaining finger so panning doesn't jump.
      const [remaining] = Array.from(activePointers.current.values())
      beginDrag(remaining.x, remaining.y)
    }
  }

  /** A drag that ended up moving the map shouldn't also fire the country
   * link's navigation underneath the pointer — this runs in the capture
   * phase, ahead of the <a>'s own click. */
  function handleClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (wasDragged()) {
      e.preventDefault()
      e.stopPropagation()
      clearDragged()
    }
  }

  const PAN_KEYS: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  }

  function handleMapKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const dir = PAN_KEYS[e.key]
    if (dir) {
      e.preventDefault()
      panByKeys(dir[0], dir[1])
      return
    }
    if (e.key === '+' || e.key === '=') {
      e.preventDefault()
      zoomStep(1)
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault()
      zoomStep(-1)
    } else if (e.key === '0') {
      e.preventDefault()
      resetView()
    }
  }

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
    // worldToClient accounts for the current zoom/pan — a plain
    // percent-of-viewBox calculation (the old code) only lined up with
    // rect.width/height at scale 1, tx=ty=0.
    const client = worldToClient(c.centroid[0], c.centroid[1])
    if (rect && client) {
      setCartouchePos({ x: client.x - rect.left, y: client.y - rect.top })
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
      {/* The metric dial used to live here — moved into the map's own top
          furniture strip below, where the serial number used to sit, so
          the control is on the plate, next to the thing it changes.
          Removing it gives the standings the rail's full height. */}
      <aside className={styles.rail}>
        <RankRail
          rows={railRows}
          indicator={activeIndicatorDef}
          worldAverage={railRanking?.worldAverage ?? null}
          hoveredIso3={hoverIso3}
          onHover={handleRailHover}
          onPlate={onPlateSet}
          metricCode={railMetricCode}
        />
      </aside>

      <section className={styles.mapCol}>
        {/* Fixed 2026-08-03: the serial number here used to increment with
            the pointer — pure decoration that carried no information, and
            the owner said plainly he didn't understand what it was. Deleted
            outright rather than explained; the metric dial takes its place
            as a thin, single-line bar instead of the floating panel it was
            a moment ago, with the country counts tightened alongside it so
            the whole strip still reads as one quiet line of plate
            furniture. */}
        <div className={styles.furnitureRow}>
          <MetricDial
            indicators={dialIndicators}
            active={activeMetric}
            onChange={setActiveMetric}
            nodataCount={nodataCount}
          />
          <div className={styles.denomPanel}>
            <span className="atlas-serial">
              {allCountries.length} catalogued · {countryPaths.length} engraved
            </span>
          </div>
        </div>

        <div
          className={`${styles.mapWrap} ${isDragging ? styles.mapWrapDragging : ''}`}
          ref={mapWrapRef}
          onMouseMove={handleContainerMouseMove}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClickCapture={handleClickCapture}
          onKeyDown={handleMapKeyDown}
          tabIndex={0}
          aria-label="Map view. Arrow keys pan, plus and minus keys zoom, zero resets. Tab again to reach a country."
        >
          <svg
            ref={svgRef}
            viewBox={WORLD_VIEWBOX}
            className={styles.svg}
            role="img"
            aria-label={`World map, ${countryPaths.length} of ${allCountries.length} countries engraved. Use search or the standings list to reach any country.`}
          >
            <rect x={VB_X} y={VB_Y} width={VB_W} height={VB_H} fill="var(--note-plate)" />

            <g transform={`translate(${transform.tx} ${transform.ty}) scale(${transform.scale})`}>
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
                    // Focus/blur belong on the <a> — it's the SVG element
                    // Tab actually lands on; the <path> inside it is never
                    // itself focusable, so handlers placed there (the
                    // pre-existing code) silently never fired for keyboard
                    // users. plate.module.css's own
                    // .countryLink:focus-visible .countryPath rule already
                    // assumed focus lands here.
                    onFocus={() => handleCountryFocus(c)}
                    onBlur={handleCountryLeave}
                  >
                    <path
                      d={c.d}
                      className={classNames}
                      style={
                        {
                          fill: paint ? paint.color : undefined,
                          transitionDelay: paint ? `${paint.delay}ms` : undefined,
                          '--atlas-vt-name': `atlas-country-${c.iso3}`,
                          // Undo the map's zoom on the hover stroke/focus ring so
                          // it stays a hairline instead of thickening with scale.
                          vectorEffect: 'non-scaling-stroke',
                        } as React.CSSProperties
                      }
                      onMouseEnter={() => handleCountryEnter(c.iso3)}
                      onMouseLeave={handleCountryLeave}
                    >
                      <title>{headline}</title>
                    </path>
                  </a>
                )
              })}
            </g>
          </svg>

          <div className={styles.cornerCluster}>
            {/* Search moved here from the header — see AtlasSearch.tsx's
                doc comment for why it only ever renders on /atlas now.
                Sits above the zoom hint/buttons so its dropdown (opens
                upward — .searchListboxUp) has clear room and never covers
                them. */}
            <AtlasSearch countries={allCountries} />
            {/* The map gives no other sign it's more than a static image —
                this is the one quiet hint that scroll/drag/arrow keys do
                something. aria-hidden since the svg's own aria-label
                already spells this out for assistive tech. */}
            <span className={`atlas-label ${styles.zoomHint}`} aria-hidden="true">
              Scroll or drag to explore
            </span>
            <div className={styles.zoomControls} role="group" aria-label="Zoom map">
              <button
                type="button"
                className={styles.zoomButton}
                onClick={() => zoomStep(1)}
                disabled={transform.scale >= maxScale}
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                type="button"
                className={styles.zoomButton}
                onClick={() => zoomStep(-1)}
                disabled={transform.scale <= minScale}
                aria-label="Zoom out"
              >
                −
              </button>
              <button
                type="button"
                className={styles.zoomButton}
                onClick={resetView}
                disabled={transform.scale === 1 && transform.tx === 0 && transform.ty === 0}
                aria-label="Reset map zoom and position"
              >
                Reset
              </button>
            </div>
          </div>

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
              containerRef={mapWrapRef}
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
