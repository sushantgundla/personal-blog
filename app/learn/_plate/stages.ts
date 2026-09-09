import type { Course } from '@/lib/learn'

/**
 * The five stages of one request, and the course that teaches each.
 *
 * This is the whole argument of the page, so it is worth being exact about
 * what is invented here and what is not. Invented: the callout number, the
 * name of the part of the machine, and the line saying what that part does.
 * Not invented, and never written by hand: the course title, its subtitle,
 * how many lessons it has and how many minutes they run to — every one of
 * those is read off content/learn/ by lib/learn.ts.
 *
 * The order below is the machine's order, not the courses' own. The courses
 * are numbered 1-5 on disk (LLMs first); a request meets them in the order
 * prompt, retrieval, model, loop, measurement. The mapping is by slug, so
 * re-ordering the courses on disk cannot silently re-order the drawing.
 *
 * A sixth course would not be in that mapping, and this site has added one
 * twice this year. It must not vanish: buildStages() appends any course the
 * drawing does not cover as an entry with no number, the legend renders it
 * with no callout, and the strip's count of parts is derived rather than
 * written, so nothing on the page can claim five parts while showing six
 * courses. That is a prompt to redraw FIG. 1, which is the correct failure.
 *
 * Plain data and pure functions, kept out of the drawing components so a
 * server page and a client one could both read it. Same reason
 * app/learn/_components/line-data.ts exists.
 */

export interface Stage {
  /** The course this stage is. Also drives --ln-line via learn.css. */
  id: string
  /** The callout number on the plate. Ties the drawing to the legend. */
  n: number
  /** What the part is called on the drawing. */
  part: string
  /** What that part of the machine does, in plain words. */
  role: string
}

const STAGES: Stage[] = [
  {
    id: 'prompt-engineering',
    n: 1,
    part: 'Prompt',
    // Both ends of the request. Four of this course's twelve lessons are
    // about what comes back — output contracts, validating it, retries and
    // fallbacks, sampling and voting — so the drawing hangs it on the outlet
    // manifold as well as the inlet, and the role has to say so.
    role: 'What you send in, and the shape you demand back.',
  },
  {
    id: 'rag',
    n: 2,
    // "Top-k" stays on the drawing, because that is the name the reader will
    // meet in someone else's code. The plain-English gloss lands here, where
    // there is room for it.
    part: 'Retrieval',
    role: 'What gets fetched and stuffed in beside it. Only the top few survive ranking.',
  },
  {
    id: 'llms',
    n: 3,
    part: 'Model',
    // Not just "the thing in the middle": three of this course's four parts
    // are providers, open weights and choosing, so the role has to say so or
    // the heaviest object on the plate promises internals the course does
    // not spend most of its time on.
    role: 'The thing in the middle, and which one to choose.',
  },
  {
    id: 'agents',
    n: 4,
    part: 'Tool loop',
    role: 'The loop out to tools and back.',
  },
  {
    id: 'evals',
    n: 5,
    part: 'Measurement',
    // The drawing taps the output only; the course measures retrieval too.
    // The words carry what one more dotted line could not — see the note on
    // the second tap in MachineWide.tsx.
    role: 'Whether the output was any good, and whether retrieval found the right thing. A trace is one run, recorded.',
  },
]

/** One entry in the legend under the drawing. */
export interface StageEntry {
  id: string
  /** null for a course the drawing does not cover yet. */
  n: number | null
  part: string | null
  role: string | null
  title: string
  subtitle: string
  href: string
  lessons: number
  minutes: number
}

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']

/**
 * A small count as a word, because "The 5 courses are the 5 parts of it" is
 * not how the owner writes. Falls back to the numeral past nine, which is
 * where spelling it out stops helping anyone.
 */
export function inWords(n: number): string {
  return WORDS[n] ?? String(n)
}

/**
 * Joins the stages to the courses read off disk, then appends every course
 * the five stages do not name.
 *
 * A stage whose course is missing is dropped rather than thrown: a renamed
 * course directory should shorten a legend, not fail the whole site's build.
 * The drawing still shows that part of the machine — the machine is true
 * whether or not there is a course about it — so an entry's number is always
 * its own `n`, never its index.
 */
export function buildStages(courses: Course[]): StageEntry[] {
  const bySlug = new Map(courses.map((course) => [course.slug, course]))
  const mapped = new Set(STAGES.map((stage) => stage.id))

  function entry(course: Course, stage: Stage | null): StageEntry {
    return {
      id: course.slug,
      n: stage?.n ?? null,
      part: stage?.part ?? null,
      role: stage?.role ?? null,
      title: course.title,
      subtitle: course.subtitle,
      href: `/learn/${course.slug}`,
      lessons: course.lessons.length,
      minutes: course.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0),
    }
  }

  const drawn = STAGES.flatMap<StageEntry>((stage) => {
    const course = bySlug.get(stage.id)
    return course ? [entry(course, stage)] : []
  })

  const undrawn = courses
    .filter((course) => !mapped.has(course.slug))
    .map((course) => entry(course, null))

  return [...drawn, ...undrawn]
}
