import type { Course, Lesson } from '@/lib/learn'

/**
 * The course, cut into the parts FIG. 2 is drawn in.
 *
 * A CoursePart is one of the named parts in course.json with the lessons
 * that carry its number in their own frontmatter. Nothing here is written by
 * hand: the name comes off disk, the count is counted, the minutes are
 * summed.
 *
 * Plain data and pure functions, kept out of the components: Schedule.tsx is
 * a client component, and across that boundary Next replaces a module's
 * exports with client-reference proxies, so anything both sides need has to
 * live in a module that is neither. `_plate/stages.ts` does the same job for
 * FIG. 1.
 */

/** One lesson, reduced to what the schedule prints. */
export interface ScheduleLesson {
  slug: string
  order: number
  title: string
  subtitle: string
  minutes: number
}

/**
 * One part of the course, and the lessons filed under it. Named
 * `CoursePart` rather than `Part` because `Part` in `@/lib/learn` is the
 * raw entry off disk, which carries no lessons.
 */
export interface CoursePart {
  /** The part number, as course.json and the lessons' frontmatter carry it. */
  n: number
  /** The part's name, or null when course.json does not name this number. */
  name: string | null
  lessons: ScheduleLesson[]
}

function toScheduleLesson(lesson: Lesson): ScheduleLesson {
  return {
    slug: lesson.slug,
    order: lesson.order,
    title: lesson.title,
    subtitle: lesson.subtitle,
    minutes: lesson.minutes,
  }
}

/**
 * The named parts in order, each with its lessons in reading order, then
 * every lesson whose part number course.json does not name.
 *
 * Three failures are handled rather than hidden, because a course page has
 * to be true about a course nobody has finished writing:
 *
 *   - A named part with no lessons keeps its column and says so. A part
 *     that quietly vanished would leave the drawing claiming four parts
 *     while the schedule showed three.
 *   - A lesson whose `part` is not a named one is hung on the end in its
 *     own unnamed part, so it is still reachable.
 *   - A course with no parts at all becomes one unnamed part holding every
 *     lesson, which is a schedule rather than an empty page.
 */
export function toParts(course: Course): CoursePart[] {
  const named = new Set(course.parts.map((part) => part.n))

  const grouped: CoursePart[] = course.parts.map((part) => ({
    n: part.n,
    name: part.name,
    lessons: course.lessons.filter((lesson) => lesson.part === part.n).map(toScheduleLesson),
  }))

  for (const lesson of course.lessons) {
    if (named.has(lesson.part)) continue

    const stray = grouped.find((group) => group.name === null && group.n === lesson.part)
    if (stray) stray.lessons.push(toScheduleLesson(lesson))
    else grouped.push({ n: lesson.part, name: null, lessons: [toScheduleLesson(lesson)] })
  }

  if (grouped.length === 0 && course.lessons.length > 0) {
    return [{ n: 0, name: null, lessons: course.lessons.map(toScheduleLesson) }]
  }

  return grouped
}

/** Minutes in a part, summed from the lessons' own frontmatter. */
export function partMinutes(part: CoursePart): number {
  return part.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0)
}

/** What a bay of FIG. 2 needs to turn itself into a door. */
export interface PartDoor {
  href: string
  label: string
}

/** The lesson a part opens on: the lowest `order` it holds, or none. */
function firstLesson(part: CoursePart): ScheduleLesson | undefined {
  return part.lessons.reduce<ScheduleLesson | undefined>(
    (best, lesson) => (best === undefined || lesson.order < best.order ? lesson : best),
    undefined,
  )
}

/**
 * What a screen reader hears at a bay.
 *
 * The same sentence the schedule column already says, in the same order —
 * the part's number and name, then how much of it there is — with one clause
 * added for the thing the column cannot say, which is where the bay leads.
 * Written here rather than in the five drawings for the reason `stageLabel()`
 * exists on the index: hearing two different sentences about one part is how
 * a reader concludes there are eight parts.
 */
function partLabel(part: CoursePart, first: ScheduleLesson): string {
  const head = part.name === null ? `Part ${part.n}` : `Part ${part.n}, ${part.name}`
  const count = `${part.lessons.length} ${part.lessons.length === 1 ? 'lesson' : 'lessons'}`

  return `${head} — ${count}, ${partMinutes(part)} minutes. Opens lesson ${first.order}: ${first.title}.`
}

/**
 * The way into a part: its first lesson in reading order.
 *
 * A bay is a part and a part is several lessons, so there is no one lesson a
 * bay *is*. The first one is the useful destination — it is where a reader
 * who clicked that part of the drawing was going to start anyway.
 *
 * A named part with no lessons yet gets no door, and `Bay` leaves it drawn
 * and unclickable. `toParts()` keeps such a part rather than hiding it, so
 * this case is real on a course nobody has finished writing, and a link that
 * goes nowhere is worse than no link.
 *
 * The href is `/learn/<course>/<lesson>` and nothing else. middleware.ts
 * turns that into the right address on the subdomain; a drawing has no
 * business knowing which host it is being read on.
 */
export function partDoor(courseSlug: string, part: CoursePart): PartDoor | undefined {
  const first = firstLesson(part)
  if (first === undefined) return undefined

  return {
    href: `/learn/${courseSlug}/${first.slug}`,
    label: partLabel(part, first),
  }
}

/** `7` -> `07`. Two digits, so a column of lesson numbers lines up. */
export function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}
