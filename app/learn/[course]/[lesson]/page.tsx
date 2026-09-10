import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { getAllCourses, getCourse, getLesson, getNeighbours } from '@/lib/learn'
import { learnCanonical } from '@/lib/learn-domain'
import { Lesson } from '../../_lesson/Lesson'
import { lessonComponents } from '../../_lesson/mdx'

interface Props {
  params: { course: string; lesson: string }
}

/**
 * One lesson — the page most readers land on first, straight from a
 * search result.
 *
 * Everything above the design lives here: which lessons exist, what the
 * page is called, the neighbours either side, and the MDX pipeline that
 * turns the lesson body into elements. The design is
 * app/learn/_lesson/Lesson.tsx, which is handed the rendered body and
 * owns the page from there down.
 *
 * Everything comes from the filesystem at build time, so every lesson is
 * a static page — same shape as the articles route.
 */

export function generateStaticParams() {
  return getAllCourses().flatMap((course) =>
    course.lessons.map((lesson) => ({ course: course.slug, lesson: lesson.slug }))
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = getCourse(params.course)
  const lesson = getLesson(params.course, params.lesson)
  if (!course || !lesson) return {}

  const title = `${lesson.title} · ${course.title}`

  return {
    title,
    description: lesson.subtitle,
    openGraph: { title, description: lesson.subtitle, type: 'article' },
    ...learnCanonical(`/${course.slug}/${lesson.slug}`),
  }
}

export default function LessonPage({ params }: Props) {
  const course = getCourse(params.course)
  const lesson = getLesson(params.course, params.lesson)

  if (!course || !lesson) {
    notFound()
  }

  const { prev, next } = getNeighbours(params.course, params.lesson)

  return (
    <Lesson course={course} lesson={lesson} prev={prev} next={next}>
      <MDXRemote
        source={lesson.content}
        components={lessonComponents}
        options={{
          mdxOptions: {
            // Every lesson body uses GitHub-flavoured markdown tables,
            // which plain MDX does not parse — without this they render
            // as raw pipe characters in a paragraph.
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeSlug, rehypeHighlight],
          },
        }}
      />
    </Lesson>
  )
}
