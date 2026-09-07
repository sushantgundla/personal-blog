'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { LineCourse } from './line-data'
import { useProgress } from './useProgress'
import styles from './Line.module.css'

/**
 * One course drawn as a signalling line: a stroke, one perpendicular tick
 * per lesson at uniform pitch, a capsule terminus at each end.
 *
 * Two layers, deliberately:
 *
 *   - an inline SVG for every stroke — the rail, the zone hairlines, the
 *     termini. It is aria-hidden and takes no pointer events.
 *   - real HTML on top for the ticks, the labels and the links, so the
 *     text reflows, selects, and carries the semantics.
 *
 * The diagram rotates, it does not shrink. Wide: the line runs across with
 * labels under it. Below 52rem: the line runs down the page with labels to
 * its right. That switch is pure CSS — one DOM, one React tree — and the
 * labels stay horizontal at every size.
 *
 * The one thing the SVG cannot express in a single element is which axis is
 * long, so the strokes exist twice inside it, as `axisH` and `axisV`, and
 * the media query shows one of them. Four hidden aria-hidden shapes is a
 * cheaper price than two component trees that could drift apart.
 */

/**
 * Where the line changes zone, as a percentage along its length.
 *
 * Ticks sit at the centre of equal cells, so cell `i` starts at `i / n` of
 * the way along — which is exactly where the hairline between two zones
 * belongs. The first zone gets a label at 0% but no hairline: there is
 * nothing on the far side of it to divide from.
 */
interface Zone {
  at: number
  name: string
  rule: boolean
}

function zonesOf(course: LineCourse): Zone[] {
  const named = new Map(course.parts.map((part) => [part.n, part.name]))
  const total = course.stops.length
  const zones: Zone[] = []

  course.stops.forEach((stop, index) => {
    if (index > 0 && stop.part === course.stops[index - 1].part) return

    const name = named.get(stop.part)
    if (!name) return

    zones.push({ at: (index / total) * 100, name, rule: index > 0 })
  })

  return zones
}

interface Props {
  course: LineCourse
  /** `network` is the compact index line; `full` is the course's own page. */
  variant: 'network' | 'full'
}

export function Line({ course, variant }: Props) {
  const { isDone, ready } = useProgress(course.slug)

  const stops = course.stops
  const total = stops.length
  if (total === 0) return null

  // Until localStorage has been read, every stop renders unread — which is
  // what the server rendered, so the first client render matches it.
  const read = ready ? stops.filter((stop) => isDone(stop.slug)).length : 0

  const zones = variant === 'full' ? zonesOf(course) : []
  const full = variant === 'full'

  return (
    <section
      className={`${styles.line} ${full ? styles.full : styles.network}`}
      data-line={course.slug}
      aria-label={full ? undefined : course.title}
    >
      {full ? null : (
        <header className={styles.head}>
          <h2 className={styles.headTitle}>
            <Link href={`/learn/${course.slug}`} className={styles.headLink}>
              {course.title}
            </Link>
          </h2>
          <p className={styles.headMeta}>
            <span className="num">
              {total} {total === 1 ? 'STOP' : 'STOPS'}
            </span>
          </p>
        </header>
      )}

      <div className={styles.diagram}>
        {/* Strokes only. No viewBox, so a percentage resolves against this
            element's own box and the geometry follows the layout for free. */}
        <svg className={styles.track} aria-hidden="true" focusable="false">
          <g className={styles.axisH}>
            <line className={styles.rail} x1="0" y1="50%" x2="100%" y2="50%" />
            {zones
              .filter((zone) => zone.rule)
              .map((zone) => (
                <line
                  key={zone.at}
                  className={styles.division}
                  x1={`${zone.at}%`}
                  y1="0"
                  x2={`${zone.at}%`}
                  y2="100%"
                />
              ))}
            <rect
              className={styles.terminus}
              x="0"
              y="50%"
              width="12"
              height="22"
              rx="6"
              transform="translate(0 -11)"
            />
            <rect
              className={styles.terminus}
              x="100%"
              y="50%"
              width="12"
              height="22"
              rx="6"
              transform="translate(-12 -11)"
            />
          </g>

          <g className={styles.axisV}>
            <line className={styles.rail} x1="50%" y1="0" x2="50%" y2="100%" />
            {zones
              .filter((zone) => zone.rule)
              .map((zone) => (
                <line
                  key={zone.at}
                  className={styles.division}
                  x1="0"
                  y1={`${zone.at}%`}
                  x2="100%"
                  y2={`${zone.at}%`}
                />
              ))}
            <rect
              className={styles.terminus}
              x="50%"
              y="0"
              width="22"
              height="12"
              rx="6"
              transform="translate(-11 0)"
            />
            <rect
              className={styles.terminus}
              x="50%"
              y="100%"
              width="22"
              height="12"
              rx="6"
              transform="translate(-11 -12)"
            />
          </g>
        </svg>

        {zones.map((zone) => (
          <span
            key={zone.at}
            className={styles.zone}
            style={{ '--at': `${zone.at}%` } as CSSProperties}
          >
            <span className="sign-quiet">{zone.name}</span>
          </span>
        ))}

        <ol className={styles.stops} style={{ '--n': total } as CSSProperties}>
          {stops.map((stop) => {
            const done = ready && isDone(stop.slug)

            return (
              <li key={stop.slug} className={styles.stop} data-read={done ? 'true' : 'false'}>
                <Link href={`/learn/${course.slug}/${stop.slug}`} className={styles.stopLink}>
                  <span className={styles.mark}>
                    <svg className={styles.tick} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <rect className={styles.tickBar} x="8" y="1" width="8" height="22" />
                    </svg>
                  </span>

                  <span className={styles.label}>
                    <span className={styles.stopNum}>
                      <span className="num">{String(stop.order).padStart(2, '0')}</span>
                    </span>
                    <span className={styles.stopTitle}>{stop.title}</span>
                    {full && stop.subtitle ? (
                      <span className={styles.stopSub}>{stop.subtitle}</span>
                    ) : null}
                    {full && stop.minutes > 0 ? (
                      <span className={styles.stopMeta}>
                        <span className="num">{stop.minutes} MIN</span>
                      </span>
                    ) : null}
                    {/* Read and unread differ in fill, not hue, so a screen
                        reader needs the state said out loud. */}
                    {done ? <span className={styles.state}> — read</span> : null}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      </div>

      {full ? (
        <p className={styles.count}>
          <span className="num">
            {read} / {total} STOPS READ
          </span>
        </p>
      ) : null}
    </section>
  )
}
