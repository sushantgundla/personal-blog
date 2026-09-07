import type { Course } from '@/lib/learn'
import { Line } from './Line'
import { toLineCourse } from './line-data'
import styles from './Network.module.css'

/**
 * The whole section as one diagram: every course a line, every lesson a
 * stop on it. This is the index page — there is nothing above it.
 *
 * No interchanges. DESIGN.md only allows a ring where a lesson genuinely
 * cross-references another course, and no lesson records that today, so
 * drawing one would be decoration pretending to be information.
 *
 * Server component: it strips each course down to what the diagram draws
 * before handing it to `Line`, which is a client component.
 */
export function Network({ courses }: { courses: Course[] }) {
  return (
    <div className={styles.network}>
      {courses.map((course) => (
        <Line key={course.slug} course={toLineCourse(course)} variant="network" />
      ))}
    </div>
  )
}
