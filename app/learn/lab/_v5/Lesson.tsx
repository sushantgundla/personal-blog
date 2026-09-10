import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { Deeper } from '../../_components/Deeper'
import { PrevNext } from '../../_components/PrevNext'
import type { LessonVariantProps } from '../variants'
import { Check } from './Check'
import { ReadMark } from './ReadMark'
import { Track } from './Track'
import { worksheetComponents } from './mdx'
import { splitWorkItems } from './split'
import s from './worksheet.module.css'

/**
 * v5 — THE WORKSHEET.
 *
 * The reader is not consuming an article. They have their own retrieval
 * broken, an editor open beside this, and a question. So the page is drawn
 * as the document that job uses: a ruled sheet with a hard left edge, a
 * column of figures down the margin, the lesson's three sections as
 * numbered work items, a summary of work, and a check at the foot.
 *
 * Three decisions carry it.
 *
 * **One column of figures, read down.** Course, part, stop, minutes and
 * read state are quantities, and on a worksheet quantities are ruled into
 * their own column rather than scattered as meta lines. It is the same
 * column the work items' numerals hang in and the same column the check
 * boxes hang in, all the way down the sheet, so the vertical hairline
 * beside it is the one hard edge everything on the page aligns to. That is
 * the first thing the cold reader meets and it answers every question they
 * have before deciding to stay.
 *
 * **The problem statement leads.** `lesson.why` is what is wrong with the
 * reader's system right now, and it is the reason they are here. It gets
 * its own band directly under the title, set larger than the body, rather
 * than the small notice the shipped page gives it.
 *
 * **Ruled, never celled.** Structure is hairlines, hanging indents and
 * space. The band rules stop at the vertical edge instead of crossing it,
 * so the sheet reads as ruled paper with a margin and not as a grid of
 * boxes. There is no fill anywhere, no radius, no shadow and no tint.
 *
 * The body is cut into its three numbered sections by splitWorkItems() and
 * each piece rendered on its own, which is what lets an item's numeral sit
 * in the figures column while its prose sits in the work column. Every
 * chunk goes through the same MDX pipeline the shipped page uses, so
 * tables still scroll, code blocks are still keyboard-reachable, and
 * heading anchors are unchanged.
 *
 * Server component throughout, apart from the two things that read
 * localStorage: the READ field and the check.
 */

/** Two digits, so a column of figures stays in one tabular column. */
function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

const mdxOptions = {
  mdxOptions: {
    // Every lesson body uses GitHub-flavoured markdown tables, which plain
    // MDX does not parse — without this they render as raw pipes.
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug, rehypeHighlight],
  },
}

