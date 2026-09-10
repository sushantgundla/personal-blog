import Link from 'next/link'
import type { Lesson } from '@/lib/learn'
import s from './v4.module.css'

interface Props {
  courseSlug: string
  prev: Lesson | null
  next: Lesson | null
}

/**
 * The way on, printed after the leaf turns.
 *
 * Two stops, one above the other rather than side by side: this sits in the
 * recto column of the spread that opens under the checkpoint, and two deep
 * halves in a column that is already only the reading measure would leave
 * each stop's name broken over four words. Stacked, the label sits in its
 * own column and the two destinations line up, so the pair reads as the two
 * ways off this page and not as a caption.
 *
 * The first and last lesson of a course have only one neighbour; rather
 * than leave a gap, that half goes back to the whole line, so the block is
 * always two stops deep.
 *
 * Server component.
 */
export function Onward({ courseSlug, prev, next }: Props) {
  const allStops = `/learn/${courseSlug}`

  return (
    <nav className={s.onward} aria-label="Lesson navigation">
      <Link
        className={s.stop}
        href={prev ? `${allStops}/${prev.slug}` : allStops}
        rel={prev ? 'prev' : undefined}
      >
        <span className={`sign-quiet ${s.stopLabel}`}>&larr; PREVIOUS STOP</span>
        <span className={`sign ${s.stopName}`}>
          {prev ? prev.title : 'ALL STOPS ON THIS LINE'}
        </span>
      </Link>

      <Link
        className={s.stop}
        href={next ? `${allStops}/${next.slug}` : allStops}
        rel={next ? 'next' : undefined}
      >
        <span className={`sign-quiet ${s.stopLabel}`}>NEXT STOP &rarr;</span>
        <span className={`sign ${s.stopName}`}>
          {next ? next.title : 'ALL STOPS ON THIS LINE'}
        </span>
      </Link>
    </nav>
  )
}
