'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useProgress } from '../../_components/useProgress'
import type { Station } from './sections'
import s from './Rail.module.css'

export interface Stop {
  slug: string
  title: string
}

interface Props {
  courseSlug: string
  /** Every stop on the line, in reading order. */
  stops: Stop[]
  /** Which of them this lesson is. */
  current: number
  prev: Stop | null
  next: Stop | null
  /** This lesson's own stops, head to checkpoint. */
  stations: Station[]
}

/**
 * The line, stood up and run down the whole height of the reading.
 *
 * The section's contract says a lesson is a stop on a line. On the page
 * this replaces, that idea got sixty-four pixels at the top and was then
 * dropped for the rest of the lesson. Here it is the furniture of the
 * page: a stroke in the course's ink pinned beside the reading column,
 * carrying the same four primitives the strip did — line, tick,
 * you-are-here ring, terminus — turned through ninety degrees.
 *
 * TWO SCALES, ONE LINE. The course is seventeen stops and this lesson is
 * one of them; the lesson is three numbered sections and the reader is
 * somewhere in one of them. Both are positions on the same journey at
 * different zoom, so the rail is drawn the way a plate draws that: the key
 * at the top is the whole line at course scale with this stop ringed, then
 * the break — two strokes at forty-five degrees across where the line
 * would run, which is what a drawing office puts where a run is shown at a
 * different scale — and below it the same line opened out, this stop and
 * nothing else. It is one drawing read twice, not two drawings side by
 * side, and it is nowhere a percentage of the page scrolled.
 *
 * THE TERMINI ARE THE NEIGHBOURS. The stop before this one is the cap at
 * the top and the stop after it the cap at the foot, both real links, so
 * walking the course is walking the line. Where there is no neighbour the
 * line simply ends: a terminus with nothing past it, drawn and not
 * clickable, because a link that goes nowhere is worse than no link.
 *
 * WHAT THE JAVASCRIPT IS FOR, AND WHAT IT IS NOT FOR. The whole drawing is
 * correct with scripting off — every stop is an anchor, the ring rests on
 * the head, the key is drawn. All the client does is move the ring between
 * stations as the reader passes them, off an IntersectionObserver on the
 * headings rather than a scroll listener, and read which lessons are
 * already done out of localStorage. Under prefers-reduced-motion the
 * observer is never created and the line stands still.
 */

/** Two digits, so a count stays in one tabular column. */
function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** The band the active stop is decided on: the top third of the window. */
const ACTIVATION = 0.3

