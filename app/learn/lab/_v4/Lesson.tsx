import { Quiz } from '../../_components/Quiz'
import type { LessonVariantProps } from '../variants'
import { Onward } from './Onward'
import { Plate } from './Plate'
import s from './v4.module.css'

/**
 * CANDIDATE 4 — THE SPREAD
 *
 * A lesson is two facing pages. The prose is one of them. Everything that
 * is not prose is the other, and it stays beside the reading instead of
 * interrupting it.
 *
 * The thesis is about the axis. The lesson page this replaces runs every
 * piece of apparatus down the same spine as the words — a position strip,
 * then a why-band, then the prose, then the takeaways, then a full-width
 * quiz, then further reading, then prev/next — so a reader who came here to
 * understand one thing has to get past seven horizontal interruptions to do
 * it. A scholarly edition does not work that way. It puts the text on one
 * page and its apparatus on the facing one, and the reader's eye chooses
 * between them.
 *
 * So: a RECTO that is only the lesson — title, subtitle, prose, nothing
 * else, ever. A VERSO that gathers everything else. And between them a
 * hairline that is the spine of the spread, drawn as its own element
 * because it is the one piece of structure the whole page rests on.
 *
 * WHAT IS WHERE, AND WHY IT IS THERE
 *
 * The verso is ordered by when each thing is needed, not by the order the
 * old stack happened to have.
 *
 *   The running head  — needed in the first second by a reader who landed
 *                       mid-course from a search result, and still needed
 *                       eight minutes later. So it is the only thing that
 *                       is pinned. See Plate.tsx.
 *   Why this, for you — needed at the start. Printed at the top of the
 *                       verso, beside the opening of the prose.
 *   What you take away — needed at the end. Printed at the foot of the
 *                       verso, where the prose runs out.
 *
 * The middle of the verso is empty, and that is the design rather than a
 * gap in it: it is the outer margin of a page, with the running head riding
 * down it. The risk this thesis carries is the docs-site sidebar — a grey
 * rail of links beside a body of text — and the answer is that there are no
 * links here except the course and the two stops either side. The verso
 * carries this lesson's own apparatus, most of it the owner's own prose. It
 * is a page, not chrome.
 *
 * THE CHECKPOINT IS THE TURN OF THE PAGE
 *
 * The quiz is five questions with real buttons. It does not fit a marginal
 * column, and putting it in the recto would break the one rule the recto
 * has. So it is where the spread ends: the two pages close, the spine stops
 * dead, and the checkpoint runs the full width beneath them. What follows
 * it is a second, short spread — further reading on the verso, the way on
 * down the line on the recto. Those two come after the quiz and not before
 * it, because retrieval practice only works if it is the next thing the
 * reader does, and an exit off the site printed above the quiz is an exit
 * the quiz never gets.
 *
 * ONE COLUMN BELOW 70rem
 *
 * A spread on a phone is not a spread. The order everything falls into is
 * the DOM order below — placement, title, why, prose, takeaways,
 * checkpoint, further reading, the way on — and that is the reading order
 * at every width. The spread is grid placement laid over it, so the source
 * order, the focus order and the phone are one sequence and never three.
 * Where 70rem comes from is worked out in v4.module.css.
 *
 * Server component. The only client code on the page is Quiz, which owns
 * its own answers.
 */
export default function Lesson({ course, lesson, prev, next, body }: LessonVariantProps) {
  return (
    // data-line is what resolves --ln-line for everything below, so the
    // segment in the running head, the rule under the title and the quiz's
    // question bars are all drawn in this course's ink.
    <article className={s.spread} data-line={course.slug}>
      <Plate course={course} lesson={lesson} />

      <header className={s.title}>
        <h1 className="learn-h1">{lesson.title}</h1>
        {lesson.subtitle && <p className="learn-lede">{lesson.subtitle}</p>}

        {/* The one place the line's colour touches the reading column. */}
        <div className="rule-line" aria-hidden="true" />
      </header>

      {/* The spine. Drawn between the two pages and stopping where the leaf
          turns; a second segment below the checkpoint opens the next
          spread. Both are decoration in the strict sense — the structure
          they express is already in the order and the placement — so
          neither is announced. */}
      <div className={s.spine} aria-hidden="true" />

      {lesson.why.trim() !== '' && (
        <aside className={s.why} aria-labelledby="lesson-why">
          <p className="sign-quiet" id="lesson-why">
            WHY THIS, FOR YOU
          </p>
          <p className={s.whyText}>{lesson.why}</p>
        </aside>
      )}

      <div className={`prose ${s.body}`}>{body}</div>

      {lesson.wins.length > 0 && (
        <section className={s.wins} aria-labelledby="lesson-wins">
          <h2 id="lesson-wins" className="sign">
            WHAT YOU TAKE AWAY
          </h2>

          <ol className={s.winsList}>
            {lesson.wins.map((item, index) => (
              <li key={item} className={s.winsItem}>
                {/* The list is already numbered for a screen reader, so the
                    visible numeral is presentational. */}
                <span className={`num ${s.winsN}`} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className={s.quiz}>
        <Quiz courseSlug={course.slug} lessonSlug={lesson.slug} questions={lesson.quiz} />
      </div>

      {lesson.deeper.length > 0 && (
        <section className={s.deeper} aria-labelledby="lesson-deeper">
          <h2 id="lesson-deeper" className="sign-quiet">
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
                  {link.label || link.href}
                  {/* Decorative — the link already opens in a new tab and
                      the label says where it goes. */}
                  <span className={s.out} aria-hidden="true">
                    &#8599;
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={s.spineTurn} aria-hidden="true" />

      <Onward courseSlug={course.slug} prev={prev} next={next} />
    </article>
  )
}
