import { getAllArticles } from '@/lib/articles'
import { ArticleCard } from '@/components/ArticleCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Writing about AI, engineering, and building things.',
}

export default function ArticlesPage() {
  const articles = getAllArticles()

  return (
    <div>
      <section className="mb-8 animate-fade-up">
        <h1
          className="text-[30px] font-bold tracking-tight text-[var(--text-primary)] mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Articles
        </h1>
        <p className="text-[15px] text-[var(--text-muted)]">
          Writing about AI, engineering, and the craft of building software.
        </p>
      </section>

      {articles.length > 0 ? (
        <div>
          {articles.map((article, i) => (
            <ArticleCard key={article.slug} article={article} index={i} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-[var(--text-muted)]">No articles yet. Check back soon.</p>
        </div>
      )}
    </div>
  )
}
