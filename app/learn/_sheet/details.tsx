import type { CSSProperties, ReactNode } from 'react'
import type { KeyBox } from './KeyPlan'

/* Re-exported so a per-course file has one place to import its contract
   from, rather than reaching past this module into ./KeyPlan. */
export type { KeyBox }
import { detail as agentsDetail } from './details/agents'
import { detail as evalsDetail } from './details/evals'
import { detail as llmsDetail } from './details/llms'
import { detail as promptDetail } from './details/prompt-engineering'
import { detail as ragDetail } from './details/rag'
import s from './sheet.module.css'

/**
 * FIG. 2 — the five details.
 *
 * Each one is this course's own part of FIG. 1, redrawn at a larger scale
 * with the annotation there was no room for on the general arrangement.
 * Same pens, same meanings: solid carries the request, dashed only happens
 * if the model calls a tool, dotted watches and carries nothing, thin is
 * detail and hair is texture. A fourth meaning is not invented here either.
 *
 * "Detail at larger scale" means more of the subject, not the same amount
 * bigger. FIG. 1 carries fifteen labelled features across the whole
 * machine; each drawing below carries fourteen to twenty across one part of
 * it, and every one of them is something the course actually teaches — the
 * features were chosen by reading the lesson titles and subtitles in
 * content/learn/<slug>/, so a reader who has taken the course should
 * recognise its contents in the drawing.
 *
 * Two things a detail sheet is allowed that the general arrangement is not,
 * and both are used:
 *
 *   - It may show a part the general arrangement had no corridor for: the
 *     validation valve, the chunker, the rate-limit funnel, the tool bus,
 *     the drift chart. All are real parts of a real system.
 *   - It may use a weight more than once where that weight is the subject.
 *     The evals detail taps the live line twice, because on that sheet the
 *     dotted line is the thing being detailed rather than an aside on
 *     somebody else's drawing.
 *
 * One weight is deliberately borrowed rather than invented. A retry, an
 * iterative second search and a re-test after a model swap are all
 * conditional paths, and dashed is spoken for — it means "only if the model
 * calls a tool". They are drawn at `.thin`, the detail weight, and labelled
 * in words. That is the same trade DESIGN.md already records for the
 * struck-out retrieval candidate, which is drawn weak rather than dashed.
 *
 * Every drawing is divided into bays, one per part of the course, and the
 * bay carries the part's own callout ring. That is the answer to the
 * seventeen-lessons problem: the lessons are not seventeen callouts on one
 * drawing, they are the schedule under four callouts.
 *
 * Bays are keyed by position, not by a number written here: `k.zone(0)` is
 * whatever number the course's first part carries on disk. So renaming or
 * renumbering a part in course.json moves the ring with it, and a course
 * that grows a fifth part gets a fifth schedule column with no ring and the
 * words "Not on the detail" — the same visible failure buildStages() uses
 * on the index.
 *
 * Each drawing carries its own hand-authored viewBox and they are not the
 * same size — 1200 x 428, 460, 520, 533 and 560. Nothing here or on the
 * sheet may assume one: a `Detail` does not declare its dimensions and does
 * not need to, because an inline SVG with a viewBox and no width/height
 * attributes already exposes that viewBox to CSS as its intrinsic aspect
 * ratio. The sheet sets the drawing's width and lets the height follow.
 *
 * **Keep the viewBox 1200 units wide.** That is the one dimension a new
 * drawing may not choose freely. Every label is 15 units, the sheet fixes
 * the rendered width, so a label's size on screen is the box width over the
 * viewBox width and nothing else: at 1200 all five letter identically, and
 * a drawing authored 900 wide would letter a third larger than its
 * neighbours. The height is free.
 *
 * The height is not quite free of consequence, though. The sheet cannot cap
 * it without letterboxing — see `.detail` in sheet.module.css — so a taller
 * viewBox is a taller drawing on the page, and at 1200 x 560 the bottom of
 * it sits below the fold on a 1440 x 800 laptop. Nearer 1200 x 400 is what
 * fits whole.
 */

/** Ties a bay and its callout to the part the course actually has there. */
export interface BayKey {
  /** The `data-zone` for the i-th part, or undefined if there is no i-th part. */
  zone: (index: number) => string | undefined
  /** The numeral in that part's callout ring. */
  num: (index: number) => string | undefined
}

/** One course's detail. */
export interface Detail {
  /**
   * How many bays this drawing was authored with. The schedule reads it so
   * that a course which grows a part the drawing has not caught up with
   * gets a column with no ring and the words "Not on the detail", rather
   * than a numeral pointing at nothing.
   */
  bays: number
  /** The drawing in words, in the order the request meets it. */
  steps: string[]
  /** Where this course sits on the key plan. */
  keyBoxes: KeyBox[]
  Drawing: (props: { k: BayKey }) => JSX.Element
}

/**
 * A bay: the objects belonging to one part of the course. A bay with no
 * part behind it falls back to the spine class — it is still drawn, because
 * the machine is true whether or not a course has a part about it, but it
 * takes no ink and never dims.
 */
export function Bay({ k, i, children }: { k: BayKey; i: number; children: ReactNode }) {
  const zone = k.zone(i)
  return (
    <g className={zone === undefined ? s.spine : s.bay} data-zone={zone}>
      {children}
    </g>
  )
}

/** A numbered ring, a leader, and a dot on the thing it names. */
export function Callout({
  k,
  i,
  cx,
  cy,
  lead,
  dot,
}: {
  k: BayKey
  i: number
  cx: number
  cy: number
  lead: string
  dot: [number, number]
}) {
  const zone = k.zone(i)
  if (zone === undefined) return null

  return (
    <g className={s.callout} data-zone={zone}>
      <path className={s.lead} d={lead} />
      <circle className={s.dot} cx={dot[0]} cy={dot[1]} r={3.5} />
      <circle className={s.ring} cx={cx} cy={cy} r={17} />
      <text className={s.num} x={cx} y={cy + 6} textAnchor="middle">
        {k.num(i)}
      </text>
    </g>
  )
}

/** The one authored moment: a single request runs the detail once, on load. */
export function Spark({ d, dur, delay, len }: { d: string; dur: string; delay: string; len?: string }) {
  return (
    <g className={s.sparks}>
      <path
        className={s.spark}
        d={d}
        pathLength={1}
        style={
          { '--pl-dur': dur, '--pl-delay': delay, ...(len ? { '--pl-d': len } : {}) } as CSSProperties
        }
      />
    </g>
  )
}

/* ============================================================
   The five, keyed by course slug
   ============================================================ */

/**
 * One entry per course. Every drawing lives in its own file under ./details/
 * and exports a single `detail`; this module owns the contract they share —
 * the types, the three helpers, and the lookup — and draws nothing itself.
 */
const DETAILS: Record<string, Detail> = {
  'prompt-engineering': promptDetail,
  rag: ragDetail,
  llms: llmsDetail,
  agents: agentsDetail,
  evals: evalsDetail,
}

/** The detail for a course, or null when nobody has drawn one yet. */
export function getDetail(slug: string): Detail | null {
  return DETAILS[slug] ?? null
}
