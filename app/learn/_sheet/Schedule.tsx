'use client'

import Link from 'next/link'
import { useProgress } from '../_components/useProgress'
import { pad, partMinutes, type CoursePart } from './parts'
import s from './sheet.module.css'

/**
 * The schedule of callouts.
 *
 * On a draughting sheet the schedule is the table beside the drawing that
 * says what every numbered thing on it is. Here there is one column per
 * part of the course, headed by the same numbered ring that part carries on
 * FIG. 2, and every lesson in that part is a line in the column.
 *
 * This is the answer to the seventeen-lessons problem. Seventeen callouts on
 * one drawing is a mess; four callouts with a schedule under each is a
 * drawing. It also happens to bound the height for free: parts partition the
 * lessons, so the tallest column is the biggest part, which is five lessons
 * on the longest course this site has.
 *
 * The one client component on the page, and only because read state lives in
 * localStorage. It is handed `CoursePart[]` rather than the `Course`, and that
 * is not a convenience: a `Course` carries every lesson's full MDX body, and
 * anything passed across this boundary is serialised into the page's payload.
 * `toParts()` in parts.ts cuts it down to what the schedule actually prints.
 */

interface Props {
  courseSlug: string
  parts: CoursePart[]
  /** How many bays FIG. 2 was drawn with. A part past that has no ring. */
  bays: number
  /** Total lessons in the course, for the count in the header. */
  total: number
}

export function Schedule({ courseSlug, parts, bays, total }: Props) {
  const { isDone, ready } = useProgress(courseSlug)

  // Until localStorage has been read every lesson renders unread, which is
  // what the server rendered, so the first client render matches it.
  const all = parts.flatMap((part) => part.lessons)
  const read = ready ? all.filter((lesson) => isDone(lesson.slug)).length : 0

  return (
    <div className={s.schedule}>
      <div className={s.scheduleHead}>
        <h2 className={s.scheduleLabel}>Schedule of lessons</h2>
        {ready && read > 0 ? (
          <p className={s.scheduleCount}>
            <span className={s.scheduleKey} aria-hidden="true">
              <span className={s.mark} data-read="true" />
              read
            </span>
            <span>
              {pad(read)} / {pad(total)}
            </span>
          </p>
        ) : (
          <p className={s.scheduleCount}>
            {pad(total)} {total === 1 ? 'lesson' : 'lessons'}
          </p>
        )}
      </div>

      <ol className={s.cols} role="list">
        {parts.map((part, index) => {
          const drawn = index < bays
          const minutes = partMinutes(part)

          return (
            <li key={`${part.n}-${part.name ?? index}`} className={s.col} data-part={part.n}>
              <span className={s.swatch} aria-hidden="true" />

              <span className={s.colHead}>
                {drawn ? (
                  <span className={s.colN} aria-hidden="true">
                    {part.n}
                  </span>
                ) : null}
                <span className={s.colName}>{part.name ?? `Part ${part.n}`}</span>
              </span>

              {drawn ? null : <p className={s.undrawn}>Not on the detail</p>}

              <p className={s.colFigs}>
                {part.lessons.length} {part.lessons.length === 1 ? 'lesson' : 'lessons'}
                {part.lessons.length > 0 ? ` · ${minutes} min` : ''}
              </p>

              {part.lessons.length === 0 ? (
                <p className={s.empty}>No lessons yet</p>
              ) : (
                <ol className={s.lessons} role="list">
                  {part.lessons.map((lesson) => {
                    const done = ready && isDone(lesson.slug)

                    return (
                      <li key={lesson.slug} className={s.row}>
                        <span className={s.mark} data-read={done} aria-hidden="true" />
                        <span className={s.rowN} aria-hidden="true">
                          {pad(lesson.order)}
                        </span>

                        <Link
                          href={`/learn/${courseSlug}/${lesson.slug}`}
                          className={s.rowLink}
                          aria-label={`Lesson ${lesson.order}: ${lesson.title}. ${lesson.minutes} minutes.${
                            done ? ' Read.' : ''
                          }`}
                        >
                          {lesson.title}
                        </Link>

                        <span className={s.rowMin} aria-hidden="true">
                          {lesson.minutes}
                          <span className={s.rowMinKey}>m</span>
                        </span>

                        {lesson.subtitle ? <p className={s.rowSub}>{lesson.subtitle}</p> : null}
                      </li>
                    )
                  })}
                </ol>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
