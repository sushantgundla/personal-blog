import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { WhyBand } from '../../_components/WhyBand'
import type { LessonVariantProps } from '../variants'
import { Rail } from './Rail'
import { Recall } from './Recall'
import { StopLine } from './StopLine'
import { sheetComponents } from './mdx'
import { readSections } from './sections'
import s from './specimen.module.css'

/**
 * V1 — THE SPECIMEN SHEET.
 *
 * A lesson is a document out of the same drawing office as FIG. 1 and
 * FIG. 2, and it is lettered like one. Same cut edge, same inner frame, same
 * rule that nothing crosses a drawing border. The difference is what is in
 * the field: writing, not a machine.
 *
 * Three things carry it.
 *
 * **The title block.** A real one, ruled into cells: the course as the line,
 * the part as the zone, the key plan showing where this stop sits, the stop
 * number and the total, the minutes, then the sheet's name under the course's
 * one rule. That is the whole answer to the reader who arrived cold from a
 * search result — which course, which part, how long, and whether to stay —
 * in one block read at a glance, rather than assembled from four pieces
 * scattered down the page.
 *
 * **The standing margin rail.** A drawing office numbers what is on a sheet
 * down the margin, and a lesson's three sections are already numbered. The
 * rail lists them as callouts — a numeral, a leader, the name — and stays
 * with the reader while they scroll, so the sheet always says which item they
 * are in and they can move between them without hunting. It is the one piece
 * the current lesson page has nothing like. Below 62rem it becomes a ruled
 * contents list under the title block: same items, same links, visible rather
 * than hidden behind a control.
 *
 * **The notes band.** A sheet carries its notes at the foot, so the
 * takeaways, the further reading and the stops either side are gathered
 * there, after the check band rather than before it — the reader retrieves
 * first and reads what they took away second.
 *
 * The measure still rules. Everything below the title block sits on one grid
 * whose middle track is `min(--ln-measure, 100%)` and nothing else, so the
 * reader's NARROW/WIDE switch still decides how wide the prose is. The sheet
 * is drawn around the column, never into it.
 *
 * A server component. Two children need the browser and say why in their own
 * files: `Rail`, because which section you are standing in is a fact about
 * the scroll position, and `Recall`, because a quiz has state.
 */

