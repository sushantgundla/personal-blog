import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import s from './lesson.module.css'

/**
 * The component map for a lesson body.
 *
 * A lesson is set as a feature drawn on the index sheet's paper
 * rather than as documentation, and four elements carry that:
 *
 *   h2          a course-ink band across the whole spread, with the
 *               section numeral in italic display serif beside a
 *               heading that holds to the reading measure
 *   pre         the full spread, hairline-framed, unfilled, mono
 *   table       the full spread, with the key column pinned
 *   blockquote  a pull quote, bracketed by two hairlines
 *
 * Everything else is styled from .prose in lesson.module.css and
 * needs no markup of its own. All of it is server-rendered, from
 * app/learn/[course]/[lesson]/page.tsx.
 */

/** Matches a heading that opens with its section number: "3. Context windows". */
const LEADING_NUMBER = /^(\d+)\.\s+([\s\S]*)$/

/**
 * Splits the leading "N. " off a heading so the numeral can be set
 * separately. Handles the plain-string case and the case where the
 * heading starts with text but carries inline markup after it, e.g.
 * "## 2. Using `temperature`". Returns a null number when there is no
 * prefix, and the caller falls back to an ordinary heading.
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

/** Anything that is not an absolute URL or an anchor stays inside the app. */
function isInternal(href: string): boolean {
  return href.startsWith('/')
}

/**
 * A chapter break. The element itself is the full spread, so the
 * course rule across its top is a band on the page rather than a
 * stripe over one column; the text inside holds to the measure.
 *
 * The numeral stays inside the heading's own text rather than being
 * hidden and redrawn, so a screen reader still hears "3. What it is
 * good at" — the same sentence a reader sees.
 */
function Heading2({ children, ...props }: ComponentProps<'h2'>) {
  const { number, rest } = splitLeadingNumber(children)

  return (
    <h2 {...props} className={s.h2}>
      <span className={s.h2in}>
        {number === null ? null : <span className={s.h2n}>{number}.</span>}
        <span className={`${s.h2t} ${number === null ? s.h2wide : ''}`.trim()}>
          {number === null ? children : rest}
        </span>
      </span>
    </h2>
  )
}

/**
 * A code block, on the paper rather than in a box on it: a hairline
 * frame, no fill, and colouring made of three greys and a weight.
 * It scrolls sideways rather than wrapping a long line, and a region
 * that scrolls has to be reachable from a keyboard — hence tabIndex,
 * with its own focus ring inset so the frame does not clip it.
 */
function Pre(props: ComponentProps<'pre'>) {
  return (
    <div className={s.code}>
      <pre tabIndex={0} {...props} />
    </div>
  )
}

/**
 * A comparison table. It takes the whole spread instead of the
 * reading measure, because squeezing six columns into a 70-character
 * column is how these end up unreadable. Below the width where it
 * fits, the wrapper scrolls and the first column stays pinned, so a
 * reader working across a row never loses which row they are on.
 *
 * The wrapper is focusable for the same reason as the code block, and
 * it is named, because a focusable region that announces nothing is
 * its own defect.
 */
function Table(props: ComponentProps<'table'>) {
  return (
    <div
      className={s.tableWrap}
      tabIndex={0}
      role="region"
      aria-label="Comparison table, scrolls sideways"
    >
      <table {...props} />
    </div>
  )
}

/** A quote lifted out of the running text, set as a pull quote. */
function Quote(props: ComponentProps<'blockquote'>) {
  return <blockquote {...props} className={s.quote} />
}

function Anchor({ href, children, ...props }: ComponentProps<'a'>) {
  if (href && isInternal(href)) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    )
  }

  // Same-page anchors and external links are both plain <a>; only the
  // external ones open a new tab.
  const external = Boolean(href) && !href!.startsWith('#')

  return (
    <a href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} {...props}>
      {children}
    </a>
  )
}

export const lessonComponents = {
  h2: Heading2,
  pre: Pre,
  table: Table,
  blockquote: Quote,
  a: Anchor,
}
