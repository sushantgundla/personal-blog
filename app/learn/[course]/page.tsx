import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllCourses, getCourse } from '@/lib/learn'
import { learnCanonical } from '@/lib/learn-domain'
import { plateFace } from '../_plate/font'
import { buildStages } from '../_plate/stages'
import { KeyPlan } from '../_sheet/KeyPlan'
import { Schedule } from '../_sheet/Schedule'
import { getDetail, type BayKey } from '../_sheet/details'
import { toZones, zoneDoor } from '../_sheet/parts'
import s from '../_sheet/sheet.module.css'

/**
 * One course — FIG. 2, THE DETAIL SHEET.
 *
 * The index is FIG. 1, the general arrangement of one request. A course page
 * is FIG. 2: that course's own part of the machine, blown up to fill the
 * sheet, with the annotation there was no room for on the general
 * arrangement. A reader who came from FIG. 1 arrives at the same part,
 * magnified, and the key plan in the title strip boxes where they are
 * standing.
 *
 * The parts of the course are the bays of the detail and its numbered
 * callouts; the lessons are the schedule under them. That is deliberately
 * not "every lesson is a callout" — seventeen callouts on one drawing is a
 * mess, four callouts with a schedule beneath each is a drawing, and it is
 * what a drawing office does when the general arrangement runs out of room.
 *
 * The bays are doors, the way FIG. 1's five parts are: click a part of the
 * drawing and it opens that part's first lesson. So both figures behave the
 * same way under the cursor, and a reader who learned on the index that the
 * picture is the navigation does not have to unlearn it here.
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

export default function DetailSheetPage({ params }: Props) {
  const course = getCourse(params.course)
  if (!course) notFound()

  const zones = toZones(course)
  const detail = getDetail(course.slug)

  // Which part of FIG. 1 this course owns, and what that part does — read
  // from the same table the index draws itself from, so the two sheets can
  // never disagree about which stage is which.
  const stage = buildStages(getAllCourses()).find((entry) => entry.id === course.slug) ?? null
  const onFig1 = stage !== null && stage.n !== null

  // Nothing below is written by hand. Every figure is counted or summed
  // from the lessons' own frontmatter, which PRODUCT.md requires.
  const lessons = course.lessons
  const minuteCount = lessons.reduce((sum, lesson) => sum + lesson.minutes, 0)
  const shortest = lessons.length > 0 ? Math.min(...lessons.map((l) => l.minutes)) : 0
  const longest = lessons.length > 0 ? Math.max(...lessons.map((l) => l.minutes)) : 0
  const perLesson = shortest === longest ? String(shortest) : `${shortest}–${longest}`

  /**
   * Bays are keyed by position, so the ring on the drawing carries whatever
   * number the course's part carries on disk. A drawing bay with no part
   * behind it takes no ink; a part past the last bay gets a schedule column
   * with no ring and the words "Not on the detail".
   *
   * `door` is the third thing a bay needs and the reason it is here rather
   * than in the drawings: the five details are pictures, and nothing in them
   * should know an address. A bay opens its part's first lesson, and a part
   * with no lessons yet opens nothing — see zoneDoor().
   */
  const bayKey: BayKey = {
    zone: (index) => (index < zones.length ? String(zones[index].n) : undefined),
    num: (index) => (index < zones.length ? String(zones[index].n) : undefined),
    door: (index) => (index < zones.length ? zoneDoor(course.slug, zones[index]) : undefined),
  }

  const Drawing = detail?.Drawing

  return (
    <div className={`${plateFace.variable} ${s.sheetWrap}`}>
      <section className={s.sheet} data-line={course.slug}>
        {/* ---- The title strip ---------------------------------------- */}
        <div className={s.strip}>
          <div className={s.stripCell}>
            <p className={s.back}>
              <Link href="/learn" className={s.backLink}>
                ← Fig. 1 — one request, end to end
              </Link>
            </p>

            <h1 className={s.h1}>{course.title}</h1>
            {course.subtitle ? <p className={s.thesis}>{course.subtitle}</p> : null}
          </div>

          <div className={s.stripCell}>
            <p className={s.figLabel}>
              Fig. 2 — {stage?.part ?? course.title}, detail at larger scale
            </p>
            {stage?.role ? <p className={s.figRole}>{stage.role}</p> : null}

            {/* The key plan: FIG. 1 reduced to its bones with this course's
                own part boxed in its ink, and a way back to it. */}
            {onFig1 && detail ? (
              <Link
                href="/learn"
                className={s.keyWrap}
                aria-label={`This is a detail of part ${stage.n} on Figure 1. Back to Figure 1.`}
              >
                <KeyPlan boxes={detail.keyBoxes} />
                <span className={s.keyLabel}>Key plan — part {stage.n} on Fig. 1</span>
              </Link>
            ) : (
              <p className={s.undrawn}>Not on Fig. 1 — no detail drawn</p>
            )}
          </div>

          <div className={`${s.stripCell} ${s.stripFigures}`}>
            <div className={s.tally}>
              <span className={s.tallyFig}>{lessons.length}</span>
              <span className={s.tallyKey}>lessons</span>
              <span className={s.tallyFig}>{zones.length}</span>
              <span className={s.tallyKey}>parts</span>
              <span className={s.tallyFig}>{perLesson}</span>
              <span className={s.tallyKey}>min a lesson</span>
              <span className={s.tallyFig}>{minuteCount}</span>
              <span className={s.tallyKey}>min in total</span>
            </div>
          </div>
        </div>

        {/* ---- The field: the detail, and the schedule beside it -------
            Every mark in the drawing is aria-hidden; its bays are links
            into the parts they draw, and they are the only things in it a
            screen reader meets. The ordered list under it carries the same
            structure in the same order — hidden beside the drawing, and
            shown in its place on a narrow screen, where a 900-unit detail
            would be a smudge. */}
        <div className={s.field}>
          {detail ? (
            <div className={s.figure}>
              {/* The drawing's bays are links, so they need a heading above
                  them: without it a reader tabbing into the picture meets a
                  run of links with nothing saying what they are part of. It
                  is off screen, and it hides below 62rem with the drawing
                  it heads — see .detailLabel in sheet.module.css. */}
              <h2 className={s.detailLabel}>
                Figure 2 — the parts of this course, as links to their lessons
              </h2>

              {Drawing ? <Drawing k={bayKey} /> : null}

              <div className={s.stepsWrap}>
                <h2 className={s.stepsLabel}>What the detail shows</h2>
                <ol className={s.steps}>
                  {detail.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          ) : null}

          <Schedule
            courseSlug={course.slug}
            zones={zones}
            bays={detail?.bays ?? 0}
            total={lessons.length}
          />
        </div>

        {/* ---- Notes --------------------------------------------------
            The owner's own blurb, verbatim, set where a sheet carries its
            notes. */}
        <div className={s.notes}>
          <p className={s.notesLabel}>Notes</p>
          <p className={s.note}>{course.blurb}</p>
          <p className={s.noteQuiet}>
            Every figure on this sheet is counted from the lessons themselves. Your progress is
            kept in this browser only — no account, nothing sent anywhere.
          </p>
        </div>
      </section>
    </div>
  )
}
