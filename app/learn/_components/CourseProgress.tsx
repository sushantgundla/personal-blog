'use client'

import Link from 'next/link'
import type { Course } from '@/lib/learn'
import { MagneticButton } from '@/components/MagneticButton'
import { useProgress } from './useProgress'
import styles from './CourseProgress.module.css'

/**
 * "3 of 8 lessons done", with a bar and a way back in.
 *
 * Renders nothing at all until localStorage has been read. That keeps the
 * server render and the first client render identical — and it also means
 * a first-time reader never sees an empty progress bar flash before the
 * page settles.
 */
export function CourseProgress({ course }: { course: Course }) {
  const { isDone, ready } = useProgress(course.slug)

  if (!ready || course.lessons.length === 0) return null

  const total = course.lessons.length
  const doneCount = course.lessons.filter((lesson) => isDone(lesson.slug)).length
  const complete = doneCount === total

  // Where "Continue" goes: the first lesson still unfinished, which for a
  // reader who has never been here is simply lesson one.
  const next = course.lessons.find((lesson) => !isDone(lesson.slug)) ?? course.lessons[0]

  return (
    <div className={styles.wrap}>
      <div
        className={styles.track}
        role="progressbar"
        aria-label={`${course.title} progress`}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={doneCount}
      >
        <div className={styles.fill} style={{ width: `${(doneCount / total) * 100}%` }} />
      </div>

      <p className={`${styles.count} ${complete ? styles.complete : ''}`}>
        {complete ? 'Course complete' : `${doneCount} of ${total} lessons done`}
      </p>

      {complete ? null : (
        <MagneticButton className={styles.ctaWrap}>
          <Link href={`/learn/${course.slug}/${next.slug}`} className={styles.cta}>
            Continue
            <span aria-hidden="true">→</span>
          </Link>
        </MagneticButton>
      )}
    </div>
  )
}
