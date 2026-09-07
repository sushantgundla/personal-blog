import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { getAllCourses, getCourse, getLesson, getNeighbours } from '@/lib/learn'
import { learnCanonical } from '@/lib/learn-domain'
import { Deeper } from '../../_components/Deeper'
import { Position } from '../../_components/Position'
import { PrevNext } from '../../_components/PrevNext'
import { Quiz } from '../../_components/Quiz'
import { WhyBand } from '../../_components/WhyBand'
import { Wins } from '../../_components/Wins'
import { mdxComponents } from '../../_components/mdx'

interface Props {
  params: { course: string; lesson: string }
}

/**
 * One lesson — the page most readers land on first, straight from a search
 * result. It opens with the platform sign, which places them on the line
 * before they read a word of the body, and then it is one column: title,
 * the rule in the course ink, why this matters, the prose, what they take
 * away, the recall quiz, further reading, and the line continuing.
 *
 * Everything comes from the filesystem at build time, so every lesson is a
 * static page — same shape as the articles route.
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
    // data-line is what resolves --ln-line for everything below, so the
    // whole page — sign, rule, diagram — is drawn in this course's ink.
    <article data-line={params.course}>
      <Position course={course} lesson={lesson} prev={prev} next={next} />

      <div className="measure">
        <h1 className="learn-h1">{lesson.title}</h1>
        {lesson.subtitle && <p className="learn-lede">{lesson.subtitle}</p>}

        {/* The one place the line's colour touches the reading column. */}
        <div className="rule-line" aria-hidden="true" />

        <WhyBand text={lesson.why} />

        <div className="prose" style={{ marginTop: 'clamp(2rem, 5vw, 3rem)' }}>
          <MDXRemote
            source={lesson.content}
            components={mdxComponents}
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
        </div>

        <Wins items={lesson.wins} />

        <Quiz courseSlug={course.slug} lessonSlug={lesson.slug} questions={lesson.quiz} />

        <Deeper links={lesson.deeper} />

        <PrevNext courseSlug={course.slug} prev={prev} next={next} />
      </div>
    </article>
  )
}
