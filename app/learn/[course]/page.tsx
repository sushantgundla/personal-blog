import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllCourses, getCourse, type Lesson, type Part } from '@/lib/learn'
import { learnCanonical } from '@/lib/learn-domain'
import { Reveal } from '@/app/(main)/_components/Reveal'
import { CourseProgress } from '../_components/CourseProgress'
import { LessonCard } from '../_components/LessonCard'
import styles from '../_components/sections.module.css'

/**
 * A course's syllabus: what it covers, how far you've got, and every
 * lesson in reading order, grouped under its part.
 *
 * Server component. The one client island is the progress block, which
 * has to read localStorage.
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

/**
 * A part heading and the lessons under it. `part` is null for the group of
 * lessons whose `part` number matches nothing the course declared — they
 * still get listed, just without a heading.
 */
interface Group {
  part: Part | null
  lessons: Lesson[]
}

function groupLessons(parts: Part[], lessons: Lesson[]): Group[] {
  const declared = new Set(parts.map((part) => part.n))

  const groups: Group[] = parts
    .map((part) => ({ part, lessons: lessons.filter((lesson) => lesson.part === part.n) }))
    .filter((group) => group.lessons.length > 0)

  // A typo in a lesson's `part` must never make it vanish from the page.
  const orphans = lessons.filter((lesson) => !declared.has(lesson.part))
  if (orphans.length > 0) {
    groups.push({ part: null, lessons: orphans })
  }

  return groups
}

export default function CoursePage({ params }: Props) {
  const course = getCourse(params.course)
  if (!course) notFound()

  const groups = groupLessons(course.parts, course.lessons)
  const count = course.lessons.length

  // One running counter across every group, so the reveal stagger reads as
  // a single sweep down the page rather than restarting at each part.
  let revealIndex = 0

  return (
    <div className="measure-wide">
      <Link href="/learn" className={styles.back}>
        ← All courses
      </Link>

      <header className={styles.intro}>
        <p className="learn-eyebrow">
          A hands-on course · {count} {count === 1 ? 'lesson' : 'lessons'}
        </p>
        <h1 className="learn-h1">{course.title}</h1>
        {course.subtitle ? <p className="learn-lede">{course.subtitle}</p> : null}
        <p>{course.blurb}</p>
        <p>
          Lessons run about five to eight minutes each and end with a short recall quiz, so you
          find out what stuck before you move on.
        </p>

        <CourseProgress course={course} />
      </header>

      <hr className="learn-rule" />

      {groups.map((group) => (
        <section key={group.part ? `part-${group.part.n}` : 'unsorted'} className={styles.part}>
          {group.part ? (
            <h2 className={styles.partHeading}>
              <span>Part {group.part.n}</span>
              <span aria-hidden="true">·</span>
              <span className={styles.partName}>{group.part.name}</span>
            </h2>
          ) : null}

          <div className={styles.list}>
            {group.lessons.map((lesson) => (
              <Reveal key={lesson.slug} delay={revealIndex++ * 60} className={styles.reveal}>
                <LessonCard lesson={lesson} courseSlug={course.slug} />
              </Reveal>
            ))}
          </div>
        </section>
      ))}

      <p className={styles.note}>
        Work through it in order the first time — each lesson leans on the one before it. After
        that, come back to any of them on their own.
      </p>
    </div>
  )
}