export default function Rail({ courseSlug, stops, current, prev, next, stations }: Props) {
  const { isDone, ready } = useProgress(courseSlug)
  const [active, setActive] = useState(stations[0]?.id ?? '')

  // The ids are what the effect actually depends on; the array around them
  // is a fresh object on every render of the page above.
  const stationKey = stations.map((station) => station.id).join('|')

  useEffect(() => {
    const ids = stationKey.split('|').filter(Boolean)
    if (ids.length === 0) return

    // The brief for this candidate: under reduced motion the line is
    // static and correct rather than clever. No observer is created at
    // all, so the ring stays where the server drew it.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const marks = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (marks.length === 0) return

    // The last stop whose heading has crossed the activation line is the
    // one the reader is in. Reading a handful of rects inside the
    // observer's own callback is what keeps this off the scroll path.
    const pick = () => {
      const line = window.innerHeight * ACTIVATION
      let found = ids[0]
      for (const mark of marks) {
        if (mark.getBoundingClientRect().top <= line) found = mark.id
      }
      setActive(found)
    }

    // The root's top edge is pushed down to the activation line, so the
    // observer fires exactly when a heading crosses it — and nowhere else.
    const observer = new IntersectionObserver(pick, {
      rootMargin: `-${ACTIVATION * 100}% 0px 0px 0px`,
      threshold: 0,
    })
    marks.forEach((mark) => observer.observe(mark))
    pick()

    return () => observer.disconnect()
  }, [stationKey])

  const total = stops.length
  const span = Math.max(total - 1, 1)

  /** Where a station sits between the two termini, at uniform pitch. */
  const stationAt = (i: number) => ((i + 1) / (stations.length + 1)) * 100
  const activeIndex = stations.findIndex((station) => station.id === active)
  const ringAt = stationAt(activeIndex === -1 ? 0 : activeIndex)

  return (
    <nav className={s.rail} aria-label="Position on the line">
      <div className={s.pinned}>
        {/* The key: the whole line at course scale. It is a drawing and
            nothing else — the head of the reading column already says
            which course this is and which stop of how many, so repeating
            it here would only make a screen reader hear it twice. */}
        <div
          className={s.key}
          style={{ height: `calc(var(--v2-pitch) * ${span} + 2px)` }}
          aria-hidden="true"
        >
          <svg
            className={s.spine}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            focusable="false"
          >
            <line
              className={s.keyStroke}
              x1={72}
              y1={0}
              x2={72}
              y2={100}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {stops.map((stop, i) => (
            <span
              key={stop.slug}
              className={`${s.keyTick} ${ready && isDone(stop.slug) ? s.read : s.ahead}`}
              style={{ top: `calc((100% - 2px) * ${i / span})` }}
            />
          ))}

          <svg
            className={s.keyRing}
            style={{ top: `calc((100% - 2px) * ${current / span} + 1px)` }}
            viewBox="0 0 48 48"
            focusable="false"
          >
            <circle className={s.keyRingStroke} cx={24} cy={24} r={19} fill="none" />
          </svg>
        </div>

        <p className={`num ${s.count}`} aria-hidden="true">
          {pad2(current + 1)} / {pad2(total)}
        </p>

        {/* The break. Same line, larger scale below it. */}
        <div className={s.break} aria-hidden="true">
          <span className={s.breakMark} />
          <span className={s.breakMark} />
        </div>

        {/* The detail: this stop, opened out. */}
        <div className={s.detail}>
          <svg
            className={s.spine}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            focusable="false"
          >
            <line
              className={s.lineStroke}
              x1={72}
              y1={0}
              x2={72}
              y2={100}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {prev ? (
            <Link
              href={`/learn/${courseSlug}/${prev.slug}`}
              className={`${s.terminus} ${s.tTop}`}
              rel="prev"
            >
              <span className={s.sr}>Last stop: {prev.title}</span>
              <span className={s.word} data-word="true" aria-hidden="true">
                LAST
                <br />
                STOP
              </span>
            </Link>
          ) : null}

          {stations.map((station, i) => {
            const here = station.id === active
            return (
              <a
                key={station.id}
                href={`#${station.id}`}
                className={s.stop}
                style={{ top: `${stationAt(i)}%` }}
                aria-current={here ? 'true' : undefined}
              >
                <span className={s.sr}>{station.name}</span>
                {station.tag && (
                  <span
                    className={station.tag.length > 2 ? s.word : `num ${s.tag}`}
                    data-word={station.tag.length > 2 ? 'true' : undefined}
                    aria-hidden="true"
                  >
                    {station.tag}
                  </span>
                )}
                <span className={s.tick} aria-hidden="true" />
              </a>
            )
          })}

          {next ? (
            <Link
              href={`/learn/${courseSlug}/${next.slug}`}
              className={`${s.terminus} ${s.tEnd}`}
              rel="next"
            >
              <span className={s.sr}>Next stop: {next.title}</span>
              <span className={s.word} data-word="true" aria-hidden="true">
                NEXT
                <br />
                STOP
              </span>
            </Link>
          ) : null}

          {/* You are here. Its own box, so the spine's vertical stretch can
              never squash the ring into an ellipse. It travels between
              stops rather than appearing on one. */}
          <svg
            className={s.ring}
            style={{ top: `${ringAt}%` }}
            viewBox="0 0 48 48"
            aria-hidden="true"
            focusable="false"
          >
            <circle className={s.ringStroke} cx={24} cy={24} r={20} fill="none" />
          </svg>
        </div>
      </div>
    </nav>
  )
}
