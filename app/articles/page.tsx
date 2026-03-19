import { getAllArticles } from '@/lib/articles'
import { ArticleCard } from '@/components/ArticleCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Technical deep-dives into the architecture of modern machine intelligence, retrieval systems, and neural optimization.',
}

export default function ArticlesPage() {
  const articles = getAllArticles()
  const [featured, ...rest] = articles

  return (
    <div>
      {/* Header */}
      <section className="mb-12 animate-fade-up">
        <h1 className="text-7xl font-headline font-bold tracking-tighter text-on-surface mb-4">
          Articles
        </h1>
        <p className="text-on-surface-variant text-lg max-w-2xl">
          Technical deep-dives into the architecture of modern machine intelligence, retrieval systems, and neural optimization.
        </p>
      </section>

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
          {/* Main Column */}
          <div>
            {/* Featured Article */}
            {featured && (
              <div className="mb-10 pb-10 border-b border-outline-variant/20">
                <ArticleCard article={featured} index={0} featured />
              </div>
            )}

            {/* Remaining Articles Grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rest.map((article, i) => (
                  <ArticleCard key={article.slug} article={article} index={i + 1} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Currently Trending */}
            <div className="bg-surface-container-low rounded-xl p-6">
              <h3 className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant mb-6">
                Currently Trending
              </h3>
              <ul className="space-y-4">
                {articles.slice(0, 3).map((article, i) => (
                  <li key={article.slug}>
                    <a
                      href={`/articles/${article.slug}`}
                      className="group flex items-start gap-3"
                    >
                      <span className="text-on-surface-variant/40 font-headline font-bold text-sm tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="font-headline font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                        {article.title}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

          </aside>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 rounded-2xl border border-dashed border-outline-variant/30">
          <div className="text-6xl mb-6">✍️</div>
          <p className="font-headline text-2xl font-bold text-on-surface mb-2">
            Drafts in progress.
          </p>
          <p className="text-on-surface-variant text-sm max-w-md text-center leading-relaxed">
            The ideas are brewing, the outlines are messy, and the first drafts are terrible — exactly as they should be. Articles will land here soon.
          </p>
          <div className="mt-8 flex items-center gap-2 text-on-surface-variant/40 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>writing_mode: deep_focus</span>
          </div>
        </div>
      )}
    </div>
  )
}