export default function Lesson({ course, lesson, prev, next }: LessonVariantProps) {
  const stops = course.lessons.length
  const index = course.lessons.findIndex((candidate) => candidate.slug === lesson.slug)
  const current = index === -1 ? 0 : index

  const part = course.parts.find((candidate) => candidate.n === lesson.part)
  const { preamble, items } = splitWorkItems(lesson.content)

  return (
    // data-line is what resolves --ln-line for the subtree, so the track
    // and the rule under the title are drawn in this course's ink.
    <article className={s.sheet} data-line={course.slug}>
      {/* The sheet's own header row: what this document is, and where on
          the line it sits. It spans both columns, because it is the title
          bar rather than a work item. */}
      <div className={s.head}>
        <p className={`sign-quiet ${s.sheetName}`}>WORKSHEET</p>
        <Track stops={course.lessons.map((stop) => stop.slug)} current={current} />
      </div>

      {/* Row 1 — the title block. */}
      <div className={s.row}>
        <div className={s.figs}>
          <dl className={s.figList}>
            <div className={s.figItem}>
              <dt className={s.figLabel}>Course</dt>
              <dd className={s.figValue}>
                <Link href={`/learn/${course.slug}`} className={`sign ${s.courseLink}`}>
                  {course.title}
                </Link>
              </dd>
            </div>

            {part && (
              <div className={s.figItem}>
                <dt className={s.figLabel}>Part {part.n}</dt>
                <dd className={`sign ${s.figValue} ${s.partName}`}>{part.name}</dd>
              </div>
            )}

            <div className={s.figItem}>
              <dt className={s.figLabel}>Stop</dt>
              <dd className={`num ${s.figValue} ${s.figNum}`}>
                {pad2(current + 1)} / {pad2(stops)}
              </dd>
            </div>

            {lesson.minutes > 0 && (
              <div className={s.figItem}>
                <dt className={s.figLabel}>Time</dt>
                <dd className={`num ${s.figValue} ${s.figNum}`}>~{lesson.minutes} MIN</dd>
              </div>
            )}

            <div className={s.figItem}>
              <dt className={s.figLabel}>Read</dt>
              <ReadMark courseSlug={course.slug} lessonSlug={lesson.slug} />
            </div>
          </dl>
        </div>

        <div className={s.work}>
          <h1 className={s.title}>{lesson.title}</h1>
          {lesson.subtitle && <p className={s.lede}>{lesson.subtitle}</p>}
          {/* The one place the line's colour touches the reading column. */}
          <div className={`rule-line ${s.titleRule}`} aria-hidden="true" />
        </div>
      </div>

      {/* Row 2 — the statement of the problem. The most important thing on
          the sheet for somebody who arrived cold from a search result, so
          it is set above body size and given a band of its own. */}
      {lesson.why.trim() && (
        <aside className={`${s.row} ${s.ruled}`} aria-labelledby="lesson-why">
          <div className={s.figs} />
          <div className={s.work}>
            <p className={`sign-quiet ${s.whyLabel}`} id="lesson-why">
              WHY THIS, FOR YOU
            </p>
            <p className={s.whyText}>{lesson.why}</p>
          </div>
        </aside>
      )}

      {/* Row 3 — the opening of the body, before the first numbered
          section. It has no item number because it is not an item. */}
      {preamble && (
        <div className={`${s.row} ${s.ruled}`}>
          <div className={s.figs} />
          <div className={`prose ${s.body} ${s.work}`}>
            <MDXRemote source={preamble} components={worksheetComponents} options={mdxOptions} />
          </div>
        </div>
      )}

      {/* The work items. The numeral is the sheet's structure, not
          decoration: it is the author's own section number, hung in the
          figures column and read out from the heading itself. */}
      {items.map((item, i) => (
        <div key={item.slice(0, 80)} className={`${s.row} ${s.ruled}`}>
          <div className={s.figs}>
            <p className={`num ${s.itemN}`} aria-hidden="true">
              {pad2(i + 1)}
            </p>
          </div>
          <div className={`prose ${s.body} ${s.work}`}>
            <MDXRemote source={item} components={worksheetComponents} options={mdxOptions} />
          </div>
        </div>
      ))}

      {/* The summary of work. Five lines, numerals hanging against the
          margin rule, one hairline between each. */}
      {lesson.wins.length > 0 && (
        <section className={`${s.row} ${s.ruled}`} aria-labelledby="lesson-wins">
          <div className={s.figs} />
          <div className={s.work}>
            <h2 id="lesson-wins" className="sign">
              WHAT YOU TAKE AWAY
            </h2>
            <ol className={s.wins} role="list">
              {lesson.wins.map((win, i) => (
                <li key={win} className={s.win}>
                  {/* The list is already numbered for a screen reader, so
                      the visible numeral is presentational. */}
                  <span className={`num ${s.winN}`} aria-hidden="true">
                    {pad2(i + 1)}
                  </span>
                  <span>{win}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <Check courseSlug={course.slug} lessonSlug={lesson.slug} questions={lesson.quiz} />

      {lesson.deeper.length > 0 && (
        <div className={s.row}>
          <div className={s.figs} />
          <div className={`${s.work} ${s.deeperSlot}`}>
            <Deeper links={lesson.deeper} />
          </div>
        </div>
      )}

      {/* The line continuing. Full width across the foot of the sheet,
          below where the margin rule stops. */}
      <div className={s.footSlot}>
        <PrevNext courseSlug={course.slug} prev={prev} next={next} />
      </div>
    </article>
  )
}
