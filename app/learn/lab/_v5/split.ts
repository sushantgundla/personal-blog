/**
 * Cutting a lesson body into work items.
 *
 * Every lesson in content/learn/ is written the same way: an opening
 * paragraph or two, then exactly three numbered sections — `## 1. …`,
 * `## 2. …`, `## 3. …`. On this sheet those three are the work items, and
 * an item is a row of the worksheet: its numeral hangs in the figures
 * column and its prose fills the work column. That means the body cannot
 * be one block of MDX; it has to be cut where the numbered headings are,
 * so the layout can put each piece in its own row.
 *
 * The cut is on the source text rather than on the rendered tree, because
 * MDXRemote hands back opaque React elements and there is nothing to slice.
 * Each chunk keeps its own `## N.` line, so rehype-slug still writes the
 * same heading id it would have written on the whole document and any
 * link to `#a-fixed-length-list-of-floats` keeps working.
 *
 * Fences are tracked, so a `## ` inside a Python block is a comment and
 * not a heading. Up to three leading spaces are allowed on both, which is
 * what CommonMark allows before it stops calling them a heading or a fence.
 */

/** `## 1. A fixed-length list of floats` — a numbered section heading. */
const ITEM_HEAD = /^ {0,3}##\s+\d+\.\s+\S/

/** The opening or closing line of a fenced code block. */
const FENCE = /^ {0,3}(?:```|~~~)/

export interface WorkItems {
  /** Everything before the first numbered heading. Usually one paragraph. */
  preamble: string
  /** One entry per numbered section, each still carrying its own heading. */
  items: string[]
}

/**
 * A lesson with no numbered headings — a half-written one, or one written
 * to a shape nobody has used yet — comes back as all preamble and no
 * items, and the page renders it as one unnumbered block of prose. Losing
 * the numerals is a visible, harmless failure; dropping the body would not
 * be.
 */
export function splitWorkItems(content: string): WorkItems {
  const lines = content.split('\n')
  const starts: number[] = []
  let fenced = false

  for (let i = 0; i < lines.length; i += 1) {
    if (FENCE.test(lines[i])) {
      fenced = !fenced
      continue
    }
    if (!fenced && ITEM_HEAD.test(lines[i])) {
      starts.push(i)
    }
  }

  if (starts.length === 0) {
    return { preamble: content.trim(), items: [] }
  }

  return {
    preamble: lines.slice(0, starts[0]).join('\n').trim(),
    items: starts.map((start, index) =>
      lines
        .slice(start, starts[index + 1] ?? lines.length)
        .join('\n')
        .trim()
    ),
  }
}
