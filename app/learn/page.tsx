import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllCourses } from '@/lib/learn'
import { learnCanonical } from '@/lib/learn-domain'
import { plateFace } from './_plate/font'
import { MachineNarrow } from './_plate/MachineNarrow'
import { MachineWide } from './_plate/MachineWide'
import { buildStages, inWords } from './_plate/stages'
import s from './_plate/plate.module.css'

/**
 * The /learn index — THE ANATOMY.
 *
 * The index should teach you the shape of the system before it offers you
 * anything. So the page is one draughting plate of one request drawn as a
 * working machine — a prompt in, cut into tokens, a query out to a corpus,
 * retrieved passages joining it at the context window, the model, a loop out
 * to a tool and back, an answer out, a gauge tapping it — and the courses are
 * not filed beside that drawing, they are the parts of it.
 *
 * The drawing rests in graphite and holds no colour at all, except the five
 * inked callout rings that tie it to the legend. Colour is the answer to a
 * question: hold a stage and it alone takes its course's ink. Somebody who
 * reads nothing else leaves knowing how an LLM application is put together,
 * which is the argument for reading the rest.
 *
 * Server component throughout. getAllCourses() reads content/learn/ at build
 * time, the whole page is static, and it ships no JavaScript of its own —
 * the reveal is a :has() rule and the motion is two keyframes.
 */

export const metadata: Metadata = {
  title: 'Learn to build with AI',
  description:
    'Free, hands-on courses for engineers who can already code but have not built with LLMs. Short lessons, real mechanics, a quiz at the end of each.',
  // Points at learn.sushantgundla.com once the switch is on, so search
  // engines settle on the subdomain. Adds nothing while it is off.
  ...learnCanonical('/'),
}

