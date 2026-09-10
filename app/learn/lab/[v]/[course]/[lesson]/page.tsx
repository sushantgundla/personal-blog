import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { getAllCourses, getCourse, getLesson, getNeighbours } from '@/lib/learn'
import { mdxComponents } from '../../../../_components/mdx'
import { Switcher } from '../../../Switcher'
import { VARIANTS, getVariant } from '../../../variants'
import V1 from '../../../_v1/Lesson'
import V2 from '../../../_v2/Lesson'
import V3 from '../../../_v3/Lesson'
import V4 from '../../../_v4/Lesson'
import V5 from '../../../_v5/Lesson'
import type { LessonVariantProps } from '../../../variants'

/**
 * One lesson, drawn five ways.
 *
 * This route exists so the five candidate designs can be compared on the
 * real thing — the real prose, the real tables, the real seventeen-stop
 * course — rather than on a mock. Everything above the design is shared and
 * lives here: the data, the MDX pipeline, the switcher. A variant is handed
 * the result and owns the page from there down.
 *
 * Not a product surface. `noindex, nofollow` is set below, nothing links to
 * it, and it is deleted whole once a candidate wins.
 */

const IMPLEMENTATIONS: Record<string, (props: LessonVariantProps) => JSX.Element> = {
  '1': V1,
  '2': V2,
  '3': V3,
  '4': V4,
  '5': V5,
}

interface Props {
  params: { v: string; course: string; lesson: string }
}

export function generateStaticParams() {
  return VARIANTS.flatMap((variant) =>
    getAllCourses().flatMap((course) =>
      course.lessons.map((lesson) => ({
        v: variant.id,
        course: course.slug,
        lesson: lesson.slug,
      }))
    )
  )
}

export function generateMetadata({ params }: Props): Metadata {
  const variant = getVariant(params.v)
  const lesson = getLesson(params.course, params.lesson)

  return {
    title: `${variant?.name ?? 'Lab'} — ${lesson?.title ?? 'lesson'}`,
    // A comparison surface must never be indexed, and it must not pass any
    // authority to the real lesson it duplicates.
    robots: { index: false, follow: false },
  }
}

export default function LabLessonPage({ params }: Props) {
  const variant = getVariant(params.v)
  const Variant = IMPLEMENTATIONS[params.v]
  const course = getCourse(params.course)
  const lesson = getLesson(params.course, params.lesson)

  if (!variant || !Variant || !course || !lesson) {
    notFound()
  }

  const { prev, next } = getNeighbours(params.course, params.lesson)

  const body = (
    <MDXRemote
      source={lesson.content}
      components={mdxComponents}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug, rehypeHighlight],
        },
      }}
    />
  )

  return (
    <>
      <Switcher current={variant} course={params.course} lesson={params.lesson} />
      <Variant course={course} lesson={lesson} prev={prev} next={next} body={body} />
    </>
  )
}
