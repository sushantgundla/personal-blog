import type { ReactNode } from 'react'
import { Figure } from './Figure'
import s from './figures.module.css'

/**
 * <Compare> — two panels split by one hairline.
 *
 * Before and after, naive and correct, this and not that. Each panel
 * holds whatever you put between its tags: markdown prose, a list, a
 * fenced code block. It is the one component in the kit that takes
 * children rather than data, because its content IS prose and prose
 * belongs in markdown.
 *
 * Neither side is tinted and neither is filled. There is no red panel
 * and no green one, and there is no glyph: a lesson carries no hue for
 * right and wrong anywhere, by the same rule the recall band follows,
 * which marks its answers with the printed words `Correct` and `Not
 * this` and nothing else. Say which side is which in the `label` and
 * the `title`, in words.
 *
 * Three panels is the ceiling. Four columns of prose across a spread
 * is a table, and a table is what markdown is for.
 *
 * Below 46rem the panels stack, split by a hairline across instead of
 * a rule between.
 *
 * Leave a blank line after the opening `<Panel>` tag and before the
 * closing one, or MDX will treat the contents as inline JSX text and
 * your markdown will not be parsed.
 */

export interface CompareProps {
  /** The caption. Printed after "FIG. n —"; it is the accessible name. */
  caption: string
  /** The text equivalent. Rarely needed: the panels are already text. */
  alt?: string
  /** Two `<Panel>` elements, or at most three. */
  children: ReactNode
}

export interface PanelProps {
  /** What this side is. "Paste the handbook", "Retrieve ten paragraphs". */
  title: string
  /**
   * The short word over the title: `BEFORE`, `NAIVE`, `WHAT TO DO`.
   * Optional, and worth having — it is what makes a pair scannable.
   */
  label?: string
  /** The panel's contents, as markdown. */
  children: ReactNode
}

/** One side of a <Compare>. It is not useful anywhere else. */
export function Panel({ title, label, children }: PanelProps) {
  return (
    <div className={s.panel}>
      <div className={s.panelHead}>
        {label ? <span className={s.lab}>{label}</span> : null}
        <span className={s.panelTitle}>{title}</span>
      </div>
      <div className={s.panelBody}>{children}</div>
    </div>
  )
}

export function Compare({ caption, alt, children }: CompareProps) {
  return (
    <Figure caption={caption} alt={alt}>
      <div className={s.compare}>{children}</div>
    </Figure>
  )
}
