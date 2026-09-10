import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllCourses } from '@/lib/learn'
import { VARIANTS } from './variants'
import s from './lab.module.css'

/**
 * The way into the lab: five candidates, each opened on the same lesson so
 * the first thing seen is a like-for-like comparison.
 *
 * The sample lesson is chosen rather than written down — the first lesson
 * of the longest course, because a long course is what makes a lesson page
 * hard: seventeen stops on the strip, a part that is not the first, real
 * comparison tables and a real code block.
 */

export const metadata: Metadata = {
  title: 'Lesson design — five candidates',
  robots: { index: false, follow: false },
}

export default function LabIndexPage() {
  const courses = getAllCourses()

  // The longest course, and its first lesson. If content ever disappears the
  // page still renders and says nothing untrue.
  const longest = courses.reduce<(typeof courses)[number] | null>(
    (best, course) => (best === null || course.lessons.length > best.lessons.length ? course : best),
    null
  )
  const sample = longest?.lessons[0] ?? null

  return (
    <div className={s.index}>
      <h1 className={s.indexHead}>Lesson design — five candidates</h1>
      <p className={s.indexLede}>
        The same lesson, the same words, five different pages. Every one is live on the real
        content, so the tables, the code block and a seventeen-stop course are all doing what
        they really do. Pick one and the other four go.
      </p>

      {sample && longest ? (
        <ol className={s.cards} role="list">
          {VARIANTS.map((variant) => (
            <li key={variant.id} className={s.cell}>
              <span className={s.cellN}>{variant.id.padStart(2, '0')}</span>
              <Link
                href={`/learn/lab/${variant.id}/${longest.slug}/${sample.slug}`}
                className={s.cellName}
              >
                {variant.name}
              </Link>
              <p className={s.cellThesis}>{variant.thesis}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className={s.indexLede}>No lessons on disk, so there is nothing to draw yet.</p>
      )}
    </div>
  )
}
