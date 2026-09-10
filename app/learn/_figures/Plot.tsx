import type { CSSProperties } from 'react'
import { Figure } from './Figure'
import s from './figures.module.css'

/**
 * <Plot> — named things placed against two named axes.
 *
 * Cost against capability, recall against latency, effort against
 * what it buys you. Use it when two things vary at once and the
 * point is where each option sits between them.
 *
 * This is also the 2x2, and it is the honest version of one: turn
 * `divide` on and the quadrants are ruled, but the items still sit
 * where they actually are rather than one obediently per box. A 2x2
 * with four items invented to fill the corners is a slide, not a
 * drawing, and there is nothing in this section it would be true of.
 *
 * Below 44rem it is not drawn at all — it is a ruled list of the same
 * facts, and the list is what a screen reader gets at every width.
 * That is the trade a course page already makes with FIG. 2: a plot
 * whose labels cannot be read is a smudge, and a list of the same
 * facts can be read. One node with two treatments, never two copies
 * that can drift.
 *
 * Labels sit to the right of their dot and do not wrap, so two items
 * within a few per cent of each other WILL overlap. That is a real
 * limit: past about six items, or with two items nearly on top of
 * each other, the answer is <Bars> or a markdown table.
 */

/** One thing on the plot. */
export interface PlotPoint {
  /** What it is. Kept short — it is set on one line beside its dot. */
  label: string
  /** Where it sits on the horizontal axis, 0 to 100. */
  x: number
  /** Where it sits on the vertical axis, 0 to 100. */
  y: number
  /**
   * The item the figure is about. It takes the warm ink and a heavier
   * weight, and nothing else does. At most one per Plot.
   */
  subject?: boolean
}

export interface PlotProps {
  /** The caption. Printed after "FIG. n —"; it is the accessible name. */
  caption: string
  /** The text equivalent. Built from the points when left out. */
  alt?: string
  /** What the horizontal axis measures. "Cost per million tokens". */
  xAxis: string
  /** The two ends of it, low first: ["Cheap", "Expensive"]. */
  xEnds: [string, string]
  /** What the vertical axis measures. "Reasoning on hard tasks". */
  yAxis: string
  /** The two ends of it, low first: ["Weak", "Strong"]. */
  yEnds: [string, string]
  /** The things being placed. Two to about six. */
  points: PlotPoint[]
  /** Rule the plot into quadrants at the midpoint of both axes. */
  divide?: boolean
}

/** 0 to 100, whatever an author actually passed. */
function clamp(value: number): number {
  if (!Number.isFinite(value)) return 50
  return Math.max(0, Math.min(100, value))
}

export function Plot({
  caption,
  alt,
  xAxis,
  xEnds,
  yAxis,
  yEnds,
  points,
  divide,
}: PlotProps) {
  const kept = points.filter((point) => point.label)
  if (kept.length === 0) return null

  // No built `alt` here, unlike the rest of the kit: the ruled list at
  // the foot is already the text equivalent, in the DOM at every
  // width, so a second copy would read every point out twice.
  return (
    <Figure caption={caption} alt={alt}>
      <div className={s.plot} aria-hidden="true">
        {/* Every label horizontal, including the vertical axis's: no
            rotated text at any width, which is the section's rule for
            all three of its surfaces. So the y axis is named above the
            box with its high end, and its low end sits under it. */}
        <div className={`${s.lab} ${s.axisY}`}>
          <span>{yAxis} &uarr;</span>
          <span>{yEnds[1]}</span>
        </div>

        <div className={s.plotBox}>
          {divide ? (
            <>
              <span className={s.divideX} />
              <span className={s.divideY} />
            </>
          ) : null}

          {kept.map((point) => (
            <span
              key={point.label}
              className={`${s.pt} ${point.subject ? s.ptOn : ''}`.trim()}
              style={
                {
                  insetInlineStart: `${clamp(point.x)}%`,
                  insetBlockEnd: `${clamp(point.y)}%`,
                } as CSSProperties
              }
            >
              <span className={s.ptDot} />
              <span className={s.ptName}>{point.label}</span>
            </span>
          ))}
        </div>

        <div className={`${s.lab} ${s.axisYFoot}`}>{yEnds[0]}</div>

        <div className={`${s.lab} ${s.axisX}`}>
          <span>{xEnds[0]}</span>
          <span>{xAxis} &rarr;</span>
          <span>{xEnds[1]}</span>
        </div>
      </div>

      {/* The same facts, ruled. Shown below 44rem where the plot is
          not drawn, off screen above it — one node with two
          treatments, never two copies that can drift. */}
      <div className={s.plotSay}>
        <div className={s.lab}>
          {xAxis} &rarr; / {yAxis} &uarr;
        </div>
        <ol className={s.list}>
          {kept.map((point) => (
            <li key={point.label} className={`${s.row} ${s.plotListRow}`}>
              <span className={`${s.barName} ${point.subject ? s.subject : ''}`.trim()}>
                {point.label}
              </span>
              <span className={s.num}>
                {clamp(point.x)} / {clamp(point.y)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Figure>
  )
}
