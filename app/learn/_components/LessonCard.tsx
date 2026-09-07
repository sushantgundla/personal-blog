'use client'

import Link from 'next/link'
import type { Lesson } from '@/lib/learn'
import { useProgress } from './useProgress'
import styles from './LessonCard.module.css'

/**
 * A lesson row on the syllabus. A client component only because of the
 * tick: whether you've finished this lesson lives in localStorage, which
 * the server cannot know.
 *
 * Until `ready` is true no tick is rendered at all, so the first client
 * render matches the server's markup exactly and React never warns.
 */
export function LessonCard({ lesson, courseSlug }: { lesson: Lesson; courseSlug: string }) {
  const { isDone, ready } = useProgress(courseSlug)
  const done = ready && isDone(lesson.slug)

  return (
    <Link href={`/learn/${courseSlug}/${lesson.slug}`} className={`learn-card ${styles.card}`}>
      <span className={styles.num}>{String(lesson.order).padStart(2, '0')}</span>

      <div className={styles.body}>
        <h3>{lesson.title}</h3>
        {lesson.subtitle ? <p className={styles.subtitle}>{lesson.subtitle}</p> : null}
      </div>

      <span className={styles.meta}>
        {done ? (
          <span className={styles.check} title="Finished" aria-label="Finished">
            ✓
          </span>
        ) : null}
        ~{lesson.minutes} min
      </span>
    </Link>
  )
}
