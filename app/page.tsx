import { getAllArticles } from '@/lib/articles'
import { ArticleCard } from '@/components/ArticleCard'
import { siteConfig } from '@/lib/config'
import Link from 'next/link'

export default function Home() {
  const articles = getAllArticles().slice(0, 4)

  return (
    <div>
      {/* Hero */}
      <section className="mb-14 animate-fade-up">
        <h1
          className="text-[38px] font-bold tracking-tight leading-[1.1] text-[var(--text-primary)] mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {siteConfig.name}
        </h1>
        <p
          className="text-[15px] text-[var(--text-muted)] tracking-wide"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {siteConfig.tagline}
        </p>
      </section>

      {/* Recent Articles */}
      {articles.length > 0 ? (
        <section className="mb-16">
          <h2
            className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Recent writing
          </h2>
          <div>
            {articles.map((article, i) => (
              <ArticleCard key={article.slug} article={article} index={i} />
            ))}
          </div>
          {articles.length >= 4 && (
            <Link
              href="/articles"
              className="inline-flex items-center gap-1.5 mt-6 text-[13.5px] font-medium text-[var(--accent)] hover:opacity-80 transition-opacity"
            >
              View all articles
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          )}
        </section>
      ) : (
        <section className="mb-16 animate-fade-up delay-1">
          <div className="py-12 text-center border border-dashed border-[var(--border)] rounded-lg">
            <p className="text-[var(--text-muted)] text-[14px] mb-1">No articles yet</p>
            <p className="text-[var(--text-muted)] text-[13px] opacity-70">
              Add <code className="text-[12px] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">.mdx</code> files to <code className="text-[12px] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">content/articles/</code> to get started
            </p>
          </div>
        </section>
      )}

      {/* Work */}
      <section className="animate-fade-up delay-3">
        <h2
          className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Work
        </h2>
        <div className="space-y-0">
          {siteConfig.work.map((job, i) => (
            <div key={i} className="flex gap-4 py-3.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] mt-1.5 flex-shrink-0 opacity-70" />
              <div>
                <div
                  className="text-[15px] font-semibold text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {job.company}
                </div>
                <div className="text-[13.5px] text-[var(--text-secondary)] mt-0.5">
                  {job.role}
                </div>
                <div className="text-[12.5px] text-[var(--text-muted)] mt-0.5">
                  {job.period}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