export default function LearnAnatomyPage() {
  const courses = getAllCourses()
  const stages = buildStages(courses)

  // Every figure on this page is summed or measured from the lessons' own
  // frontmatter. PRODUCT.md forbids inventing a number anywhere on this site,
  // so nothing below is written by hand — including the word "five", which is
  // counted from the stages the drawing actually covers.
  const drawn = stages.filter((stage) => stage.n !== null).length
  const lessons = courses.flatMap((course) => course.lessons)
  const lessonCount = lessons.length
  const minuteCount = lessons.reduce((sum, lesson) => sum + lesson.minutes, 0)

  // The one figure a stranger deciding in three seconds actually needs: not
  // what the whole catalogue costs, but what one sitting costs.
  const shortest = lessonCount > 0 ? Math.min(...lessons.map((l) => l.minutes)) : 0
  const longest = lessonCount > 0 ? Math.max(...lessons.map((l) => l.minutes)) : 0
  const perLesson = shortest === longest ? String(shortest) : `${shortest}–${longest}`

  if (courses.length === 0) {
    return (
      <div className={`${plateFace.variable} ${s.sheetWrap}`}>
        <section className={s.plate}>
          <div className={s.strip}>
            <div className={s.stripCell}>
              <h1 className={s.h1}>Learn to build with AI</h1>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className={`${plateFace.variable} ${s.sheetWrap}`}>
      <section className={s.plate}>
        {/* ---- The title strip ---------------------------------------- */}
        <div className={s.strip}>
          <div className={s.stripCell}>
            <h1 className={s.h1}>Learn to build with AI</h1>
            <p className={s.thesis}>
              One request, drawn end to end, in {inWords(drawn)} parts. Each part is one of
              the courses.
            </p>
          </div>

          <div className={s.stripCell}>
            <p className={s.figLabel}>Fig. 1 — one request, end to end</p>

            {/* The key is drawn with the same pens as the drawing — see
                .keyLine in plate.module.css. A CSS dotted border keys a line
                that is not on this sheet. */}
            <div className={s.notation}>
              <span className={s.notationRow}>
                <svg className={s.keyLine} viewBox="0 0 60 8" aria-hidden="true" focusable="false">
                  <path className={s.flow} d="M0 4H60" />
                </svg>
                The request travels here
              </span>
              <span className={s.notationRow}>
                <svg className={s.keyLine} viewBox="0 0 60 8" aria-hidden="true" focusable="false">
                  <path className={s.cond} d="M0 4H60" />
                </svg>
                Only if the model calls a tool
              </span>
              <span className={s.notationRow}>
                <svg className={s.keyLine} viewBox="0 0 60 8" aria-hidden="true" focusable="false">
                  <path className={s.obs} d="M0 4H60" />
                </svg>
                Watching — carries nothing
              </span>
            </div>
          </div>

          <div className={`${s.stripCell} ${s.stripFigures}`}>
            <div className={s.tally}>
              <span className={s.tallyFig}>{courses.length}</span>
              <span className={s.tallyKey}>courses</span>
              <span className={s.tallyFig}>{lessonCount}</span>
              <span className={s.tallyKey}>lessons</span>
              <span className={s.tallyFig}>{perLesson}</span>
              <span className={s.tallyKey}>min a lesson</span>
              <span className={s.tallyFig}>{minuteCount}</span>
              <span className={s.tallyKey}>min in total</span>
            </div>
          </div>
        </div>

        {/* ---- The drawing --------------------------------------------
            Both plates are aria-hidden. The ordered description below is
            what a screen reader gets instead, and it has to carry
            everything the drawing carries — including the two facts the
            drawing states in words rather than lines. */}
        <div className={s.drawing}>
          <div className={s.sr}>
            <h2>Figure 1: how one request moves through the machine</h2>
            <ol>
              <li>A prompt goes in — a system prompt, then the user&rsquo;s turn.</li>
              <li>It is cut into tokens.</li>
              <li>
                Everything meets at the context window. Retrieved passages arrive there too:
                the prompt goes back out as a query to a corpus, candidates come back, they
                are ranked, and only the top few are kept.
              </li>
              <li>
                The model runs — a stack of layers, with attention running across the tokens
                inside each layer.
              </li>
              <li>
                The model either stops, or calls a tool. A tool result comes back round into
                the context window and the loop runs again.
              </li>
              <li>An answer comes out, in the shape the prompt asked for.</li>
              <li>
                The output is tapped on the way past, traced and scored — and so is what
                retrieval brought back.
              </li>
              <li>
                Two things the drawing does not show: retrieved passages and tool results are
                counted in tokens too, and the context window&rsquo;s limit covers what comes
                out as well as what goes in.
              </li>
            </ol>
          </div>

          <MachineWide />
          <MachineNarrow />
        </div>

        {/* ---- The legend ---------------------------------------------
            Numbered to the callouts on the drawing. Everything here is
            readable without touching anything; holding one is what swings
            its part of the machine into this ink. */}
        <h2 className={s.sr} id="v1-legend">
          Key to Figure 1 — the {inWords(drawn)} parts, and the course that teaches each
        </h2>
        <ol className={s.legend} role="list" aria-labelledby="v1-legend">
          {stages.map((stage) => (
            <li key={stage.id} className={s.cell} data-line={stage.id}>
              <span className={s.swatch} aria-hidden="true" />

              <span className={s.cellHead}>
                {stage.n === null ? (
                  <span className={s.unmapped}>Not on the drawing</span>
                ) : (
                  <>
                    <span className={s.calloutN} aria-hidden="true">
                      {stage.n}
                    </span>
                    <span className={s.part}>{stage.part}</span>
                  </>
                )}
              </span>

              {stage.role !== null && <p className={s.role}>{stage.role}</p>}

              <Link
                href={stage.href}
                className={s.cellLink}
                data-line={stage.id}
                aria-label={
                  stage.n === null
                    ? `${stage.title} — not on the drawing. ${stage.lessons} lessons, ${stage.minutes} minutes.`
                    : `${stage.title} — part ${stage.n} of the drawing, ${stage.part}. ${stage.lessons} lessons, ${stage.minutes} minutes.`
                }
              >
                {stage.title}
                <span className={s.arrow} aria-hidden="true">
                  {' →'}
                </span>
              </Link>

              <p className={s.sub}>{stage.subtitle}</p>
              <p className={s.figs}>
                {stage.lessons} lessons · {stage.minutes} min
              </p>
            </li>
          ))}
        </ol>

        {/* ---- Notes ---------------------------------------------------
            The owner's own two paragraphs, verbatim, set where a sheet
            carries its notes — plus the one note the drawing needs
            because two true things about it could not be drawn without
            crowding the parts they are about. */}
        <div className={s.notes}>
          <p className={s.notesLabel}>Notes</p>
          <p className={s.note}>
            The bits nobody writes down, in the order you actually need them. Free, hands-on
            courses for engineers who can already code but have not built with LLMs. Lessons are
            short and stick to the real mechanics — what the model is doing, why it does the odd
            thing it just did, and what to reach for instead. Each one ends with a quick recall
            quiz.
          </p>
          <div className={s.noteStack}>
            <p className={s.noteQuiet}>
              What the drawing leaves out: retrieved passages and tool results are counted in
              tokens too, and the context window&rsquo;s limit covers what comes out as well as
              what goes in.
            </p>
            <p className={s.noteQuiet}>
              Everything here is free and stays free. Your progress is kept in this browser only
              — no account, nothing sent anywhere.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
