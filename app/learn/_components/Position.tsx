import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { Course, Lesson } from '@/lib/learn'
import styles from './Position.module.css'

interface Props {
  course: Course
  lesson: Lesson
  prev: Lesson | null
  next: Lesson | null
}

/**
 * The platform sign at the top of a lesson.
 *
 * Most readers arrive here from a search result, on a page in the middle of
 * a course they have never heard of. This strip answers the three questions
 * they have before they decide to stay: which line they are on, which zone
 * of it, and how far along.
 *
 * The band runs edge to edge so its hairline spans the window, but
 * everything inside it sits in .measure — the same reading column as the
 * title below, to the pixel. A strip that starts at a different x than the
 * h1 reads as a broken fragment rather than a sign for this page. It does
 * not use .bleed: that class adds a gutter of its own, and a .measure
 * nested inside it ends up inset twice on a narrow screen.
 *
 * The diagram is a segment of the line spanning the whole column: one tick
 * per lesson at uniform pitch, the current one ringed. It is a position
 * indicator, not navigation — the ticks are not links, the SVG is
 * aria-hidden, and the text around it carries every piece of meaning.
 */

/* The track's own coordinate space. x is 0–100 and stretches to whatever
   the column is wide (preserveAspectRatio="none"); y is 1:1 with CSS
   pixels, because the rail's height is fixed at RAIL. Every stroke uses
   vector-effect="non-scaling-stroke", so the horizontal stretch never
   thickens anything. */
const RAIL = 64
const MID = RAIL / 2
const TICK = 12

/** The ring's own space — unstretched, so a circle stays a circle. */
const RING_BOX = 48
const RING_R = 20
/** 2 * PI * RING_R, rounded up: the dash covers the circle exactly once. */
const RING_LEN = 126

/** Two digits, so "STOP 07 / 12" stays in one tabular column. */
function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function Position({ course, lesson, prev, next }: Props) {
  const stops = course.lessons.length
  const index = course.lessons.findIndex((candidate) => candidate.slug === lesson.slug)
  const current = index === -1 ? 0 : index

  const part = course.parts.find((candidate) => candidate.n === lesson.part)

  /** Where a stop sits along the track, as a percentage of the column. */
  const at = (i: number) => (stops > 1 ? (i / (stops - 1)) * 100 : 50)

  return (
    <div className={styles.strip}>
      <div className={`measure ${styles.inner}`}>
        <p className={styles.head}>
          <Link href={`/learn/${course.slug}`} className={`sign ${styles.line}`}>
            {course.title}
          </Link>
          {part && <span className="sign-quiet">{part.name}</span>}
        </p>

        <div className={styles.rail}>
          <svg
            className={styles.track}
            viewBox={`0 0 100 ${RAIL}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            {/* The line itself, capsule-capped at both termini. */}
            <line
              className={styles.trackLine}
              x1={0}
              y1={MID}
              x2={100}
              y2={MID}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* One tick per lesson. Stops behind the reader are solid; the
                ones still ahead are drawn back. Order carries this as much
                as fill does, so it never rests on colour. */}
            {course.lessons.map((stop, i) => (
              <line
                key={stop.slug}
                className={i <= current ? styles.tickRead : styles.tickAhead}
                x1={at(i)}
                y1={MID - TICK}
                x2={at(i)}
                y2={MID + TICK}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {/* You are here. Its own SVG, so the track's horizontal stretch
              can never squash the ring into an ellipse, and so it is the
              loudest mark on the strip. This is the section's one authored
              motion moment: .ln-draw draws it once and stops. */}
          <svg
            className={styles.ringBox}
            style={{ left: `${at(current)}%` }}
            viewBox={`0 0 ${RING_BOX} ${RING_BOX}`}
            aria-hidden="true"
            focusable="false"
          >
            <circle
              className={`ln-draw ${styles.ring}`}
              style={{ '--ln-draw-len': RING_LEN } as CSSProperties}
              cx={RING_BOX / 2}
              cy={RING_BOX / 2}
              r={RING_R}
              fill="none"
            />
          </svg>
        </div>

        <p className={`num ${styles.meta}`}>
          <span>
            STOP {pad2(current + 1)} / {pad2(stops)}
          </span>
          {lesson.minutes > 0 && <span>~{lesson.minutes} MIN</span>}
        </p>

        {/* The stops either side. Plain text, and hidden from screen
            readers: PrevNext at the foot of the page gives the same two
            titles as real links inside a labelled nav, so announcing them
            here as well would only read the lesson names twice. */}
        {(prev || next) && (
          <p className={`sign-quiet ${styles.ends}`} aria-hidden="true">
            {prev && <span>Last stop: {prev.title}</span>}
            {next && <span>Next stop: {next.title}</span>}
          </p>
        )}
      </div>
    </div>
  )
}
