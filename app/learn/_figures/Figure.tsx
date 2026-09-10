import type { ReactNode } from 'react'
import s from './figures.module.css'

/**
 * The frame every figure in a lesson shares.
 *
 * It does three things and nothing else: it takes the whole spread
 * instead of the reading measure, it brackets the drawing in two
 * hairlines the way a code block and a table already are, and it
 * prints the caption with its number in front of it.
 *
 * The number comes from a CSS counter, so an author never writes
 * "FIG. 3" and never renumbers after inserting one earlier in the
 * page. See the header of figures.module.css for why there is no
 * counter-reset anywhere.
 *
 * A `<figure>` with a `<figcaption>` already carries the caption as
 * its accessible name, so nothing here writes an aria-label. The
 * `alt` prop is the other half of that: the text a reader who cannot
 * see the drawing needs on top of the caption — the actual values,
 * in order. Every figure in the kit that encodes a number passes one.
 */

export interface FigureProps {
  /**
   * The caption, in the section's own voice: a sentence stating what
   * the drawing shows or what it found. It is printed after "FIG. n —"
   * and it is the figure's accessible name, so it has to make sense
   * read on its own.
   */
  caption: string
  /**
   * The text equivalent: everything the drawing encodes, spelled out
   * for a screen reader. Off screen, never `display: none`. Leave it
   * out only when the caption already says everything the drawing does.
   */
  alt?: string
  /**
   * Drop the two hairlines. For `<Figure>` wrapped round a markdown
   * table or a code block, which brackets itself already.
   */
  bare?: boolean
  children: ReactNode
}

export function Figure({ caption, alt, bare, children }: FigureProps) {
  return (
    <figure className={s.fig}>
      <div className={bare ? s.bare : s.plate}>{children}</div>

      {alt ? <div className={s.sr}>{alt}</div> : null}

      <figcaption className={s.cap}>
        <span className={s.capN} aria-hidden="true" />
        {caption}
      </figcaption>
    </figure>
  )
}
