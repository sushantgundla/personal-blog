/**
 * The sheet's item list — the numbered sections of one lesson, read off the
 * MDX before it is rendered.
 *
 * A drawing office numbers what is on a sheet down the margin, and a lesson
 * is already numbered: every body in content/learn/ opens its three sections
 * with `## 1. `, `## 2. `, `## 3. `. This reads those numbers and titles so
 * the margin rail can list them, and hands out the id each heading will
 * carry so the rail's links land on the right one.
 *
 * The id is derived from the section's own number rather than from a slug of
 * its words, because the rail and the heading have to agree and neither can
 * see the other. `Lesson.tsx` renders the body with its own h2 component,
 * which computes the same id from the same leading number — one function,
 * two callers, so they cannot drift.
 */

export interface Section {
  /** The number the writer put in the heading: "1", "2", "3". */
  n: string
  /** The id the rendered heading will carry. */
  id: string
  /** The heading with its leading "N. " removed. */
  text: string
}

/**
 * Fenced code first, because a shell or Python block can open a line with a
 * hash and would otherwise be read as a heading. Lazy, so it stops at the
 * first closing fence rather than swallowing the rest of the file.
 */
const FENCE = /^ {0,3}(?:```|~~~)[\s\S]*?^ {0,3}(?:```|~~~)[^\n]*$/gm

/** "1. A fixed-length list of floats" -> number and the rest. */
const LEADING_NUMBER = /^(\d+)\.\s+([\s\S]*)$/

/** The id a section heading carries, from the number the writer gave it. */
export function sectionId(n: string): string {
  return `sheet-section-${n}`
}

/**
 * Strips the inline markdown a heading might carry. No lesson uses any
 * today, but a heading is one backtick away from rendering `code` in the
 * margin rail as a literal backtick, which would be a small lie on the
 * sheet.
 */
function plain(text: string): string {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Every numbered `##` heading in a lesson body, in document order. */
export function readSections(content: string): Section[] {
  const prose = content.replace(FENCE, '')
  const headings = prose.match(/^##[ \t]+.+$/gm) ?? []

  const sections: Section[] = []

  for (const heading of headings) {
    const raw = heading.replace(/^##[ \t]+/, '').trim()
    const match = LEADING_NUMBER.exec(raw)
    // An unnumbered heading is not an item on the sheet: it keeps the id
    // rehype-slug gives it and simply does not appear in the margin.
    if (!match) continue

    sections.push({ n: match[1], id: sectionId(match[1]), text: plain(match[2]) })
  }

  return sections
}
