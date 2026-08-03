'use client'

import type { IndicatorDef } from '@/lib/atlas/types'
import { MagneticButton } from '@/app/v4/_components/MagneticButton'
import styles from './plate.module.css'

/** The colour ramp painted west-to-east across the plate. Warm/high at one
 * end, cold/low at the other — see docs/atlas/design.md §2.1. Kept here
 * (rather than in ink.ts, which is per-country hue, not per-value) because
 * it is a rendering concern of the dial + Plate, not the design-token layer. */
export const METRIC_RAMP = [
  '#FFB07A',
  '#FF8A4C',
  '#FF6B2B',
  '#C1662F',
  '#8A4A28',
  '#4E5F6B',
  '#3A4A55',
] as const

/** Display-only shortenings for the two labels too long to sit in a single
 * thin bar — lib/atlas/indicators.ts's own `label` is shared with the rank
 * rail header, the rankings page title, etc., so it isn't touched here;
 * this is purely how the dial's own chip reads. Codes not listed just use
 * indicator.label as-is. */
const SHORT_LABELS: Record<string, string> = {
  'AG.LND.FRST.ZS': 'Forest cover',
  'EN.GHG.CO2.PC.CE.AR5': 'CO₂ per person',
}

export interface MetricDialProps {
  indicators: IndicatorDef[]
  active: string | null
  onChange: (code: string | null) => void
  /** How many countries in the active ranking have no value, for the legend. */
  nodataCount: number | null
}

/**
 * Fixed 2026-08-03: this used to be its own floating panel — first in the
 * rail, then a bordered card over the map's top-left corner. The owner
 * looked at the latter and said plainly he didn't want a "rectangle";
 * he wanted a thin bar in the map's own top furniture strip, in the gap
 * between the (now-deleted) serial number and the country counts — see
 * Plate.tsx's .furnitureRow. This component itself still only needs
 * active/onChange/nodataCount; the sweep/paint logic in Plate.tsx never
 * changed across any of these moves.
 */
export function MetricDial({ indicators, active, onChange, nodataCount }: MetricDialProps) {
  return (
    <div className={styles.dial}>
      <span className="atlas-label" style={{ flex: 'none' }}>
        Paint the world
      </span>
      <div className={styles.dialChips} role="group" aria-label="Choose an indicator to colour the map">
        <MagneticButton className="atlas-magnetic" strength={0.2}>
          <button
            type="button"
            className={`${styles.dialChip} ${active === null ? styles.dialChipActive : ''}`}
            aria-pressed={active === null}
            onClick={() => onChange(null)}
          >
            No colour
          </button>
        </MagneticButton>
        {indicators.map((indicator) => (
          <MagneticButton key={indicator.code} className="atlas-magnetic" strength={0.2}>
            <button
              type="button"
              className={`${styles.dialChip} ${active === indicator.code ? styles.dialChipActive : ''}`}
              aria-pressed={active === indicator.code}
              onClick={() => onChange(indicator.code)}
            >
              {SHORT_LABELS[indicator.code] ?? indicator.label}
            </button>
          </MagneticButton>
        ))}
      </div>

      {active !== null && (
        <div className={styles.legend}>
          <span className="atlas-label" style={{ letterSpacing: '0.1em' }}>
            High
          </span>
          <div className={styles.legendRamp} aria-hidden="true">
            {METRIC_RAMP.map((color) => (
              <span key={color} className={styles.legendStop} style={{ background: color }} />
            ))}
          </div>
          <span className="atlas-label" style={{ letterSpacing: '0.1em' }}>
            Low
          </span>
          <span className={styles.legendNodata} aria-hidden="true" />
          <span className="atlas-label" style={{ letterSpacing: '0.1em' }}>
            {nodataCount === null
              ? 'No data — unknown count'
              : `No data for ${nodataCount} ${nodataCount === 1 ? 'country' : 'countries'}`}
          </span>
        </div>
      )}
    </div>
  )
}
