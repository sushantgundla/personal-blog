import type { Course, Lesson } from '@/lib/learn'

/**
 * The course, cut into the zones FIG. 2 is drawn in.
 *
 * A zone is one of the named parts in course.json with the lessons that
 * carry its number in their own frontmatter. Nothing here is written by
 * hand: the name comes off disk, the count is counted, the minutes are
 * summed.
 *
 * Plain data and pure functions, kept out of the components, for the same
 * reason app/learn/_components/line-data.ts exists: Schedule.tsx is a
 * client component, and across that boundary Next replaces a module's
 * exports with client-reference proxies.
 */

/** One lesson, reduced to what the schedule prints. */
export interface ScheduleLesson {
  slug: string
  order: number
  title: string
  subtitle: string
  minutes: number
}

/** One part of the course, and the lessons filed under it. */
export interface Zone {
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
 *     that quietly vanished would leave the drawing claiming four zones
 *     while the schedule showed three.
 *   - A lesson whose `part` is not a named one is hung on the end in its
 *     own unnamed zone, so it is still reachable.
 *   - A course with no parts at all becomes one unnamed zone holding every
 *     lesson, which is a schedule rather than an empty page.
 */
export function toZones(course: Course): Zone[] {
  const named = new Set(course.parts.map((part) => part.n))

  const zones: Zone[] = course.parts.map((part) => ({
    n: part.n,
    name: part.name,
    lessons: course.lessons.filter((lesson) => lesson.part === part.n).map(toScheduleLesson),
  }))

  for (const lesson of course.lessons) {
    if (named.has(lesson.part)) continue

    const stray = zones.find((zone) => zone.name === null && zone.n === lesson.part)
    if (stray) stray.lessons.push(toScheduleLesson(lesson))
    else zones.push({ n: lesson.part, name: null, lessons: [toScheduleLesson(lesson)] })
  }

  if (zones.length === 0 && course.lessons.length > 0) {
    return [{ n: 0, name: null, lessons: course.lessons.map(toScheduleLesson) }]
  }

  return zones
}

/** Minutes in a zone, summed from the lessons' own frontmatter. */
export function zoneMinutes(zone: Zone): number {
  return zone.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0)
}

/** `7` -> `07`. Two digits, so a column of stop numbers lines up. */
export function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}
