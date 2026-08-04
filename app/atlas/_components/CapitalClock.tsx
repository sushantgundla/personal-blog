'use client'

import { useEffect, useMemo, useState } from 'react'
import { capitalTimezone } from '@/lib/atlas/capital-timezones'
import styles from './extras.module.css'

export interface CapitalClockProps {
  capital: string | null
  coordinates: { lat: number; lng: number } | null
  /** ISO3 of the country, used to look up the capital's real timezone. */
  iso3?: string | null
}

/**
 * Live local time at the capital.
 *
 * The time comes from `Intl.DateTimeFormat` with the capital's IANA timezone
 * (see lib/atlas/capital-timezones.ts). Every browser already ships the full
 * timezone database, so this costs no npm dependency and no fetch, and it
 * gets right everything a longitude guess got wrong: half-hour and 45-minute
 * zones (India UTC+5:30, Nepal UTC+5:45), daylight saving, and political
 * zones that ignore solar longitude (Madrid sits west of Greenwich but runs
 * on Central European Time).
 *
 * The offset label comes from the SAME formatter call, via
 * `timeZoneName: 'shortOffset'`, rather than being computed separately. That
 * way the clock and its label physically cannot disagree, and the label
 * automatically reads the summer-time offset while summer time is in force.
 *
 * Fallback: if an ISO3 has no entry in the map, or the zone string is one
 * this browser's timezone database does not know, we drop back to the old
 * approximation — the offset guessed from the capital's longitude at 15
 * degrees per hour — and label it "approx." so the reading is not passed off
 * as exact. The try/catch matters: an unrecognised zone throws a RangeError,
 * and an unhandled throw in a client component would take the whole dossier
 * page down over a clock.
 *
 * The clock never causes a hydration mismatch: the very first render (server
 * and client alike) shows a fixed placeholder with no live clock reading, and
 * only after mount does an effect start a once-a-second interval using the
 * browser's own clock, cleaned up on unmount.
 */
export function CapitalClock({ capital, coordinates, iso3 }: CapitalClockProps) {
  const [now, setNow] = useState<Date | null>(null)

  // Building a DateTimeFormat is not free, and this renders once a second,
  // so the two formatters are built once per timezone and reused. Both are
  // built inside one try/catch: if the zone is bad we want neither, and the
  // null result is exactly what makes the render fall back to longitude.
  const formatters = useMemo(() => buildFormatters(capitalTimezone(iso3)), [iso3])

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

  const reading = now ? read(now, formatters, coordinates.lng) : null

  return (
    <div className={styles.utilityNote}>
      <span className="atlas-label">Capital time</span>
      <div className={styles.clockFace}>
        <span className={styles.clockTime} aria-live={now ? 'polite' : undefined}>
          {reading ? reading.time : '--:--:--'}
        </span>
        <span className="atlas-serial">
          <span className={styles.clockCapital}>{capital}</span> ·{' '}
          {reading ? reading.label : approxLabel(coordinates.lng)}
        </span>
      </div>
    </div>
  )
}

interface ClockFormatters {
  time: Intl.DateTimeFormat
  offset: Intl.DateTimeFormat
}

/**
 * Two formatters for one zone, or null if the zone is missing or the browser
 * rejects it. Kept as a plain function so the failure path is one `return
 * null` rather than a thrown error escaping into React's render.
 */
function buildFormatters(timeZone: string | null): ClockFormatters | null {
  if (!timeZone) return null
  try {
    return {
      time: new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
      offset: new Intl.DateTimeFormat('en-GB', { timeZone, timeZoneName: 'shortOffset' }),
    }
  } catch {
    return null
  }
}

/**
 * The rendered time and its offset label. Uses the real timezone when we
 * have one, otherwise the longitude approximation.
 */
function read(
  utcNow: Date,
  formatters: ClockFormatters | null,
  lng: number,
): { time: string; label: string } {
  if (formatters) {
    try {
      return {
        time: formatters.time.format(utcNow),
        label: offsetLabel(formatters.offset, utcNow),
      }
    } catch {
      // Extremely unlikely once construction succeeded, but a formatting
      // throw must not take the page down either.
    }
  }
  const offsetHours = approxOffsetHours(lng)
  return { time: formatApprox(utcNow, offsetHours), label: approxLabel(lng) }
}

/**
 * "UTC+5:30" for the given instant. `shortOffset` returns it in GMT form
 * ("GMT+5:30", or bare "GMT" at zero), so we normalise to the UTC wording
 * the panel has always used.
 */
function offsetLabel(formatter: Intl.DateTimeFormat, utcNow: Date): string {
  const part = formatter.formatToParts(utcNow).find((p) => p.type === 'timeZoneName')
  if (!part) return 'UTC'
  if (part.value === 'GMT') return 'UTC+0'
  return part.value.replace('GMT', 'UTC')
}

/** Solar-time guess: 15 degrees of longitude per hour, clamped to real limits. */
function approxOffsetHours(lng: number): number {
  return Math.max(-12, Math.min(14, Math.round(lng / 15)))
}

function approxLabel(lng: number): string {
  const offsetHours = approxOffsetHours(lng)
  return `approx. UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`
}

function formatApprox(utcNow: Date, offsetHours: number): string {
  const shifted = new Date(utcNow.getTime() + offsetHours * 3600_000)
  const hh = String(shifted.getUTCHours()).padStart(2, '0')
  const mm = String(shifted.getUTCMinutes()).padStart(2, '0')
  const ss = String(shifted.getUTCSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}
