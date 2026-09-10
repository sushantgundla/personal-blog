import type { ReactNode } from 'react'
import type { Course, Lesson } from '@/lib/learn'

/**
 * The lesson-page lab.
 *
 * Five complete lesson pages, each a different answer to the same brief,
 * all live at once on the real content so they can be read rather than
 * imagined. This is a comparison surface and not a product one: it is
 * `noindex`, it is not linked from anywhere a reader goes, and when one
 * candidate wins the other four and this whole directory are deleted.
 *
 * The variants share the route, the data and the MDX pipeline — everything
 * below the design. What each one owns is `app/learn/lab/_v<n>/Lesson.tsx`
 * and its stylesheet, and nothing else. That is the whole of the
 * difference between them, which is what makes them comparable.
 *
 * The thesis lines below are the briefs the five were written to. They are
 * deliberately far apart: a lesson can be a plate, a line, a column, a
 * spread or a worksheet, and those five put the reading column in five
 * genuinely different places rather than shuffling the same stack.
 */

/** What every variant is handed. The data is identical for all five. */
export interface LessonVariantProps {
  course: Course
  lesson: Lesson
  prev: Lesson | null
  next: Lesson | null
  /**
   * The lesson body, already rendered through the section's MDX pipeline
   * with `remark-gfm`, `rehype-slug` and `rehype-highlight`.
   *
   * A variant that wants its own MDX components — a different section
   * heading, say — can ignore this and render `lesson.content` itself with
   * `MDXRemote`. Most will not need to.
   */
  body: ReactNode
}

export interface Variant {
  /** The `[v]` segment in the URL. */
  id: string
  /** What to call it in the switcher. */
  name: string
  /** The brief it was written to, in one line. */
  thesis: string
}

export const VARIANTS: Variant[] = [
  {
    id: '1',
    name: 'The specimen sheet',
    thesis:
      'The lesson is a drawing-office document. A title block, a standing margin rail of callouts, and the prose as the field.',
  },
  {
    id: '2',
    name: 'The line down the edge',
    thesis:
      'The course runs vertically down the full height of the page and the lesson’s own sections are stops on it.',
  },
  {
    id: '3',
    name: 'One column, nothing else',
    thesis:
      'Everything is the reading column, the quiz included. No band, no strip, no apparatus — prose is the product.',
  },
  {
    id: '4',
    name: 'The spread',
    thesis:
      'A two-page spread: prose on the recto, and every piece of apparatus gathered on the verso beside it.',
  },
  {
    id: '5',
    name: 'The worksheet',
    thesis:
      'An engineering worksheet. Numbered work items in a ruled frame, and the recall quiz as the check column at the foot.',
  },
]

export function getVariant(id: string): Variant | undefined {
  return VARIANTS.find((variant) => variant.id === id)
}
