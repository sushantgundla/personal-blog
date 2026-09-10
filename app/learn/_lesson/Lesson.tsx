import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Course, Lesson as LessonData } from '@/lib/learn'
import { displayFace, readingFace } from './font'
import { Recall } from './Recall'
import s from './lesson.module.css'

/**
 * One lesson — the page most readers land on first, straight from a
 * search result.
 *
 * It is a printed spread: one column of type centred in the window,
 * the reading measure left-aligned inside it, and tables and code
 * taking the whole spread and growing right into the air. A raised
 * initial opens it, a byline row closes the title block, section
 * heads carry an italic numeral, and a takeaway is lifted as a pull
 * quote. Bodoni Moda over Newsreader; see font.ts.
 *
 * The ground is the index sheet's, not this page's own: /learn is
 * drawn on a cold graphite plate with the site's own orange as its
 * single warm value, and this page takes those exact tokens, so
 * index, course and lesson are one publication and a reader never
 * changes worlds walking between them. The full reconciliation, the
 * two accents' jobs and the measured contrast of every value are in
 * the header of lesson.module.css.
 *
 * Position is stated in words — LESSON 01 / 17 — and in nothing
 * else. There is no track, no route and no mark showing where the
 * reader is on a line, by instruction; see "Arguments already had"
 * in app/learn/DESIGN.md.
 *
 * The body arrives as `children` because the route above owns the
 * MDX pipeline. It is rendered through this page's own component map
 * (mdx.tsx) — the section head, the code block and the table are
 * part of the design and not part of the markdown.
 */

interface Props {
  course: Course
  lesson: LessonData
  prev: LessonData | null
  next: LessonData | null
  /** The lesson body, already rendered by app/learn/[course]/[lesson]/page.tsx. */
  children: ReactNode
}

/** Two digits, so a figure stays in one tabular column. */
function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** "https://platform.openai.com/docs/..." -> "platform.openai.com" */
function hostOf(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function Lesson({ course, lesson, prev, next, children }: Props) {
  const part = course.parts.find((candidate) => candidate.n === lesson.part)
  const courseHref = `/learn/${course.slug}`

  return (
    // data-course is what resolves --ln-course to this course's ink for
    // the whole subtree, from one attribute. app/learn/learn.css owns
    // that mapping, and the four rules below are the only things that
    // read it.
    <article
      className={`${displayFace.variable} ${readingFace.variable} ${s.page}`}
      data-course={course.slug}
    >
      <header className={s.opener}>
        <p className={s.kicker}>
          <Link href={courseHref} className={s.kickerLink}>
            {course.title}
          </Link>
          {part ? (
            <>
              <span className={s.kickerSep} aria-hidden="true">
                /
              </span>
              {part.name}
            </>
          ) : null}
        </p>

        <h1 className={s.title}>{lesson.title}</h1>

        {lesson.subtitle ? <p className={s.standfirst}>{lesson.subtitle}</p> : null}

        {/* The two figures set the way a title block sets its
            quantities: mono and tabular, so they sit in the same
            character columns on every lesson in the course. The rule
            under the row is the second of the page's four course-ink
            bands, and it is what closes the title block. */}
        <p className={s.byline}>
          <span className={s.bylineName}>Sushant Gundla</span>

          <span className={s.fact}>
            LESSON {pad2(lesson.order)} / {pad2(course.lessons.length)}
          </span>

          {lesson.minutes > 0 ? <span className={s.fact}>~{lesson.minutes} MIN</span> : null}
        </p>
      </header>

      {/* The opening paragraph, with the raised initial. Its label goes
          out into the right margin once there is a margin wide enough
          to hold it, and sits above the text before that. The label is
          a heading because the block is a section of the page, not an
          aside. */}
      {lesson.why.trim() ? (
        <section className={s.whyBlock} aria-labelledby="lesson-why">
          <h2 className={s.whyLabel} id="lesson-why">
            WHY THIS, FOR YOU
          </h2>
          <p className={s.why}>{lesson.why}</p>
        </section>
      ) : null}

      <div className={s.prose}>{children}</div>

      {lesson.wins.length > 0 ? (
        <section className={s.takeaways} aria-labelledby="lesson-wins">
          <h2 className={s.sectionHead} id="lesson-wins">
            WHAT YOU TAKE AWAY
          </h2>

          {/* One ordered list, all five in order. The first is set as
              the pull quote — it is the lead takeaway, so it is the
              line worth lifting — and the rest run in two columns
              under it once there is room for two. */}
          <ol className={s.winList}>
            {lesson.wins.map((win, index) => (
              <li key={win} className={`${s.win} ${index === 0 ? s.winLead : s.winRest}`}>
                <span>{win}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <Recall courseSlug={course.slug} lessonSlug={lesson.slug} questions={lesson.quiz} />

      {lesson.deeper.length > 0 ? (
        <section className={s.deeper} aria-labelledby="lesson-deeper">
          <h2 className={s.sectionHead} id="lesson-deeper">
            GO DEEPER
          </h2>

          <ul className={s.deeperList}>
            {lesson.deeper.map((link) => {
              const host = hostOf(link.href)

              return (
                <li key={link.href}>
                  <a
                    className={s.deeperLink}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className={s.deeperLabel}>
                      {link.label || link.href}
                      <span className={s.sr}> (opens in a new tab)</span>
                    </span>
                    {/* The address the link already carries, shown so a
                        reader can see where they are being sent, and
                        hidden from a screen reader, which would
                        otherwise hear it twice. */}
                    {host ? (
                      <span className={s.deeperHost} aria-hidden="true">
                        {host}
                      </span>
                    ) : (
                      <span />
                    )}
                  </a>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {/* The lessons either side. Named, not drawn: this is the whole
          of the page's navigation and there is no track anywhere on
          it.

          The first and last lesson of a course have only one
          neighbour, and rather than leave a gap that half goes back to
          the course — so the row is always two links wide and neither
          half is ever a dead end. */}
      <nav className={s.pager} aria-label="Lesson navigation">
        <Link
          className={s.pagerLink}
          href={prev ? `/learn/${course.slug}/${prev.slug}` : courseHref}
          rel={prev ? 'prev' : undefined}
        >
          <span className={s.pagerLabel}>&larr; PREVIOUS</span>
          <span className={s.pagerTitle}>
            {prev ? prev.title : 'ALL LESSONS IN THIS COURSE'}
          </span>
        </Link>

        <Link
          className={`${s.pagerLink} ${s.pagerNext}`}
          href={next ? `/learn/${course.slug}/${next.slug}` : courseHref}
          rel={next ? 'next' : undefined}
        >
          <span className={s.pagerLabel}>NEXT &rarr;</span>
          <span className={s.pagerTitle}>
            {next ? next.title : 'ALL LESSONS IN THIS COURSE'}
          </span>
        </Link>
      </nav>
    </article>
  )
}
