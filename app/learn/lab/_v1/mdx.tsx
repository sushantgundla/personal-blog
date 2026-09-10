import type { ComponentProps, ReactNode } from 'react'
import { mdxComponents } from '../../_components/mdx'
import { sectionId } from './sections'
import s from './specimen.module.css'

/**
 * The sheet's own MDX map.
 *
 * Only the section heading changes. Everything the section's shared map
 * already does — the table that scrolls sideways and announces itself, the
 * code block that is a tab stop, the internal/external link split — is pure
 * mechanics and is reused as it stands.
 *
 * A section heading on a specimen sheet is an item head: the number in a
 * ruled stamp, which is a title-block cell at the smallest scale this sheet
 * draws one, then the title, then a rule closing the head. The stamp is the
 * same numeral the margin rail is showing, and the id is derived from the
 * same number by the same function, so the rail's links always land.
 */

/** Matches a heading that opens with its section number: "3. Context windows". */
const LEADING_NUMBER = /^(\d+)\.\s+([\s\S]*)$/

/**
 * Pulls the leading "N. " off a heading so the number can go in the stamp.
 * Handles a plain string and a heading that opens with text but carries
 * inline markup later. Returns a null number when there is no prefix, and
 * the caller falls back to an ordinary heading with the id rehype-slug gave
 * it — which is also what keeps that heading out of the margin rail, since
 * `readSections` skips it for the same reason.
 */
function splitLeadingNumber(children: ReactNode): { number: string | null; rest: ReactNode } {
  if (typeof children === 'string') {
    const match = LEADING_NUMBER.exec(children)
    return match ? { number: match[1], rest: match[2] } : { number: null, rest: children }
  }

  if (Array.isArray(children) && typeof children[0] === 'string') {
    const match = LEADING_NUMBER.exec(children[0])
    if (match) {
      return { number: match[1], rest: [match[2], ...children.slice(1)] }
    }
  }

  return { number: null, rest: children }
}

function SectionHead({ children, ...props }: ComponentProps<'h2'>) {
  const { number, rest } = splitLeadingNumber(children)

  if (number === null) {
    return <h2 {...props}>{children}</h2>
  }

  return (
    <h2 {...props} id={sectionId(number)} className={s.sectionHead}>
      {/* The number is already in the heading text for a screen reader — it
          reads "3. Context windows" either way — so the stamp is
          presentational and the visible text carries the meaning. */}
      <span className={`num ${s.sectionN}`} aria-hidden="true">
        {number}
      </span>
      <span className={s.sectionText}>{rest}</span>
    </h2>
  )
}

export const sheetComponents = {
  ...mdxComponents,
  h2: SectionHead,
}
