import { getAllArticles } from '@/lib/articles'
import { getAllRadarPosts, getAllRadarPicks } from '@/lib/radar'
import { Hero } from './_components/Hero'
import { Signal } from './_components/Signal'
import { Work } from './_components/Work'
import { Writing, type ArticleCard } from './_components/Writing'
import { RadarHome } from './_components/RadarHome'
import { Contact } from './_components/Contact'

/**
 * v2 home page.
 *
 * Server component: articles are read from the filesystem here and handed to
 * the client sections as plain props. Nothing below this line may touch `fs`.
 */
export default function V2Page() {
  const articles: ArticleCard[] = getAllArticles()
    .slice(0, 4)
    .map(({ slug, title, date, description, tags, readingTime }) => ({
      slug,
      title,
      date,
      description,
      tags,
      readingTime,
    }))

  // Radar is read here too — lib/radar.ts uses fs, so it must stay server-side
  // and reach RadarHome as plain props.
  const radarPosts = getAllRadarPosts()
  const radarPicks = getAllRadarPicks()

  return (
    <>
      <Hero />
      <Signal />
      <Work />
      <Writing articles={articles} />
      <RadarHome latestPost={radarPosts[0] ?? null} picks={radarPicks.slice(0, 4)} />
      <Contact />
    </>
  )
}
