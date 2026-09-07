import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { MetadataRoute } from 'next'
import { getAllArticles } from '@/lib/articles'
import { siteConfig } from '@/lib/config'
import { ISO_COUNTRIES } from '@/lib/atlas/iso-countries'
import { ALL_INDICATOR_CODES } from '@/lib/atlas/indicators'
import { getAllCourses } from '@/lib/learn'

// Same snapshot directory and read pattern as lib/atlas/dossier.ts's
// readSnapshot — but only ever pulls `capturedAt` out of each file, and
// falls back to `new Date()` rather than throwing if a file is missing or
// unparsable, since a sitemap entry should never fail the build.
const SNAPSHOT_DIR = path.join(process.cwd(), 'content', 'atlas', 'snapshot', 'countries')

async function capturedAtFor(iso3: string): Promise<Date> {
  try {
    const raw = await readFile(path.join(SNAPSHOT_DIR, `${iso3}.json`), 'utf-8')
    const parsed = JSON.parse(raw) as { capturedAt?: string }
    return parsed.capturedAt ? new Date(parsed.capturedAt) : new Date()
  } catch {
    return new Date()
  }
}

// The five games app/atlas/learn/[game]/page.tsx actually renders — see
// its GAMES record. Hand-typed here rather than imported so this file stays
// a plain data list; if a game is ever added there, add it here too.
const LEARN_GAMES = ['forgery', 'higher-lower', 'flags', 'guess-country', 'where-in-the-world'] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = getAllArticles()

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteConfig.url}/articles/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const countryEntries: MetadataRoute.Sitemap = await Promise.all(
    ISO_COUNTRIES.map(async (country) => ({
      url: `${siteConfig.url}/atlas/${country.iso3.toLowerCase()}`,
      lastModified: await capturedAtFor(country.iso3),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  )

  const rankingEntries: MetadataRoute.Sitemap = ALL_INDICATOR_CODES.map((code) => ({
    url: `${siteConfig.url}/atlas/rankings/${code}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  const learnEntries: MetadataRoute.Sitemap = [
    {
      url: `${siteConfig.url}/atlas/learn`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...LEARN_GAMES.map((game) => ({
      url: `${siteConfig.url}/atlas/learn/${game}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]

  // The /learn courses section — unrelated to LEARN_GAMES above, which is the
  // Atlas's games under /atlas/learn. Generated from the MDX on disk rather
  // than hand-listed, and an empty content/learn/ just yields the index page.
  const courses = getAllCourses()

  const courseEntries: MetadataRoute.Sitemap = courses.flatMap((course) => [
    {
      url: `${siteConfig.url}/learn/${course.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    ...course.lessons.map((lesson) => ({
      url: `${siteConfig.url}/learn/${course.slug}/${lesson.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ])

  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteConfig.url}/articles`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteConfig.url}/radar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/projects`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteConfig.url}/atlas`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/atlas/compare`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteConfig.url}/atlas/rankings`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteConfig.url}/learn`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...learnEntries,
    ...courseEntries,
    ...articleEntries,
    ...countryEntries,
    ...rankingEntries,
  ]
}
