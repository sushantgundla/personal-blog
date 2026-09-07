import Link from 'next/link'
import type { Lesson } from '@/lib/learn'
import styles from './PrevNext.module.css'

interface Props {
  courseSlug: string
  prev: Lesson | null
  next: Lesson | null
}

/**
 * Previous / next at the foot of a lesson. Server component.
 *
 * The first and last lesson of a course have only one neighbour. Rather
 * than leave a gap, the empty side links back to the course contents, so
 * the row is always two links wide.
 */
export function PrevNext({ courseSlug, prev, next }: Props) {
  const allLessons = `/learn/${courseSlug}`

  return (
    <nav className={styles.nav} aria-label="Lesson navigation">
      <Link
        className={styles.side}
        href={prev ? `${allLessons}/${prev.slug}` : allLessons}
        rel={prev ? 'prev' : undefined}
      >
        <span className={styles.label}>Previous</span>
        <span className={styles.title}>
          <span className={styles.arrow} aria-hidden="true">
            &larr;{' '}
          </span>
          {prev ? prev.title : 'All lessons'}
        </span>
      </Link>

      <Link
        className={`${styles.side} ${styles.next}`}
        href={next ? `${allLessons}/${next.slug}` : allLessons}
        rel={next ? 'next' : undefined}
      >
        <span className={styles.label}>Next</span>
        <span className={styles.title}>
          {next ? next.title : 'All lessons'}
          <span className={styles.arrow} aria-hidden="true">
            {' '}
            &rarr;
          </span>
        </span>
      </Link>
    </nav>
  )
}
