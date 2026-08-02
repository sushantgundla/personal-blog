'use client'

import { guillochePath, guillocheLength } from '@/lib/atlas/guilloche'
import styles from './plate.module.css'

/**
 * The hover card that follows the pointer over the plate. Purely
 * decorative reinforcement of information already given elsewhere — the
 * hovered country's <title> carries the same facts for assistive tech —
 * so this whole card is aria-hidden and never the sole carrier of
 * anything.
 */
export interface CartoucheProps {
  iso3: string
  name: string
  primaryLabel: string
  primaryValue: string
  secondaryLabel: string
  secondaryValue: string
  x: number
  y: number
  visible: boolean
}

export function Cartouche({
  iso3,
  name,
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
  x,
  y,
  visible,
}: CartoucheProps) {
  const path = guillochePath(iso3, { size: 100 })
  const length = guillocheLength(iso3)

  return (
    <div
      aria-hidden="true"
      className={styles.cartouche}
      style={{
        transform: `translate(${x + 14}px, ${y + 14}px)`,
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width="52"
        height="52"
        className={`atlas-guilloche ${styles.cartoucheGuilloche}`}
      >
        <path
          d={path}
          className="atlas-guilloche-path"
          style={{ ['--atlas-dash-length' as string]: length }}
        />
      </svg>
      <div className={styles.cartoucheBody}>
        <div className="atlas-serial">{iso3}</div>
        <div className={`atlas-face-name ${styles.cartoucheName}`}>{name}</div>
        <div className={styles.cartoucheRow}>
          <span className="atlas-label">{primaryLabel}</span>
          <span className={`atlas-denomination ${styles.cartoucheValue}`}>{primaryValue}</span>
        </div>
        <div className={styles.cartoucheRow}>
          <span className="atlas-label">{secondaryLabel}</span>
          <span className={`atlas-denomination ${styles.cartoucheValue}`}>{secondaryValue}</span>
        </div>
        {/* The map itself has no visible chrome to say it's clickable — this
            is the affordance a visitor sees the moment they hover any
            country, on top of the cursor already changing to a pointer. */}
        <div className={styles.cartoucheHint}>Click to open its note →</div>
      </div>
    </div>
  )
}
