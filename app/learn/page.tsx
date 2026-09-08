import type { Metadata } from 'next'
import { getAllCourses } from '@/lib/learn'
import { learnCanonical } from '@/lib/learn-domain'
import { Network } from './_components/Network'
import styles from './page.module.css'

/**
 * The /learn index. The diagram is the page: one line per course, every tick a
 * real lesson. The heading above it says where a stranger has landed,
 * and the only prose sits under it, out of the way.
 *
 * Everything hangs off one left edge — `.bleed`'s --ln-gutter — heading,
 * diagram and prose alike. A centred reading column belongs to the lesson
 * page; on a signage surface the left edge is the spine.
 *
 * Server component — getAllCourses() reads the filesystem at build time.
 */

export const metadata: Metadata = {
  title: 'Learn to build with AI',
  description:
    'Free, hands-on courses for engineers who can already code but have not built with LLMs. Short lessons, real mechanics, a quiz at the end of each.',
  // Points at learn.sushantgundla.com once the switch is on, so search
  // engines settle on the subdomain. Adds nothing while it is off.
  ...learnCanonical('/'),
}

export default function LearnIndexPage() {
  const courses = getAllCourses()

  if (courses.length === 0) {
    return (
      <div className="bleed">
        <h1 className="learn-h1">Learn to build with AI</h1>
      </div>
    )
  }

  return (
    <>
      <div className={`bleed ${styles.top}`}>
        <h1 className="learn-h1">Learn to build with AI</h1>
      </div>

      <div className="bleed">
        <Network courses={courses} />
      </div>

      <div className={`bleed ${styles.foot}`}>
        <p>
          The bits nobody writes down, in the order you actually need them. Free, hands-on
          courses for engineers who can already code but have not built with LLMs. Lessons are
          short and stick to the real mechanics — what the model is doing, why it does the odd
          thing it just did, and what to reach for instead. Each one ends with a quick recall
          quiz.
        </p>
        <p className={styles.note}>
          Everything here is free and stays free. Your progress is kept in this browser only —
          no account, nothing sent anywhere.
        </p>
      </div>
    </>
  )
}
