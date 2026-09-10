import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { Course, Lesson } from '@/lib/learn'
import s from './v4.module.css'

interface Props {
  course: Course
  lesson: Lesson
}

/**
 * The verso's running head.
 *
 * A book prints, at the top of every page, the one thing whose value never
 * changes: which work this is and where in it you are standing. That is
 * exactly what a reader who arrived here from a search result needs in
 * their first second — the course, the part, the stop of how many, and how
 * long this will take — and it is also what a reader eight minutes down a
 * seventeen-stop lesson still needs. So on the spread it is pinned, and the
 * rest of the verso scrolls under it.
 *
 * It is a running head and not a nav. There is no tree, no list of other
 * lessons, no search box. The one link on it is the course itself, which is
 * the publication this page is a page of.
 *
 * The diagram is the section's own printed signalling segment, kept at the
 * four primitives in DESIGN.md: a line in the course ink, one tick per
 * lesson at uniform pitch, capsule termini, and a bone-white you-are-here
 * ring. It is a position indicator and not navigation — the ticks are not
 * links, the SVG is aria-hidden, and every piece of meaning on the block is
 * carried in words beside it.
 *
 * Server component: nothing here needs the browser.
 */

/* The track's own coordinate space. x runs 0–100 and stretches to whatever
   the verso is wide (preserveAspectRatio="none"); y is 1:1 with CSS pixels,
   because .rail's height is fixed at RAIL. Every stroke carries
   vector-effect="non-scaling-stroke", so the horizontal stretch never
   thickens anything. */
const RAIL = 40
const MID = RAIL / 2
const TICK = 7

/** The ring's own space — unstretched, so a circle stays a circle. */
const RING_BOX = 34
const RING_R = 13
/** 2 * PI * RING_R, rounded up: the dash covers the circle exactly once. */
const RING_LEN = 82

/** Two digits, so "STOP 07 / 17" stays in one tabular column. */
function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function Plate({ course, lesson }: Props) {
  const stops = course.lessons.length
  const index = course.lessons.findIndex((candidate) => candidate.slug === lesson.slug)
  const current = index === -1 ? 0 : index

  const part = course.parts.find((candidate) => candidate.n === lesson.part)

  /** Where a stop sits along the track, as a percentage of the column. */
  const at = (i: number) => (stops > 1 ? (i / (stops - 1)) * 100 : 50)

  return (
    <div className={s.plate}>
      <p className={s.plateHead}>
        <Link href={`/learn/${course.slug}`} className={`sign ${s.line}`}>
          {course.title}
        </Link>
        {part && <span className="sign-quiet">{part.name}</span>}
      </p>

      <div className={s.rail}>
        <svg
          className={s.track}
          viewBox={`0 0 100 ${RAIL}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          {/* The line, capsule-capped at both termini. */}
          <line
            className={s.trackLine}
            x1={0}
            y1={MID}
            x2={100}
            y2={MID}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* One tick per lesson. Stops behind the reader are solid; the
              ones still ahead are drawn back. */}
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
            never squash the ring into an ellipse. This is the page's one
            authored moment of motion: .ln-draw draws it once and stops, and
            learn.css renders it already drawn under prefers-reduced-motion. */}
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

      <p className={`num ${s.plateMeta}`}>
        <span>
          STOP {pad2(current + 1)} / {pad2(stops)}
        </span>
        {lesson.minutes > 0 && <span>~{lesson.minutes} MIN</span>}
      </p>
    </div>
  )
}
