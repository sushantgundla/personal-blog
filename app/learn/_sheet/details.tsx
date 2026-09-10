import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import type { KeyBox } from './KeyPlan'
import type { ZoneDoor } from './parts'

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
 * bigger. FIG. 1 spends its labels on the whole machine; each drawing below
 * spends a comparable budget of them on one part of it — how many depends on
 * how much that part has to show, and the densest of the five carries about
 * twice what the sparsest does. Counting them is `grep -c 's.lab'`, which is
 * why no count is written here to go stale.
 *
 * Every one of them is something the course actually teaches — the
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
 * Every bay is also a door, into the first lesson of the part it draws —
 * the same thing FIG. 1's five parts do, one level down. `Bay` below owns
 * the link and the accessible name, so no drawing writes an href or a
 * label; both come off disk through `zoneDoor()` in parts.ts. Because there
 * are now real links inside the picture, none of the five SVGs may be
 * `aria-hidden`: each is `role="presentation"`, which says nothing itself
 * and hides nothing inside it, and every mark, numeral and label in it is
 * hidden instead — by `Bay`, `Callout` and `Spark` here, and by
 * `aria-hidden` on the spine group in each drawing.
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
 * viewBox is a taller drawing on the page, and every one of the five
 * currently runs past the fold on a 1440 x 800 laptop. Measured: 381px of
 * rail, page padding, sheet inset, title strip and figure sit above the
 * drawing, leaving 419px for something rendered 1216px wide, so a viewBox
 * only fits whole at a ratio of 2.90:1 or flatter — 1200 x 414. The flattest
 * of the five is 1200 x 428 and misses by 15px; the tallest, 1200 x 560,
 * misses by 149px. The fix for that is a flatter viewBox, never a ceiling.
 */

/** Ties a bay and its callout to the part the course actually has there. */
export interface BayKey {
  /** The `data-zone` for the i-th part, or undefined if there is no i-th part. */
  zone: (index: number) => string | undefined
  /** The numeral in that part's callout ring. */
  num: (index: number) => string | undefined
  /**
   * Where the i-th bay leads, or undefined when it leads nowhere: no i-th
   * part, or a part with no lessons filed under it yet. Built by
   * `zoneDoor()` in parts.ts and passed in, so no drawing ever writes an
   * href or an accessible name of its own.
   */
  door: (index: number) => ZoneDoor | undefined
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
 * A bay: the objects belonging to one part of the course, and the door into
 * that part it is.
 *
 * A bay with no part behind it falls back to the spine class — it is still
 * drawn, because the machine is true whether or not a course has a part
 * about it, but it takes no ink, never dims and is not a door.
 *
 * All five drawings hang their geometry inside this, so the group, the link
 * and the accessible name are written once and stay one object across five
 * files written by five different hands. It is the same argument Stage.tsx
 * makes on FIG. 1, one level down, and the three things that were nearly
 * got wrong there hold here too:
 *
 *   - It is next/link, not a bare <a>. Next 14 handles an anchor inside an
 *     SVG explicitly — linkClicked() upper-cases nodeName because "anchors
 *     inside an svg have a lowercase nodeName" — so the router takes the
 *     click and the page does not reload. The drawings stay server
 *     components and the sheet still ships no JavaScript of its own beyond
 *     Schedule.tsx, which is a client component only because read state
 *     lives in localStorage.
 *   - The reveal needs no help. Unlike the plate, section 8 of
 *     sheet.module.css correlates on `:focus-within` rather than
 *     `:focus-visible`, and a bay already carries `data-zone` — so an
 *     anchor focused inside it lights the bay and its schedule column
 *     without the anchor having to repeat the attribute. The hover half of
 *     that reveal is scoped to a real pointer, because a touch browser
 *     synthesises hover on the first tap and would spend it lighting the
 *     bay instead of opening this link.
 *   - The link wraps the whole bay, not only the invisible .hit rects: a
 *     reader who clicks a mark is clicking the part it belongs to. The
 *     marks are hidden in one go by the inner group, or the link would
 *     announce itself by reading every label inside it out loud.
 *
 * A bay whose part has no lessons yet is drawn and not clickable — see
 * zoneDoor(). A part past the last bay of the drawing has no bay at all,
 * and the schedule says "Not on the detail" for it instead.
 */
export function Bay({ k, i, children }: { k: BayKey; i: number; children: ReactNode }) {
  const zone = k.zone(i)

  if (zone === undefined) {
    return (
      <g className={s.spine} aria-hidden="true">
        {children}
      </g>
    )
  }

  const door = k.door(i)

  if (!door) {
    return (
      <g className={s.bay} data-zone={zone} aria-hidden="true">
        {children}
      </g>
    )
  }

  return (
    <g className={s.bay} data-zone={zone}>
      <Link className={s.door} href={door.href} aria-label={door.label}>
        <g aria-hidden="true">{children}</g>
      </Link>
    </g>
  )
}

/**
 * A numbered ring, a leader, and a dot on the thing it names.
 *
 * Hidden from a screen reader here rather than drawing by drawing: now that
 * the sheet is no longer `aria-hidden` as a whole, a numeral loose in the
 * SVG would be read out as the word "3" between two links.
 *
 * Four of the five drawings use this one. `agents.tsx` keeps a private copy,
 * and it is the only helper any of them still does: its ring is r=15 where
 * this one is r=17, because the tool loop crowds its numerals harder than
 * anything on the other four. Everything else about it is identical, so a
 * change here is a change to check there.
 */
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
    <g className={s.callout} data-zone={zone} aria-hidden="true">
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
    <g className={s.sparks} aria-hidden="true">
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
