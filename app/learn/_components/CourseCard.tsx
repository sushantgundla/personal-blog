import Link from 'next/link'
import type { Course } from '@/lib/learn'
import styles from './CourseCard.module.css'

/**
 * A course on the /learn index. The whole row is the link — there is no
 * separate "Start" button to aim at, the arrow is just the affordance.
 *
 * Server component: it reads nothing but its props.
 */
export function CourseCard({ course }: { course: Course }) {
  const count = course.lessons.length

  return (
    <Link href={`/learn/${course.slug}`} className={`learn-card ${styles.card}`}>
      <span className={`learn-pill ${styles.pill}`}>
        {count} {count === 1 ? 'lesson' : 'lessons'}
      </span>

      <div className={styles.body}>
        <h2>{course.title}</h2>
        <p>{course.blurb}</p>
      </div>

      <span className={styles.start}>
        Start
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  )
}
