import type { Metadata } from 'next'
import { getAllCourses } from '@/lib/learn'
import { Reveal } from '@/app/(main)/_components/Reveal'
import { CourseCard } from './_components/CourseCard'
import styles from './_components/sections.module.css'

/**
 * The /learn index: the courses, and nothing else. A course's own page
 * carries the syllabus, so this page's only job is to say what the
 * section is and get out of the way.
 *
 * Server component — getAllCourses() reads the filesystem at build time.
 */

export const metadata: Metadata = {
  title: 'Learn to build with AI',
  description:
    'Free, hands-on courses for engineers who can already code but have not built with LLMs. Short lessons, real mechanics, a quiz at the end of each.',
}

export default function LearnIndexPage() {
  const courses = getAllCourses()

  return (
    <div className="measure-wide">
      <header className={styles.intro}>
        <p className="learn-eyebrow">Sushant Gundla · Learn</p>
        <h1 className="learn-h1">Learn to build with AI</h1>
        <p className="learn-lede">
          The bits nobody writes down, in the order you actually need them.
        </p>
        <p>
          Free, hands-on courses for engineers who can already code but have not built with
          LLMs. Lessons are short and stick to the real mechanics — what the model is doing,
          why it does the odd thing it just did, and what to reach for instead. Each one ends
          with a quick recall quiz.
        </p>
      </header>

      <hr className="learn-rule" />

      {courses.length === 0 ? (
        <p className={styles.empty}>Courses are landing soon.</p>
      ) : (
        <div className={styles.list}>
          {courses.map((course, index) => (
            <Reveal key={course.slug} delay={index * 80} className={styles.reveal}>
              <CourseCard course={course} />
            </Reveal>
          ))}
        </div>
      )}

      <p className={styles.note}>
        Everything here is free and stays free. Your progress is kept in this browser only —
        no account, nothing sent anywhere.
      </p>
    </div>
  )
}
