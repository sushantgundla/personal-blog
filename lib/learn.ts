import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

/**
 * The learning section's content layer. Same shape as lib/articles.ts —
 * plain fs + gray-matter, read at build time, no database and no new
 * dependencies.
 *
 * On disk:
 *
 *   content/learn/<course-slug>/course.json
 *   content/learn/<course-slug>/01-what-the-model-is.mdx
 *   content/learn/<course-slug>/02-....mdx
 *
 * The numeric filename prefix is the lesson order; everything after it
 * (minus the extension) is the lesson slug used in the URL.
 */

const learnDirectory = path.join(process.cwd(), 'content/learn')

export interface QuizQuestion {
  q: string
  options: string[]
  answer: number
  explain: string
}

export interface DeeperLink {
  label: string
  href: string
}

export interface Part {
  n: number
  name: string
}

export interface Lesson {
  courseSlug: string
  slug: string
  order: number
  title: string
  subtitle: string
  part: number
  minutes: number
  why: string
  wins: string[]
  quiz: QuizQuestion[]
  deeper: DeeperLink[]
  content: string
}

export interface Course {
  slug: string
  title: string
  subtitle: string
  blurb: string
  order: number
  parts: Part[]
  lessons: Lesson[]
}

/** `01-what-the-model-is.mdx` -> `{ order: 1, slug: 'what-the-model-is' }`. */
const LESSON_FILE = /^(\d+)-(.+)\.mdx?$/

function toString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

/** Drops any quiz entry that isn't answerable — no question, or no options. */
function toQuiz(value: unknown): QuizQuestion[] {
  if (!Array.isArray(value)) return []

  return value
    .map((raw) => {
      const item = (raw ?? {}) as Record<string, unknown>
      return {
        q: toString(item.q),
        options: toStringArray(item.options),
        answer: toNumber(item.answer, 0),
        explain: toString(item.explain),
      }
    })
    .filter((question) => question.q !== '' && question.options.length > 0)
}

function toDeeper(value: unknown): DeeperLink[] {
  if (!Array.isArray(value)) return []

  return value
    .map((raw) => {
      const item = (raw ?? {}) as Record<string, unknown>
      return { label: toString(item.label), href: toString(item.href) }
    })
    .filter((link) => link.href !== '')
}

function toParts(value: unknown): Part[] {
  if (!Array.isArray(value)) return []

  return value
    .map((raw) => {
      const item = (raw ?? {}) as Record<string, unknown>
      return { n: toNumber(item.n), name: toString(item.name) }
    })
    .filter((part) => part.name !== '')
    .sort((a, b) => a.n - b.n)
}

function readLesson(courseSlug: string, fileName: string): Lesson | null {
  const match = LESSON_FILE.exec(fileName)
  if (!match) return null

  const order = Number.parseInt(match[1], 10)
  const slug = match[2]

  const fullPath = path.join(learnDirectory, courseSlug, fileName)

  let fileContents: string
  try {
    fileContents = fs.readFileSync(fullPath, 'utf8')
  } catch {
    return null
  }

  const { data, content } = matter(fileContents)

  return {
    courseSlug,
    slug,
    order,
    title: toString(data.title, slug),
    subtitle: toString(data.subtitle),
    part: toNumber(data.part),
    minutes: toNumber(data.minutes),
    why: toString(data.why),
    wins: toStringArray(data.wins),
    quiz: toQuiz(data.quiz),
    deeper: toDeeper(data.deeper),
    content,
  }
}

/**
 * Reads one course directory. Returns null — so the caller skips it — if
 * course.json is missing or unparseable, which keeps a half-written course
 * from breaking the whole section's build.
 */
function readCourse(slug: string): Course | null {
  const courseDir = path.join(learnDirectory, slug)

  let stats: fs.Stats
  try {
    stats = fs.statSync(courseDir)
  } catch {
    return null
  }
  if (!stats.isDirectory()) return null

  let meta: Record<string, unknown>
  try {
    meta = JSON.parse(fs.readFileSync(path.join(courseDir, 'course.json'), 'utf8'))
  } catch {
    return null
  }

  const lessons = fs
    .readdirSync(courseDir)
    .map((fileName) => readLesson(slug, fileName))
    .filter((lesson): lesson is Lesson => lesson !== null)
    .sort((a, b) => a.order - b.order)

  return {
    slug,
    title: toString(meta.title, slug),
    subtitle: toString(meta.subtitle),
    blurb: toString(meta.blurb),
    order: toNumber(meta.order),
    parts: toParts(meta.parts),
    lessons,
  }
}

export function getAllCourses(): Course[] {
  if (!fs.existsSync(learnDirectory)) {
    return []
  }

  return fs
    .readdirSync(learnDirectory)
    .map((name) => readCourse(name))
    .filter((course): course is Course => course !== null)
    .sort((a, b) => a.order - b.order)
}

export function getCourse(slug: string): Course | null {
  if (!fs.existsSync(learnDirectory)) {
    return null
  }

  return readCourse(slug)
}

export function getLesson(courseSlug: string, lessonSlug: string): Lesson | null {
  const course = getCourse(courseSlug)
  if (!course) return null

  return course.lessons.find((lesson) => lesson.slug === lessonSlug) ?? null
}

/**
 * The previous and next lesson in reading order, for the footer arrows.
 * Both are null when the lesson (or its course) doesn't exist; the first
 * lesson has no prev and the last has no next.
 */
export function getNeighbours(
  courseSlug: string,
  lessonSlug: string
): { prev: Lesson | null; next: Lesson | null } {
  const course = getCourse(courseSlug)
  if (!course) return { prev: null, next: null }

  const index = course.lessons.findIndex((lesson) => lesson.slug === lessonSlug)
  if (index === -1) return { prev: null, next: null }

  return {
    prev: course.lessons[index - 1] ?? null,
    next: course.lessons[index + 1] ?? null,
  }
}