/** Two digits, so a column of figures lines up. */
function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export default function Lesson({ course, lesson, prev, next }: LessonVariantProps) {
  const stops = course.lessons.length
  const index = course.lessons.findIndex((candidate) => candidate.slug === lesson.slug)
  const current = index === -1 ? 0 : index

  const part = course.parts.find((candidate) => candidate.n === lesson.part)
  const sections = readSections(lesson.content)

  const allStops = `/learn/${course.slug}`
  const hasNotes = lesson.wins.length > 0 || lesson.deeper.length > 0

  return (
    // data-line is what resolves --ln-line for everything below, so the
    // rule under the title, the key plan and the rail's live leader are all
    // drawn in this course's ink.
    <article className={s.specimen} data-line={course.slug}>
      <div className={s.sheetWrap}>
        <div className={s.sheet}>
          {/* ---- the title block ---- */}
          <header className={s.block}>
            <div className={s.ident}>
              <div className={s.identCell}>
                <div className={s.fact}>
                  <span className="sign-quiet">LINE</span>
                  <Link href={allStops} className={`sign ${s.factValue}`}>
                    {course.title}
                  </Link>
                </div>

                {part && (
                  <div className={s.fact}>
                    <span className="sign-quiet">ZONE</span>
                    <span className={`sign ${s.factValue}`}>{part.name}</span>
                  </div>
                )}
              </div>

              <div className={`${s.identCell} ${s.plan}`}>
                <span className="sign-quiet">POSITION ON THE LINE</span>
                <StopLine lessons={course.lessons} current={current} />
              </div>

              <div className={`${s.identCell} ${s.quantities}`}>
                <div className={s.fact}>
                  <span className="sign-quiet">STOP</span>
                  <span className={`num ${s.figure}`}>
                    {pad2(current + 1)} / {pad2(stops)}
                  </span>
                </div>

                {lesson.minutes > 0 && (
                  <div className={s.fact}>
                    <span className="sign-quiet">READING</span>
                    <span className={`num ${s.figure}`}>~{lesson.minutes} MIN</span>
                  </div>
                )}
              </div>
            </div>

            <div className={s.name}>
              <div className={s.nameInner}>
                <h1 className={s.title}>{lesson.title}</h1>
                <div className={s.titleRule} aria-hidden="true" />
                {lesson.subtitle && <p className={s.subtitle}>{lesson.subtitle}</p>}
              </div>
            </div>
          </header>

          {/* ---- the field ---- */}
          <div className={`${s.row} ${s.field}`}>
            <div className={s.railCell}>
              <Rail
                sections={sections}
                hasCheck={lesson.quiz.length > 0}
                hasNotes={hasNotes || Boolean(prev) || Boolean(next)}
              />
            </div>

            <div className={`${s.col} ${s.fieldBody}`}>
              <WhyBand text={lesson.why} />

              <div className={`prose ${s.body}`}>
                <MDXRemote
                  source={lesson.content}
                  components={sheetComponents}
                  options={{
                    mdxOptions: {
                      // Every lesson body uses GitHub-flavoured markdown
                      // tables, which plain MDX does not parse.
                      remarkPlugins: [remarkGfm],
                      // rehype-slug still runs: it gives every h3 an id, and
                      // it is the fallback id for a section heading that
                      // carries no number for the rail to key off.
                      rehypePlugins: [rehypeSlug, rehypeHighlight],
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* ---- the check band ---- */}
          <Recall
            courseSlug={course.slug}
            lessonSlug={lesson.slug}
            questions={lesson.quiz}
          />

          {/* ---- the notes band ---- */}
          <footer id="lesson-notes" className={s.notes}>
            {hasNotes && (
              <div className={`${s.row} ${s.notesRow}`}>
                <div className={s.railCell}>
                  <div className={`${s.margin} ${s.notesLabel}`}>
                    <p className="sign-quiet">NOTES</p>
                  </div>
                </div>

                <div className={`${s.wide} ${s.notesCells}`}>
                  {lesson.wins.length > 0 && (
                    <section className={s.notesCell} aria-labelledby="lesson-wins">
                      <h2 id="lesson-wins" className={`sign ${s.notesHead}`}>
                        WHAT YOU TAKE AWAY
                      </h2>

                      <ol className={s.winList}>
                        {lesson.wins.map((item, i) => (
                          <li key={item} className={s.win}>
                            {/* The list is already numbered for a screen
                                reader, so the visible numeral is
                                presentational. */}
                            <span className={`num ${s.winN}`} aria-hidden="true">
                              {pad2(i + 1)}
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ol>
                    </section>
                  )}

                  {lesson.deeper.length > 0 && (
                    <section className={s.notesCell} aria-labelledby="lesson-deeper">
                      <h2 id="lesson-deeper" className={`sign-quiet ${s.notesHead}`}>
                        GO DEEPER
                      </h2>

                      <ul className={s.deeperList}>
                        {lesson.deeper.map((link) => (
                          <li key={link.href} className={s.deeperRow}>
                            <a
                              className={s.deeperLink}
                              href={link.href}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <span className={s.deeperText}>{link.label || link.href}</span>
                              {/* Decorative — the link already opens in a new
                                  tab and the label says where it goes. */}
                              <span className={s.deeperOut} aria-hidden="true">
                                &#8599;
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              </div>
            )}

            {/* The line continuing, across the foot of the sheet. The first
                and last stop of a course have only one neighbour; rather
                than leave a gap, that half goes back to the whole line. */}
            <nav className={s.ends} aria-label="Lesson navigation">
              <Link
                className={s.end}
                href={prev ? `${allStops}/${prev.slug}` : allStops}
                rel={prev ? 'prev' : undefined}
              >
                <span className="sign-quiet">&larr; PREVIOUS STOP</span>
                <span className={`sign ${s.endName}`}>
                  {prev ? prev.title : 'ALL STOPS ON THIS LINE'}
                </span>
              </Link>

              <Link
                className={`${s.end} ${s.endNext}`}
                href={next ? `${allStops}/${next.slug}` : allStops}
                rel={next ? 'next' : undefined}
              >
                <span className="sign-quiet">NEXT STOP &rarr;</span>
                <span className={`sign ${s.endName}`}>
                  {next ? next.title : 'ALL STOPS ON THIS LINE'}
                </span>
              </Link>
            </nav>
          </footer>
        </div>
      </div>
    </article>
  )
}
