import Link from 'next/link'
import type { Lesson } from '@/lib/learn'
import styles from './PrevNext.module.css'

interface Props {
  courseSlug: string
  prev: Lesson | null
  next: Lesson | null
}

/**
 * The line continuing, at the foot of a lesson. Two halves split by a
 * hairline. Server component.
 *
 * The first and last lesson of a course have only one neighbour; rather
 * than leave a gap, that half goes back to the whole line, so the row is
 * always two links wide.
 */
export function PrevNext({ courseSlug, prev, next }: Props) {
  const allStops = `/learn/${courseSlug}`

  return (
    <nav className={styles.nav} aria-label="Lesson navigation">
      <Link
        className={styles.side}
        href={prev ? `${allStops}/${prev.slug}` : allStops}
        rel={prev ? 'prev' : undefined}
      >
        <span className="sign-quiet">&larr; PREVIOUS STOP</span>
        <span className="sign">{prev ? prev.title : 'ALL STOPS ON THIS LINE'}</span>
      </Link>

      <Link
        className={`${styles.side} ${styles.next}`}
        href={next ? `${allStops}/${next.slug}` : allStops}
        rel={next ? 'next' : undefined}
      >
        <span className="sign-quiet">NEXT STOP &rarr;</span>
        <span className="sign">{next ? next.title : 'ALL STOPS ON THIS LINE'}</span>
      </Link>
    </nav>
  )
}
