'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { guillochePath, guillocheLength } from '@/lib/atlas/guilloche'
import styles from './plate.module.css'

/**
 * The hover card that follows the pointer over the plate. Purely
 * decorative reinforcement of information already given elsewhere — the
 * hovered country's <title> carries the same facts for assistive tech —
 * so this whole card is aria-hidden and never the sole carrier of
 * anything.
 *
 * Fixed 2026-08-03: this used to always sit below-and-right of the cursor
 * (`translate(x+14, y+14)`), unclamped — hovering anything near the map's
 * bottom or right edge (Antarctica, the far east of the map) pushed it
 * partly or entirely past `.mapWrap`'s own bounds, where its
 * `overflow: hidden` (added for the zoom/pan clipping) just cuts it off.
 * Now it measures its own rendered size against the container each time
 * `x`/`y`/content change, and flips to whichever side actually has room —
 * below/above, right/left — clamping as a last resort so it can never go
 * negative either. `x`/`y` themselves already come from Plate.tsx correct
 * for any zoom/pan level (mouse position, or `getScreenCTM()` for the
 * keyboard-focus case) — this only decides which side of that point the
 * card renders on, so it stays correct at any zoom/pan for free.
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
  /** The map viewport to measure against — not the browser window. The
   * card is confined to `.mapWrap` (its `overflow: hidden` would clip it
   * regardless of what the browser window itself has room for), so that's
   * the bounds that actually matter. */
  containerRef: React.RefObject<HTMLDivElement | null>
}

const GAP = 14

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
  containerRef,
}: CartoucheProps) {
  const path = guillochePath(iso3, { size: 100 })
  const length = guillocheLength(iso3)

  const cardRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: x + GAP, top: y + GAP })

  // Layout, not a plain effect: this has to measure and reposition before
  // the browser paints, or the card would visibly jump from its old corner
  // to its new one on every flip instead of just appearing in the right
  // place.
  useLayoutEffect(() => {
    const card = cardRef.current
    const container = containerRef.current
    if (!card || !container) {
      setPos({ left: x + GAP, top: y + GAP })
      return
    }
    const cardW = card.offsetWidth
    const cardH = card.offsetHeight
    const boundsW = container.clientWidth
    const boundsH = container.clientHeight

    const overflowsRight = x + GAP + cardW > boundsW
    const overflowsBottom = y + GAP + cardH > boundsH
    const left = overflowsRight ? Math.max(0, x - GAP - cardW) : x + GAP
    const top = overflowsBottom ? Math.max(0, y - GAP - cardH) : y + GAP

    setPos({ left, top })
    // Re-run per hovered country (iso3) too, not just x/y — a longer name
    // or value can change the card's own width/height at the same cursor
    // position, which can flip the decision even though x/y didn't move.
  }, [x, y, iso3, primaryValue, secondaryValue, containerRef])

  return (
    <div
      ref={cardRef}
      aria-hidden="true"
      className={styles.cartouche}
      style={{
        transform: `translate(${pos.left}px, ${pos.top}px)`,
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
