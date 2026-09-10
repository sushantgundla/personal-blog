import Link from 'next/link'
import type { ReactNode } from 'react'
import type { StageDoors } from './stages'
import s from './plate.module.css'

/**
 * One of the five parts of FIG. 1, and the door into the course it is.
 *
 * Both drawings hang their geometry inside this, so the group, the link and
 * the accessible name are written once and the two plates stay the same
 * object. Nothing about the shape of a part is decided here — the geometry
 * is hand-authored in MachineWide.tsx and MachineNarrow.tsx and always was.
 *
 * The link wraps the whole part, not only the invisible .hit rects. A reader
 * who clicks the corpus, a layer or the dial is clicking the part, and it
 * would be a strange machine where the gaps between the lines were the doors
 * and the lines themselves were not.
 *
 * Three things worth stating, because each of them was nearly got wrong:
 *
 *   - It is next/link, not a bare <a>. Next 14 handles an anchor inside an
 *     SVG explicitly — linkClicked() upper-cases nodeName because "anchors
 *     inside an svg have a lowercase nodeName" — so the router takes the
 *     click and the page does not reload. The drawing components stay server
 *     components and the index still ships no JavaScript of its own.
 *   - data-course is repeated on the anchor. The reveal is a :has() rule on
 *     [data-course], and the element that takes focus is the anchor, not the
 *     group — without this, tabbing to a part of the machine would light
 *     nothing. It is the same trick .cellLink already plays in the legend.
 *     The hover half of that reveal is scoped to a real pointer, because a
 *     touch browser synthesises hover on the first tap and would spend it
 *     lighting the part instead of opening this link. See section 7 of
 *     plate.module.css.
 *   - aria-label carries the whole sentence, in the legend's own words, and
 *     the marks it wraps are hidden in one go by the inner group. The
 *     alternative is a link that announces "Corpus Candidates Top-k". The
 *     hiding is done here rather than mark by mark in the two drawings, so
 *     the rule is one line and a new label cannot forget to obey it.
 *
 * A stage with no door is drawn and not clickable: buildStages() drops a
 * stage whose course directory has gone, the lookup misses, and the part of
 * the machine stays on the sheet. The machine is true whether or not there
 * is a course about it.
 */
export function Stage({
  id,
  doors,
  children,
}: {
  /** The course this part is. Drives --ln-course and the reveal. */
  id: string
  doors: StageDoors
  children: ReactNode
}) {
  const door = doors[id]

  if (!door) {
    return (
      <g className={s.stage} data-course={id} aria-hidden="true">
        {children}
      </g>
    )
  }

  return (
    <g className={s.stage} data-course={id}>
      <Link className={s.door} data-course={id} href={door.href} aria-label={door.label}>
        <g aria-hidden="true">{children}</g>
      </Link>
    </g>
  )
}
