import type { CSSProperties } from 'react'
import s from './worksheet.module.css'

/**
 * The signalling diagram, at instrument scale.
 *
 * A lesson really does have a position on a line, so the sheet keeps the
 * printed diagram — but on a worksheet it is a scale bar in the header,
 * not a banner. Same four primitives as everywhere else in the section:
 * the line in the course ink, one tick per lesson at uniform pitch, solid
 * behind the reader and drawn back ahead of them, capsule termini, and the
 * one hollow you-are-here ring.
 *
 * It is a position indicator and not navigation: nothing here is a link,
 * the whole thing is aria-hidden, and the figures column beside it says
 * STOP 07 / 17 in words. The ring drawing itself once on load is the
 * sheet's one authored moment, and `prefers-reduced-motion` renders it
 * already drawn (see the .ln-draw rules in learn.css).
 */

/* The track's own space. x is 0–100 and stretches to the header cell's
   width; y is 1:1 with CSS pixels, because .track's height is fixed. Every
   stroke is non-scaling, so the horizontal stretch never thickens a tick. */
const RAIL = 40
const MID = RAIL / 2
const TICK = 8

/** The ring's own box — unstretched, so a circle stays a circle. */
const RING_BOX = 30
const RING_R = 11
/** 2 * PI * RING_R, rounded up: the dash covers the circle exactly once. */
const RING_LEN = 70

interface Props {
  /** Every lesson on the line. */
  stops: string[]
  /** Zero-based index of the lesson being read. */
  current: number
}

export function Track({ stops, current }: Props) {
  const count = stops.length

  /** Where a stop sits along the track, as a percentage of the cell. */
  const at = (i: number) => (count > 1 ? (i / (count - 1)) * 100 : 50)

  return (
    <div className={s.track}>
      <svg
        className={s.trackSvg}
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

        {stops.map((slug, i) => (
          <line
            key={slug}
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
          never squash the ring into an ellipse. */}
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
