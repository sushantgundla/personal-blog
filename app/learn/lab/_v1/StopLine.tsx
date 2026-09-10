import type { CSSProperties } from 'react'
import type { Lesson } from '@/lib/learn'
import s from './specimen.module.css'

interface Props {
  lessons: Lesson[]
  /** Index of the lesson being read, in reading order. */
  current: number
}

/**
 * The key plan in the title block: where this sheet sits on the line.
 *
 * A detail sheet carries a reduction of the general arrangement so the
 * reader can see where they are standing, and on a lesson the general
 * arrangement is the course. This is the section's four diagram primitives
 * at the smallest scale they are drawn at — a line, a tick per stop at
 * uniform pitch, the you-are-here ring, and a capsule terminus at each end.
 *
 * It is the one drawing on a sheet that is otherwise all writing, and it
 * carries the section's one authored motion moment: the ring draws itself
 * once, on load, and then nothing on the page moves again. `.ln-draw` and
 * its reduced-motion answer are both in app/learn/learn.css.
 *
 * Decorative and never navigation: every mark is aria-hidden, and the
 * quantities beside it in the title block say the same thing in words.
 */

/* The track's own space. x is 0-100 and stretches to the cell's width
   (preserveAspectRatio="none"); y is 1:1 with CSS pixels, because the
   rail's height is fixed. Every stroke is non-scaling, so the horizontal
   stretch never thickens anything. */
const RAIL = 44
const MID = RAIL / 2
const TICK = 8

/* The ends are pulled in from the edges so the ring at the first or last
   stop stays inside the cell. */
const START = 4
const END = 96

/** The ring's own space — unstretched, so a circle stays a circle. */
const RING_BOX = 30
const RING_R = 11
/** 2 * PI * RING_R, rounded up: the dash covers the circle exactly once. */
const RING_LEN = 70

export function StopLine({ lessons, current }: Props) {
  const stops = lessons.length
  const at = (i: number) => (stops > 1 ? START + (i / (stops - 1)) * (END - START) : 50)

  return (
    <div className={s.planRail}>
      <svg
        className={s.planTrack}
        viewBox={`0 0 100 ${RAIL}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <line
          className={s.planLine}
          x1={START}
          y1={MID}
          x2={END}
          y2={MID}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Stops behind the reader are solid, the ones still ahead are
            drawn back. Order carries it as much as fill does. */}
        {lessons.map((stop, i) => (
          <line
            key={stop.slug}
            className={i <= current ? s.planTickRead : s.planTickAhead}
            x1={at(i)}
            y1={MID - TICK}
            x2={at(i)}
            y2={MID + TICK}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* Its own SVG, so the track's horizontal stretch can never squash
          the ring into an ellipse. */}
      <svg
        className={s.planRingBox}
        style={{ left: `${at(current)}%` }}
        viewBox={`0 0 ${RING_BOX} ${RING_BOX}`}
        aria-hidden="true"
        focusable="false"
      >
        <circle
          className={`ln-draw ${s.planRing}`}
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
