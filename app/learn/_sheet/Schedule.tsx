'use client'

import Link from 'next/link'
import { useProgress } from '../_components/useProgress'
import { pad, zoneMinutes, type Zone } from './parts'
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
 * localStorage. It is handed `Zone[]` rather than the `Course`, for the same
 * reason `toLineCourse` exists: a `Course` carries every lesson's full MDX
 * body, and anything passed across this boundary is serialised into the
 * page's payload.
 */

interface Props {
  courseSlug: string
  zones: Zone[]
  /** How many bays FIG. 2 was drawn with. A part past that has no ring. */
  bays: number
  /** Total lessons in the course, for the count in the header. */
  total: number
}

export function Schedule({ courseSlug, zones, bays, total }: Props) {
  const { isDone, ready } = useProgress(courseSlug)

  // Until localStorage has been read every lesson renders unread, which is
  // what the server rendered, so the first client render matches it.
  const read = ready ? zones.flatMap((z) => z.lessons).filter((l) => isDone(l.slug)).length : 0

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
        {zones.map((zone, index) => {
          const drawn = index < bays
          const minutes = zoneMinutes(zone)

          return (
            <li key={`${zone.n}-${zone.name ?? index}`} className={s.col} data-zone={zone.n}>
              <span className={s.swatch} aria-hidden="true" />

              <span className={s.colHead}>
                {drawn ? (
                  <span className={s.colN} aria-hidden="true">
                    {zone.n}
                  </span>
                ) : null}
                <span className={s.colName}>{zone.name ?? `Part ${zone.n}`}</span>
              </span>

              {drawn ? null : <p className={s.undrawn}>Not on the detail</p>}

              <p className={s.colFigs}>
                {zone.lessons.length} {zone.lessons.length === 1 ? 'lesson' : 'lessons'}
                {zone.lessons.length > 0 ? ` · ${minutes} min` : ''}
              </p>

              {zone.lessons.length === 0 ? (
                <p className={s.empty}>No lessons yet</p>
              ) : (
                <ol className={s.lessons} role="list">
                  {zone.lessons.map((lesson) => {
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
