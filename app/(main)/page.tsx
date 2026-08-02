import { getAllArticles } from '@/lib/articles'
import { Hero } from './_components/Hero'
import { Signal } from './_components/Signal'
import { Work } from './_components/Work'
import { Writing, type ArticleCard } from './_components/Writing'
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

  return (
    <>
      <Hero />
      <Signal />
      <Work />
      <Writing articles={articles} />
      <Contact />
    </>
  )
}
