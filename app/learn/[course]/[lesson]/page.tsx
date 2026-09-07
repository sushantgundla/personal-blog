import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { getAllCourses, getCourse, getLesson, getNeighbours } from '@/lib/learn'
import { Deeper } from '../../_components/Deeper'
import { PrevNext } from '../../_components/PrevNext'
import { Quiz } from '../../_components/Quiz'
import { WhyBand } from '../../_components/WhyBand'
import { Wins } from '../../_components/Wins'
import { mdxComponents } from '../../_components/mdx'

interface Props {
  params: { course: string; lesson: string }
}

/**
 * One lesson. Read top to bottom: why it matters, the body, what you can
 * now do, a quiz you can't skip past, and where to go next.
 *
 * Everything on the page comes from the filesystem at build time, so every
 * lesson is a static page — same shape as the articles route.
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
  }
}

export default function LessonPage({ params }: Props) {
  const course = getCourse(params.course)
  const lesson = getLesson(params.course, params.lesson)

  if (!course || !lesson) {
    notFound()
  }

  // The part this lesson belongs to, for the badge at the top. A lesson
  // whose `part` doesn't match anything in course.json simply gets no
  // badge rather than an empty one.
  const part = course.parts.find((candidate) => candidate.n === lesson.part)
  const { prev, next } = getNeighbours(params.course, params.lesson)

  return (
    <article className="measure">
      <header>
        {part && (
          <p
            className="learn-pill"
            style={{
              borderColor: 'var(--primary)',
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              marginBottom: '1rem',
            }}
          >
            Part {part.n} &middot; {part.name}
          </p>
        )}

        <p className="learn-eyebrow">
          <Link
            href={`/learn/${course.slug}`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {course.title}
          </Link>
          {lesson.minutes > 0 && <> &middot; ~{lesson.minutes} min</>}
        </p>

        <h1 className="learn-h1">{lesson.title}</h1>
        {lesson.subtitle && <p className="learn-lede">{lesson.subtitle}</p>}
      </header>

      <WhyBand text={lesson.why} />

      <div className="learn-prose" style={{ marginTop: 'clamp(2rem, 5vw, 3rem)' }}>
        <MDXRemote
          source={lesson.content}
          components={mdxComponents}
          options={{
            mdxOptions: {
              // Every lesson body uses GitHub-flavoured markdown tables, which
              // plain MDX does not parse — without this they render as raw
              // pipe characters in a paragraph.
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
    </article>
  )
}
