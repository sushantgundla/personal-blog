import type { CSSProperties } from 'react'
import type { Course } from '@/lib/learn'
import s from './v3.module.css'

/**
 * The rule under the lesson title — and the only place course ink
 * touches this page.
 *
 * It is not a bar. It is the lesson's own stop on the line: the course
 * stroke spanning the reading column, one tick per lesson at uniform
 * pitch, solid for the stops behind the reader and drawn back for the
 * ones ahead, with the you-are-here ring on this one. The four diagram
 * primitives in DESIGN.md and nothing else — no new shape is invented
 * here.
 *
 * One mark doing three jobs: it is the rule the title needs, it is the
 * signalling diagram a lesson keeps, and it is the position. That is the
 * whole reason this candidate can drop the position strip without
 * dropping anything a reader needs.
 *
 * A position indicator, not navigation: the ticks are not links, the SVG
 * is aria-hidden, and the figures printed under it carry the same facts
 * in words. Server component.
 */

/* The track's own space. x is 0-100 and stretches to the column
   (preserveAspectRatio="none"); y is 1:1 with CSS pixels, because the
   rail's height is fixed. Every stroke is non-scaling, so the horizontal
   stretch never thickens anything. */
const RAIL = 44
const MID = RAIL / 2
const TICK = 10

/** The ring's own space — unstretched, so a circle stays a circle. */
const RING_BOX = 32
const RING_R = 13
/** 2 * PI * RING_R, rounded up: the dash covers the circle exactly once. */
const RING_LEN = 82

export function Line({ course, current }: { course: Course; current: number }) {
  const stops = course.lessons.length

  /** Where a stop sits along the track, as a percentage of the column. */
  const at = (i: number) => (stops > 1 ? (i / (stops - 1)) * 100 : 50)

  return (
    <div className={s.rail}>
      <svg
        className={s.track}
        viewBox={`0 0 100 ${RAIL}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <line
          className={s.trackLine}
          x1={0}
          y1={MID}
          x2={100}
          y2={MID}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {course.lessons.map((stop, i) => (
          <line
            key={stop.slug}
            className={i <= current ? s.tickRead : s.tickAhead}
            x1={at(i)}
            y1={MID - TICK}
            x2={at(i)}
            y2={MID + TICK}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* You are here. Its own SVG, so the track's horizontal stretch can
          never squash the ring into an ellipse. This is the section's one
          authored moment: .ln-draw draws it once, on load, and stops.
          learn.css renders it fully drawn under prefers-reduced-motion. */}
      <svg
        className={s.ringBox}
        style={{ left: `${at(current)}%` }}
        viewBox={`0 0 ${RING_BOX} ${RING_BOX}`}
        aria-hidden="true"
        focusable="false"
      >
        <circle
          className={`ln-draw ${s.ring}`}
          style={{ '--ln-draw-len': RING_LEN } as CSSProperties}
          cx={RING_BOX / 2}
          cy={RING_BOX / 2}
          r={RING_R}
          fill="none"
        />
      </svg>
    </div>
  )
}
