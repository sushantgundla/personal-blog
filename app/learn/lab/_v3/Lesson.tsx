import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import type { LessonVariantProps } from '../variants'
import { Line } from './Line'
import { Recall } from './Recall'
import { v3Components } from './mdx'
import s from './v3.module.css'

/**
 * V3 — ONE COLUMN, NOTHING ELSE.
 *
 * Every other answer to this brief adds structure. This one takes it
 * away. The section's own principle is that prose is the product and
 * everything serves the reading column or gets out of its way, and the
 * page it replaces did not believe it: a reader met a full-width band, a
 * title, a rule and a notice before a sentence of the lesson, and the
 * quiz broke out of the column into a second band. Here the <article> IS
 * the column. Nothing is full width, nothing is a strip, nothing breaks
 * out, and there is no second region on the page.
 *
 * Nothing is dropped either — the thesis is reduction, not deletion.
 * Every fact the old page carried is here, in the column:
 *
 *   the course and the part ... the masthead line, above the title
 *   the stop and the minutes .. the figures, under the line
 *   the position ............... the line itself, which is also the rule
 *                               under the title and the only course ink
 *                               on the page
 *   why this, for you .......... a note, under one hairline
 *   the lesson ................. the body
 *   what you take away ......... five lines, one step up the scale
 *   recall ..................... a checkpoint inside the column, bounded
 *                               by the page's only double rule
 *   go deeper .................. the exits, with their hosts
 *   the stops either side ...... the foot
 *
 * With no layout to hide behind, the page rests on a type scale, a
 * spacing scale and three rule weights that each mean one thing. All
 * three are set out at the top of v3.module.css.
 *
 * A server component. Only the quiz needs the browser, and only because
 * answering is state.
 */

/** Two digits, so STOP 07 / 17 stays in one tabular column. */
function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * The host a further-reading link goes to, read off the href rather than
 * written down anywhere. Relative or malformed hrefs simply get none.
 */
function hostOf(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export default function Lesson({ course, lesson, prev, next }: LessonVariantProps) {
  const stops = course.lessons.length
  const index = course.lessons.findIndex((candidate) => candidate.slug === lesson.slug)
  const current = index === -1 ? 0 : index
  const part = course.parts.find((candidate) => candidate.n === lesson.part)
  const allStops = `/learn/${course.slug}`

  return (
    // data-line resolves --ln-line for everything below, so the one rule
    // that carries colour is drawn in this course's ink. The article is
    // .measure itself: there is no wrapper, because there is nothing
    // outside the column to wrap.
    <article data-line={course.slug} className={`measure ${s.column}`}>
      <header>
        {/* Names first. The course at full ink because it is the name of
            the publication this page belongs to, and a link back to it;
            the part stepped back because it qualifies that name. A cold
            reader landing from a search result reads these two before
            anything else on the page. */}
        <p className={s.place}>
          <Link href={allStops} className={`sign ${s.course}`}>
            {course.title}
          </Link>
          {part && (
            <>
              <span className={s.sep} aria-hidden="true" />
              <span className="sign-quiet">{part.name}</span>
            </>
          )}
        </p>

        <h1 className={s.title}>{lesson.title}</h1>
        {lesson.subtitle && <p className={s.lede}>{lesson.subtitle}</p>}

        <Line course={course} current={current} />

        {/* The figures the line is drawn from, in words, at the two ends
            of the column: which stop this is, and how long it takes. */}
        <p className={`num ${s.figures}`}>
          <span>
            STOP {pad2(current + 1)} / {pad2(stops)}
          </span>
          {lesson.minutes > 0 && <span>~{lesson.minutes} MIN</span>}
        </p>
      </header>

      {lesson.why.trim() && (
        <section className={s.why} aria-labelledby="v3-why">
          <h2 id="v3-why" className={`sign-quiet ${s.label}`}>
            WHY THIS, FOR YOU
          </h2>
          <p className={s.whyText}>{lesson.why}</p>
        </section>
      )}

      {/* .prose is this section's reading typography and it was tuned on
          these lessons; v3.module.css changes only what this design
          changes — the opening paragraph, the section markers, the
          sub-heads and the tables. The body is rendered here rather than
          taken from `body` because the component map is one of those
          changes. */}
      <div className={`prose ${s.body}`}>
        <MDXRemote
          source={lesson.content}
          components={v3Components}
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

      {lesson.wins.length > 0 && (
        <section className={s.take} aria-labelledby="v3-wins">
          <h2 id="v3-wins" className={`sign ${s.label}`}>
            WHAT YOU TAKE AWAY
          </h2>

          <ol className={s.takeList}>
            {lesson.wins.map((item, i) => (
              <li key={item} className={s.takeItem}>
                {/* The list is already numbered for a screen reader, so
                    the visible numeral is presentational. */}
                <span className={`num ${s.takeN}`} aria-hidden="true">
                  {pad2(i + 1)}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <Recall courseSlug={course.slug} lessonSlug={lesson.slug} questions={lesson.quiz} />

      {lesson.deeper.length > 0 && (
        <section className={s.deeper} aria-labelledby="v3-deeper">
          <h2 id="v3-deeper" className={`sign-quiet ${s.label}`}>
            GO DEEPER
          </h2>

          <ul className={s.deeperList}>
            {lesson.deeper.map((link) => {
              const host = hostOf(link.href)

              return (
                <li key={link.href} className={s.deeperRow}>
                  <a
                    className={s.deeperLink}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className={s.deeperLabel}>{link.label || link.href}</span>
                    {/* Whose page it is, read off the href. A reader
                        deciding whether to spend a click wants to know
                        that, and it is also what says the link leaves
                        the site. */}
                    {host && (
                      <span className={`num ${s.deeperHost}`} aria-hidden="true">
                        {host}
                      </span>
                    )}
                  </a>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* The line continuing. Two rows, both flush left, because this
          page has one left edge and the last thing on it should not be
          the first to break it. The first and last stop of a course have
          only one neighbour; rather than leave a gap, that row goes back
          to the whole line. */}
      <nav className={s.ends} aria-label="Lesson navigation">
        <Link
          className={s.end}
          href={prev ? `${allStops}/${prev.slug}` : allStops}
          rel={prev ? 'prev' : undefined}
        >
          <span className={`sign-quiet ${s.endLabel}`}>&larr; PREVIOUS STOP</span>
          <span className={`sign ${s.endName}`}>
            {prev ? prev.title : 'ALL STOPS ON THIS LINE'}
          </span>
        </Link>

        <Link
          className={s.end}
          href={next ? `${allStops}/${next.slug}` : allStops}
          rel={next ? 'next' : undefined}
        >
          <span className={`sign-quiet ${s.endLabel}`}>NEXT STOP &rarr;</span>
          <span className={`sign ${s.endName}`}>
            {next ? next.title : 'ALL STOPS ON THIS LINE'}
          </span>
        </Link>
      </nav>
    </article>
  )
}
