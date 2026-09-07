import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllCourses, getCourse } from '@/lib/learn'
import { learnCanonical } from '@/lib/learn-domain'
import { Line } from '../_components/Line'
import { toLineCourse } from '../_components/line-data'
import styles from './page.module.css'

/**
 * One course, drawn as one line. The diagram carries the syllabus: every
 * lesson is a stop, the parts are zones along it, and the stops behind
 * you are filled in.
 *
 * No progress bar, no percentage, no ring, no "continue" button. A count
 * of stops read is the whole of it.
 *
 * Server component; the line itself is the one client island, because
 * read state lives in localStorage.
 *
 * Header and diagram share one left edge — `.bleed`'s --ln-gutter — so
 * the course name sits directly above the terminus of its own line.
 */

interface Props {
  params: { course: string }
}

export async function generateStaticParams() {
  return getAllCourses().map((course) => ({ course: course.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = getCourse(params.course)
  if (!course) return {}

  return {
    title: `${course.title} — Learn`,
    description: course.blurb,
    ...learnCanonical(`/${course.slug}`),
  }
}

export default function CoursePage({ params }: Props) {
  const course = getCourse(params.course)
  if (!course) notFound()

  return (
    <>
      <div className={`bleed ${styles.head}`}>
        <p className={styles.back}>
          <Link href="/learn" className="sign-quiet">
            ← All lines
          </Link>
        </p>

        <h1 className="learn-h1">{course.title}</h1>
        {course.subtitle ? <p className="learn-lede">{course.subtitle}</p> : null}
        <p className={styles.blurb}>{course.blurb}</p>
      </div>

      <div className="bleed">
        {/* `Line` puts `data-line` on its own root, which is what
            resolves --ln-line for everything inside it. */}
        <Line course={toLineCourse(course)} variant="full" />
      </div>
    </>
  )
}
