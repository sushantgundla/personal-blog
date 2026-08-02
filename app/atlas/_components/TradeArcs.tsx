'use client'

import { useMemo, useState } from 'react'
import { COUNTRY_PATHS, WORLD_VIEWBOX } from '@/lib/atlas/geo/world-paths'
import type { SourceResult, TradePartner, TradeSummary } from '@/lib/atlas/types'
import { countryInk } from '@/lib/atlas/ink'
import { formatValue } from '@/lib/atlas/format'
import styles from './arcs.module.css'

export interface TradeArcsProps {
  iso3: string
  countryName: string
  trade: SourceResult<TradeSummary>
}

type Flow = 'exports' | 'imports'

const PATHS_BY_ISO3 = new Map(COUNTRY_PATHS.map((c) => [c.iso3, c] as const))

interface Arc {
  partner: TradePartner
  x1: number
  y1: number
  x2: number
  y2: number
  cx: number
  cy: number
}

/** Bows every arc off its chord by a fixed fraction of the chord's own
 * length — the standard "arc map" construction, not a great-circle
 * projection (the plate has no notion of one; see world-paths.ts). */
function buildArc(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1
  const dy = y2 - y1
  const dist = Math.hypot(dx, dy) || 1
  const bow = 0.16
  const nx = -dy / dist
  const ny = dx / dist
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  return { cx: mx + nx * dist * bow, cy: my + ny * dist * bow }
}

/**
 * Feature: trade partner lines on the map (checklist row 10, spec §4.2
 * "Trade and neighbour lines" — never built at all). A small world map,
 * reusing the exact COUNTRY_PATHS / WORLD_VIEWBOX Plate.tsx renders the
 * plate from, with a quadratic-Bézier arc from this country's centroid to
 * each of its top trade partners' centroids: ember for exports, the
 * security-thread teal for imports, stroke weight scaled by trade value,
 * drawing themselves in with stroke-dashoffset.
 *
 * Partner centroids come from joining the trade data's ISO3 back to
 * COUNTRY_PATHS — about 76 countries have no geometry at this resolution
 * (world-atlas 110m has no landmass small enough to render them), so a
 * partner without a match is skipped from the map silently but always
 * counted in the footnote below it, never just dropped without a trace.
 */
export function TradeArcs({ iso3, countryName, trade }: TradeArcsProps) {
  const [flow, setFlow] = useState<Flow>('exports')

  const home = PATHS_BY_ISO3.get(iso3)
  const ink = useMemo(() => countryInk(iso3), [iso3])

  if (!trade.ok || (trade.data.exports.length === 0 && trade.data.imports.length === 0)) {
    return (
      <section className={`atlas-note ${styles.arcs}`} aria-label="Trade partner map">
        <div className="atlas-section-rule">— TRADE PARTNERS —</div>
        <p className={styles.empty}>
          No trade partner data available to map for {countryName}.
        </p>
      </section>
    )
  }

  if (!home) {
    return (
      <section className={`atlas-note ${styles.arcs}`} aria-label="Trade partner map">
        <div className="atlas-section-rule">— TRADE PARTNERS —</div>
        <p className={styles.empty}>
          {countryName} has no map geometry at this resolution, so partner lines can&apos;t be drawn.
        </p>
      </section>
    )
  }

  const partners = flow === 'exports' ? trade.data.exports : trade.data.imports
  const color = flow === 'exports' ? 'var(--note-ember)' : 'var(--note-thread)'

  const arcs: Arc[] = []
  let skipped = 0
  for (const partner of partners) {
    const path = partner.iso3 ? PATHS_BY_ISO3.get(partner.iso3) : undefined
    if (!path) {
      skipped += 1
      continue
    }
    const [x1, y1] = home.centroid
    const [x2, y2] = path.centroid
    const { cx, cy } = buildArc(x1, y1, x2, y2)
    arcs.push({ partner, x1, y1, x2, y2, cx, cy })
  }

  const maxValue = Math.max(1, ...arcs.map((a) => a.partner.value))

  return (
    <section className={`atlas-note ${styles.arcs}`} aria-label="Trade partner map">
      <div className={styles.header}>
        <div className={`atlas-section-rule ${styles.headerRule}`}>— TRADE PARTNERS —</div>
        <div className={styles.toggle} role="group" aria-label="Show exports or imports">
          <button
            type="button"
            onClick={() => setFlow('exports')}
            aria-pressed={flow === 'exports'}
            className={`${styles.toggleButton} ${flow === 'exports' ? styles.toggleButtonActive : ''}`}
          >
            Exports
          </button>
          <button
            type="button"
            onClick={() => setFlow('imports')}
            aria-pressed={flow === 'imports'}
            className={`${styles.toggleButton} ${flow === 'imports' ? styles.toggleButtonActive : ''}`}
          >
            Imports
          </button>
        </div>
      </div>

      {partners.length === 0 ? (
        <p className={styles.empty}>No {flow} partners on record for {countryName}.</p>
      ) : (
        <>
          <div className={styles.mapWrap}>
            <svg
              viewBox={WORLD_VIEWBOX}
              className={styles.svg}
              role="img"
              aria-label={`${countryName}'s top ${flow === 'exports' ? 'export' : 'import'} partners, drawn as lines on a world map`}
            >
              {COUNTRY_PATHS.map((c) => (
                <path key={c.iso3} d={c.d} className={styles.worldOutline} />
              ))}

              <path
                d={home.d}
                className={styles.homePath}
                style={{ fill: ink.hex, fillOpacity: 0.35, stroke: ink.hex }}
              />

              {arcs.map((arc, i) => {
                const weight = 0.75 + (arc.partner.value / maxValue) * 3.5
                // A single pre-joined string, not several interleaved JSX
                // children — React's server renderer special-cases <title>
                // (SVG shares the tag name with HTML's own <title>) and
                // silently emits an empty element for a multi-child title,
                // which only gets filled in on the client, tripping a
                // hydration mismatch. Plate.tsx's own countryLink title
                // dodges the same trap by building one string first.
                const titleText = `${arc.partner.name} — ${formatValue(arc.partner.value, 'currency')} (${trade.data.year})`
                return (
                  <path
                    key={`${arc.partner.iso3}-${i}`}
                    d={`M ${arc.x1} ${arc.y1} Q ${arc.cx} ${arc.cy} ${arc.x2} ${arc.y2}`}
                    pathLength={1}
                    className={styles.arcPath}
                    style={{
                      stroke: color,
                      strokeWidth: weight,
                      ['--atlas-arc-delay' as string]: `${i * 60}ms`,
                    }}
                  >
                    <title>{titleText}</title>
                  </path>
                )
              })}

              <circle cx={home.centroid[0]} cy={home.centroid[1]} r={3} className={styles.homeDot} />
              {arcs.map((arc, i) => (
                <circle
                  key={`${arc.partner.iso3}-dot-${i}`}
                  cx={arc.x2}
                  cy={arc.y2}
                  r={2}
                  className={styles.partnerDot}
                />
              ))}
            </svg>
          </div>

          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: 'var(--note-ember)' }} />
              Exports
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: 'var(--note-thread)' }} />
              Imports
            </span>
            <span className={styles.legendItem}>Line weight ∝ trade value</span>
          </div>
        </>
      )}

      {skipped > 0 && (
        <p className={`atlas-serial ${styles.footnote}`}>
          {skipped} of {partners.length} partner{partners.length === 1 ? '' : 's'} not drawn — no map location on
          file at this resolution.
        </p>
      )}
    </section>
  )
}
