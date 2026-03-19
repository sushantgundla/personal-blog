import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const postsDirectory = path.join(process.cwd(), 'content/radar/posts')
const picksDirectory = path.join(process.cwd(), 'content/radar/picks')

export interface RadarPost {
  slug: string
  title: string
  date: string
  content: string
  tags: string[]
}

export type PickType = 'blog' | 'repo' | 'tool' | 'model' | 'paper' | 'resource'

export interface RadarPick {
  slug: string
  title: string
  date: string
  description: string
  url: string
  type: PickType
  tags: string[]
}

function readDirectory<T>(
  directory: string,
  transform: (slug: string, data: Record<string, unknown>, content: string) => T
): T[] {
  if (!fs.existsSync(directory)) return []

  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith('.mdx') || name.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.(mdx|md)$/, '')
      const fullPath = path.join(directory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter(fileContents)
      return transform(slug, data as Record<string, unknown>, content)
    })
    .sort((a, b) => {
      const aDate = (a as unknown as { date?: string }).date ?? ''
      const bDate = (b as unknown as { date?: string }).date ?? ''
      if (aDate < bDate) return 1
      if (aDate > bDate) return -1
      return 0
    })
}

export function getAllRadarPosts(): RadarPost[] {
  return readDirectory(postsDirectory, (slug, data, content) => ({
    slug,
    title: (data.title as string) || slug,
    date: (data.date as string) || '',
    content,
    tags: (data.tags as string[]) || [],
  }))
}

export function getAllRadarPicks(): RadarPick[] {
  return readDirectory(picksDirectory, (slug, data) => ({
    slug,
    title: (data.title as string) || slug,
    date: (data.date as string) || '',
    description: (data.description as string) || '',
    url: (data.url as string) || '',
    type: (data.type as PickType) || 'resource',
    tags: (data.tags as string[]) || [],
  }))
}
