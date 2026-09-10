import type { ComponentProps, ReactNode } from 'react'
import { mdxComponents } from '../../_components/mdx'
import s from './worksheet.module.css'

/**
 * The worksheet's own MDX map. Everything the section already does to a
 * lesson body — the scrolling table, the keyboard-reachable code block,
 * internal links through next/link — is inherited; only the section
 * heading is rewritten, because on this sheet a section is a work item and
 * its number does not belong in the heading.
 *
 * The numeral is drawn once, in the figures column, by Lesson.tsx. What is
 * left here is the item's name. The number is still read out, from a
 * visually hidden span, so a screen reader hears "1. A fixed-length list of
 * floats" exactly as it does on the shipped page — the numeral in the
 * margin is the visible half of the same fact, and it is aria-hidden.
 *
 * `id` arrives as a prop from rehype-slug and is spread through, so the
 * headings keep the anchors they would have had.
 */

/** Matches a heading that opens with its section number: "3. Context windows". */
const LEADING_NUMBER = /^(\d+)\.\s+([\s\S]*)$/

function splitLeadingNumber(children: ReactNode): { number: string | null; rest: ReactNode } {
  if (typeof children === 'string') {
    const match = LEADING_NUMBER.exec(children)
    return match ? { number: match[1], rest: match[2] } : { number: null, rest: children }
  }

  // "## 2. Using `temperature`" arrives as an array whose head is the text.
  if (Array.isArray(children) && typeof children[0] === 'string') {
    const match = LEADING_NUMBER.exec(children[0])
    if (match) {
      return { number: match[1], rest: [match[2], ...children.slice(1)] }
    }
  }

  return { number: null, rest: children }
}

function ItemHead({ children, ...props }: ComponentProps<'h2'>) {
  const { number, rest } = splitLeadingNumber(children)

  return (
    <h2 {...props} className={s.itemHead}>
      {number === null ? null : <span className={s.sr}>{number}. </span>}
      {rest}
    </h2>
  )
}

export const worksheetComponents = { ...mdxComponents, h2: ItemHead }
