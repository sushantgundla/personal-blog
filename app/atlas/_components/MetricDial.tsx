'use client'

import type { IndicatorDef } from '@/lib/atlas/types'
import { MagneticButton } from '@/app/v4/_components/MagneticButton'
import styles from './plate.module.css'

/** The colour ramp painted west-to-east across the plate. Warm/high at one
 * end, cold/low at the other — see docs/superpowers/specs §2.1. Kept here
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

export interface MetricDialProps {
  indicators: IndicatorDef[]
  active: string | null
  onChange: (code: string | null) => void
  /** How many countries in the active ranking have no value, for the legend. */
  nodataCount: number | null
}

export function MetricDial({ indicators, active, onChange, nodataCount }: MetricDialProps) {
  return (
    <div className={styles.dial}>
      <div className="atlas-label">Paint the world</div>
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
              {indicator.label}
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
