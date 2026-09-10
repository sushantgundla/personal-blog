import type { ReactNode } from 'react'

/**
 * The stations this variant's line is drawn from.
 *
 * The rail beside the reading column is a real drawing of one lesson, so
 * it needs to know what the lesson is made of before a word of it is
 * rendered. Two things read the same lesson body and have to agree on the
 * answer to the character: the rail, which draws a tick per numbered
 * section and links to it, and the heading component in Lesson.tsx, which
 * is what puts the id on the heading the tick points at.
 *
 * They agree because neither guesses. Both take the section's own leading
 * number — "## 2. Cosine, and why not Euclidean" — and run it through
 * sectionId(). rehype-slug's id is left on the element for anything else
 * that wants it, but nothing here depends on reproducing its slugging
 * rules, which is the one way these two could have drifted apart.
 */

/** The lesson's head: title, subtitle, the notice. The first stop. */
export const HEAD_ID = 'v2-head'

/** The checkpoint at the foot: the recall quiz. The last stop. */
export const RECALL_ID = 'v2-recall'

/** Every numbered section's id, from its own number and nothing else. */
export function sectionId(n: string): string {
  return `v2-sec-${n}`
}

export interface Station {
  /** The element on the page this stop points at. */
  id: string
  /** The whole name, for the link and for a screen reader. */
  name: string
  /**
   * What is lettered beside the tick. A section's own numeral, a word, or
   * nothing where the drawing carries no annotation at that stop.
   */
  tag: string
}

export interface Section {
  n: string
  title: string
}

/** A fenced block opening or closing. Its contents are not headings. */
const FENCE = /^\s*(?:```|~~~)/

/** "## 2. Cosine, and why not Euclidean" — the number and the rest. */
const HEADING = /^##\s+(\d+)\.\s+(.+?)\s*$/

/** The same prefix, on heading text that has already been parsed. */
const LEADING_NUMBER = /^(\d+)\.\s+([\s\S]*)$/

/** Emphasis and backticks are markup, not words in a station's name. */
function plain(text: string): string {
  return text
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * The numbered sections of one lesson body, in reading order.
 *
 * Fenced code is skipped rather than scanned: every lesson here carries a
 * block, and a comment line that opens with two hashes inside one would
 * otherwise put a stop on the line that has no heading behind it.
 */
export function readSections(content: string): Section[] {
  const sections: Section[] = []
  let inFence = false

  for (const line of content.split('\n')) {
    if (FENCE.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const match = HEADING.exec(line)
    if (match) sections.push({ n: match[1], title: plain(match[2]) })
  }

  return sections
}

/**
 * Pulls the leading "N. " off a rendered heading so the number can be set
 * apart and, more importantly, so the heading and the rail land on the
 * same id. Handles the plain-string case and the case where the heading
 * opens with text but carries inline markup after it, e.g.
 * `## 2. Using \`temperature\``. Returns a null number when there is no
 * prefix, and the caller falls back to an ordinary heading.
 */
export function splitLeadingNumber(children: ReactNode): {
  number: string | null
  rest: ReactNode
} {
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
