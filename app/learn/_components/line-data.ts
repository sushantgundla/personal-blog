import type { Course, Part } from '@/lib/learn'

/**
 * The shape the diagram draws, and the one function that produces it.
 *
 * Kept out of Line.tsx on purpose. That file is `'use client'`, and across
 * a client boundary Next replaces every one of a module's exports with a
 * client-reference proxy — so a server page importing `toLineCourse` from
 * there would get an object where it expected a function, and the build
 * fails while prerendering. Plain data belongs in a plain module.
 */

/** One lesson, reduced to what the diagram draws. */
export interface LineStop {
  slug: string
  order: number
  title: string
  subtitle: string
  part: number
  minutes: number
}

/** One course, reduced to what the diagram draws. */
export interface LineCourse {
  slug: string
  title: string
  parts: Part[]
  stops: LineStop[]
}

/**
 * A `Course` has every lesson's full MDX body hanging off it. `Line` is a
 * client component, so anything handed to it is serialised into the page's
 * payload — passing the `Course` straight through would ship all thirty-odd
 * lesson bodies to the browser. The pages call this first.
 */
export function toLineCourse(course: Course): LineCourse {
  return {
    slug: course.slug,
    title: course.title,
    parts: course.parts,
    stops: course.lessons.map((lesson) => ({
      slug: lesson.slug,
      order: lesson.order,
      title: lesson.title,
      subtitle: lesson.subtitle,
      part: lesson.part,
      minutes: lesson.minutes,
    })),
  }
}
