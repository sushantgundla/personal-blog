import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import type { ComponentProps } from 'react'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { Deeper } from '../../_components/Deeper'
import { PrevNext } from '../../_components/PrevNext'
import { Quiz } from '../../_components/Quiz'
import { WhyBand } from '../../_components/WhyBand'
import { Wins } from '../../_components/Wins'
import { mdxComponents } from '../../_components/mdx'
import type { LessonVariantProps } from '../variants'
import Rail from './Rail'
import {
  HEAD_ID,
  RECALL_ID,
  readSections,
  sectionId,
  splitLeadingNumber,
  type Station,
} from './sections'
import s from './Lesson.module.css'

/**
 * CANDIDATE 2 — THE LINE DOWN THE EDGE.
 *
 * The section's contract already says a lesson is a stop on a line. The
 * page this replaces spends sixty-four pixels at the top saying so and
 * then abandons the idea for the rest of the lesson. This one takes it
 * literally: the line is stood up, run down the full height of the
 * reading in the course's own ink, and the reader's own position in the
 * prose is their position on it. See Rail.tsx for how the two scales — a
 * course of seventeen stops, a lesson of three sections — are drawn as one
 * line with a break in it rather than as two lines side by side.
 *
 * THE LAYOUT IS ONE GRID, four tracks: air, the line, the reading column,
 * air. The column is still a character measure and never a pixel width, so
 * it answers the reader's NARROW / WIDE switch exactly as .measure does,
 * and the two outer tracks are 1fr so the line and the column stay
 * centred as a pair. What the reader loses to the line is the half of it
 * that stands to the left of centre — about thirty pixels on a laptop.
 *
 * WHAT IS REUSED AND WHAT IS NOT. The apparatus below the prose is the
 * section's own and stays: the notice, what you take away, the recall
 * band, the reading list, the two ways off the page. The position strip
 * is gone, because it is the thing this candidate replaces. The section
 * heading is re-authored, because the drawing needs to point at it: the
 * rail's tick and the heading's numeral are the same number, taken off
 * the lesson's own markdown, so neither has to reproduce rehype-slug's
 * slugging rules to find the other.
 *
 * A note on the gutter. Inside this column the fluid side gutter is
 * already spent — the grid took it as a track — so the column sets
 * --ln-gutter to zero for everything under it. That is what makes the
 * recall band's own .measure land on exactly the same left edge as the
 * h1, which is what the band is for.
 */

/** Two digits, so "STOP 07 / 17" stays in one tabular column. */
function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * A numbered section heading — a stop board in the column. The rule
 * closes the section before it, the numeral is the one the rail letters
 * beside its tick, and the id is derived from that same numeral so the
 * two can never drift.
 */
function Section({ children, ...props }: ComponentProps<'h2'>) {
  const { number, rest } = splitLeadingNumber(children)

  if (number === null) {
    return <h2 {...props}>{children}</h2>
  }

  return (
    <h2 {...props} id={sectionId(number)} className={s.section}>
      {/* The number is already in the heading's text for a screen reader,
          so the marker is presentational. */}
      <span className={`num ${s.sectionN}`} aria-hidden="true">
        {number}
      </span>
      <span className={s.sectionText}>{rest}</span>
    </h2>
  )
}

/** The section's own map, with the one heading this candidate re-draws. */
const components = { ...mdxComponents, h2: Section }

export default function Lesson({ course, lesson, prev, next }: LessonVariantProps) {
  const part = course.parts.find((candidate) => candidate.n === lesson.part)
  const index = course.lessons.findIndex((candidate) => candidate.slug === lesson.slug)
  const current = index === -1 ? 0 : index

  // The stops on this lesson's own scale: the head, every numbered
  // section, and the checkpoint. Read off the lesson body, so a lesson
  // with two sections or four draws a line with two or four ticks.
  const stations: Station[] = [
    { id: HEAD_ID, name: lesson.title, tag: '' },
    ...readSections(lesson.content).map((section) => ({
      id: sectionId(section.n),
      name: `${section.n}. ${section.title}`,
      tag: section.n,
    })),
  ]
  if (lesson.quiz.length > 0) {
    stations.push({ id: RECALL_ID, name: 'Recall', tag: 'RECALL' })
  }

  // Only the slug and the title cross to the client. Handing the whole
  // course over would put every lesson's full MDX body in the payload.
  const stops = course.lessons.map((stop) => ({ slug: stop.slug, title: stop.title }))

  return (
    // data-line resolves --ln-line for everything below, so the line, the
    // rule under the meta and the bars in the quiz are all this course's ink.
    <article className={s.sheet} data-line={course.slug}>
      <Rail
        courseSlug={course.slug}
        stops={stops}
        current={current}
        prev={prev ? { slug: prev.slug, title: prev.title } : null}
        next={next ? { slug: next.slug, title: next.title } : null}
        stations={stations}
      />

      <div className={s.column}>
        {/* The stop board. A reader who landed here from a search result
            has the line, the zone, how far along and how long it takes
            before the title, which is the order they ask in. */}
        <header id={HEAD_ID} className={s.head}>
          <p className={s.headRow}>
            <Link href={`/learn/${course.slug}`} className={`sign ${s.course}`}>
              {course.title}
            </Link>
            <span className="num">
              STOP {pad2(current + 1)} / {pad2(course.lessons.length)}
            </span>
          </p>

          <p className={s.headRow}>
            <span className="sign-quiet">{part ? part.name : ''}</span>
            <span className="num">{lesson.minutes > 0 ? `~${lesson.minutes} MIN` : ''}</span>
          </p>

          {/* The one place the line's colour lands in the column. */}
          <div className="rule-line" aria-hidden="true" />

          <h1 className="learn-h1">{lesson.title}</h1>
          {lesson.subtitle && <p className="learn-lede">{lesson.subtitle}</p>}
        </header>

        <WhyBand text={lesson.why} />

        <div className={`prose ${s.prose}`}>
          <MDXRemote
            source={lesson.content}
            components={components}
            options={{
              mdxOptions: {
                // Every lesson body uses GitHub-flavoured markdown tables,
                // which plain MDX does not parse.
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeSlug, rehypeHighlight],
              },
            }}
          />
        </div>

        <Wins items={lesson.wins} />

        {/* The checkpoint is a stop on the line, so it owns an id the rail
            can point at and enough scroll margin to clear the sticky sign. */}
        <div id={RECALL_ID} className={s.checkpoint}>
          <Quiz courseSlug={course.slug} lessonSlug={lesson.slug} questions={lesson.quiz} />
        </div>

        <Deeper links={lesson.deeper} />

        {/* The rail's termini are the same two stops, and they are small
            and always on screen. This is the other one: full names, thumb
            sized, at the point in the page where the reader is deciding
            what to do next. The two navs carry different aria-labels so
            the pair is never announced twice as one list. */}
        <PrevNext courseSlug={course.slug} prev={prev} next={next} />
      </div>
    </article>
  )
}
