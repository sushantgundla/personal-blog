'use client'

import { useEffect, useState } from 'react'
import styles from './extras.module.css'

export interface CapitalClockProps {
  capital: string | null
  coordinates: { lat: number; lng: number } | null
}

/**
 * Live local time at the capital. There is no timezone field on
 * WikidataFacts and no timezone database ships with the app (no npm
 * dependencies allowed), so the offset is approximated from the capital's
 * longitude at 15 degrees per hour of solar time, rounded to the nearest
 * whole hour. This will drift from the real, politically-defined timezone
 * for places on a half-hour or 45-minute offset (India, Nepal) or a zone
 * that leans well outside its solar band (China's single UTC+8), but it
 * needs no fetch, no dependency, and is honestly labelled "approx."
 *
 * The clock itself never causes a hydration mismatch: the very first
 * render (server and client alike) shows a fixed placeholder with no
 * live clock reading, and only after mount does an effect start a
 * once-a-second interval using the browser's own clock, cleaned up on
 * unmount.
 */
export function CapitalClock({ capital, coordinates }: CapitalClockProps) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    if (!coordinates) return
    const tick = () => setNow(new Date())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [coordinates])

  if (!capital || !coordinates) {
    return (
      <div className={styles.utilityNote}>
        <span className="atlas-label">Capital time</span>
        <div className={styles.emptyState}>No capital coordinates on file</div>
      </div>
    )
  }

  const offsetHours = Math.max(-12, Math.min(14, Math.round(coordinates.lng / 15)))
  const offsetLabel = `UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`

  return (
    <div className={styles.utilityNote}>
      <span className="atlas-label">Capital time</span>
      <div className={styles.clockFace}>
        <span className={styles.clockTime} aria-live={now ? 'polite' : undefined}>
          {now ? formatLocal(now, offsetHours) : '--:--:--'}
        </span>
        <span className="atlas-serial">
          <span className={styles.clockCapital}>{capital}</span> · approx. {offsetLabel}
        </span>
      </div>
    </div>
  )
}

function formatLocal(utcNow: Date, offsetHours: number): string {
  const shifted = new Date(utcNow.getTime() + offsetHours * 3600_000)
  const hh = String(shifted.getUTCHours()).padStart(2, '0')
  const mm = String(shifted.getUTCMinutes()).padStart(2, '0')
  const ss = String(shifted.getUTCSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}
