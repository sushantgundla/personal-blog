'use client'

import { useProgress } from '../../_components/useProgress'
import s from './worksheet.module.css'

/**
 * The READ field in the sheet's figures column.
 *
 * A client component for one reason: read state lives in localStorage and
 * nowhere else. The server renders the label and an empty value of the
 * right height, and the value arrives once localStorage has been read, so
 * nothing moves and no reader is ever shown a wrong answer while the page
 * is still hydrating.
 *
 * The whole vocabulary is a box that is solid or hollow and a word beside
 * it. It is the same mark the course page's schedule uses. There is no
 * percentage, no bar and no count of anything the reader got right — the
 * one thing that flips this field is finishing the check at the foot.
 */
export function ReadMark({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  const { isDone, ready } = useProgress(courseSlug)

  if (!ready) {
    // Holds the row's height so the figures column does not jump.
    return <dd className={s.figValue}>&nbsp;</dd>
  }

  const done = isDone(lessonSlug)

  return (
    <dd className={s.figValue}>
      <span className={s.box} data-done={done} aria-hidden="true" />
      <span className={s.figMark}>{done ? 'YES' : 'NOT YET'}</span>
    </dd>
  )
}
