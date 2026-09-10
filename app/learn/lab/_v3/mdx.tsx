import Link from 'next/link'
import {
  Children,
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react'
import s from './v3.module.css'

/**
 * The MDX component map for this candidate.
 *
 * Two of these exist because the design changes what the element is, not
 * how it is painted: a numbered section heading whose numeral hangs in
 * the margin, and a comparison table that stops being a table when the
 * column is too narrow to hold one. The other two — the code block and
 * the link — are the section's existing behaviour, restated here so the
 * whole map is in one place rather than half-inherited.
 *
 * Server components throughout; none of this needs the browser.
 */

/** Matches a heading that opens with its section number: "3. Context windows". */
const LEADING_NUMBER = /^(\d+)\.\s+([\s\S]*)$/

/**
 * Pulls the leading "N. " off a heading's text so the number can hang in
 * the margin. Handles the plain-string case and the case where the
 * heading starts with text but also carries inline markup, e.g.
 * `## 2. Using \`temperature\``. Returns a null number when there is no
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

/** Anything that isn't an absolute URL or a protocol link stays inside the app. */
function isInternal(href: string): boolean {
  return href.startsWith('/')
}

/** The elements among a node's children, with MDX's whitespace dropped. */
function kids(children: ReactNode): ReactElement[] {
  return Children.toArray(children).filter(isValidElement)
}

/** Every string inside a node, flattened — a table heading's own words. */
function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children)
  return ''
}

/**
 * A numbered section heading. A hairline closes the section before it, a
 * long drop of air follows, and the numeral sits out in the margin beside
 * the title from 48rem up — so the column's left edge runs unbroken from
 * the first word of the lesson to the last, and the only things outside
 * it are figures.
 *
 * The number is already in the heading text for a screen reader — it
 * reads "3. Context windows" either way — so the visible numeral is
 * presentational.
 */
function Heading2({ children, ...props }: ComponentProps<'h2'>) {
  const { number, rest } = splitLeadingNumber(children)

  if (number === null) {
    return <h2 {...props}>{children}</h2>
  }

  return (
    <h2 {...props} className={s.section}>
      <span className={`num ${s.sectionN}`} aria-hidden="true">
        {number}
      </span>
      <span className={s.sectionText}>{rest}</span>
    </h2>
  )
}

/**
 * A code block. .prose scrolls it sideways rather than wrapping it or
 * widening the column, and a region that scrolls has to be operable from
 * the keyboard — tabIndex is what lets the arrow keys reach it.
 */
function Pre(props: ComponentProps<'pre'>) {
  return <pre tabIndex={0} {...props} />
}

/**
 * A comparison table, and the one real fight this design has.
 *
 * At the narrow measure the reading column is roughly 38rem. A
 * six-column table in that is about 100px a column, which is not a
 * table, it is a column of broken words — and the usual answer, a
 * sideways scroll, is an interaction readers do not perform. So when the
 * column cannot hold the table, the table stops being one: every row
 * becomes a small block and every cell is labelled with its own column
 * heading, still in the reading column, still flush left. Nothing is
 * dropped and nothing is hidden.
 *
 * That labelling is why this component exists at all — `attr()` can only
 * read an attribute that is on the cell, so the heading text has to be
 * copied onto each cell here, at build time.
 *
 * Two things it is careful about:
 *
 * - `display: block` on table elements costs the table its semantics in
 *   every browser, so every element is given its implicit role
 *   explicitly. They are the roles the elements already had; writing
 *   them down is what makes them survive the display change.
 * - The header row is only *visually* hidden when the table stacks, so a
 *   screen reader still meets a real table with real column headers. The
 *   `::before` labels are the visual equivalent of what it already hears.
 *
 * The wrapper stays a focusable scroll region for the case the container
 * query cannot cover: a table whose own content will not fit even at the
 * width it was given.
 */
function Table({ children, ...rest }: ComponentProps<'table'>) {
  const groups = kids(children)
  const head = groups.find((group) => group.type === 'thead')
  const bodies = groups.filter((group) => group.type !== 'thead')

  const headRows = head ? kids(head.props.children) : []
  const labels = headRows.length > 0 ? kids(headRows[0].props.children).map((cell) => textOf(cell.props.children)) : []

  const bodyRows = bodies.map((group) => kids(group.props.children))
  const columns = Math.max(labels.length, ...bodyRows.flat().map((row) => kids(row.props.children).length), 1)

  const rebuiltHead = head
    ? cloneElement(
        head,
        { role: 'rowgroup' },
        headRows.map((row, r) =>
          cloneElement(
            row,
            { key: `hr${r}`, role: 'row' },
            kids(row.props.children).map((cell, c) =>
              cloneElement(cell, {
                key: `hc${c}`,
                role: cell.type === 'th' ? 'columnheader' : 'cell',
              })
            )
          )
        )
      )
    : null

  const rebuiltBodies = bodies.map((group, g) =>
    cloneElement(
      group,
      { key: `g${g}`, role: 'rowgroup' },
      kids(group.props.children).map((row, r) =>
        cloneElement(
          row,
          { key: `r${r}`, role: 'row' },
          kids(row.props.children).map((cell, c) =>
            cloneElement(cell, {
              key: `c${c}`,
              role: cell.type === 'th' ? 'rowheader' : 'cell',
              'data-label': labels[c] ?? '',
            })
          )
        )
      )
    )
  )

  return (
    <div
      className={s.tableWrap}
      tabIndex={0}
      role="region"
      aria-label="Table, scrolls sideways"
    >
      <table
        {...rest}
        role="table"
        className={`${s.table} ${columns >= 5 ? s.manyCols : s.fewCols}`}
      >
        {rebuiltHead}
        {rebuiltBodies}
      </table>
    </div>
  )
}

function Anchor({ href, children, ...props }: ComponentProps<'a'>) {
  if (href && isInternal(href)) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    )
  }

  // Same-page anchors (#heading) and external links both stay plain <a>;
  // only the external ones get a new tab.
  const external = Boolean(href) && !href!.startsWith('#')

  return (
    <a href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} {...props}>
      {children}
    </a>
  )
}

export const v3Components = {
  h2: Heading2,
  pre: Pre,
  table: Table,
  a: Anchor,
}
