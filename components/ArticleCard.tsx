import Link from 'next/link'
import { Article } from '@/lib/articles'

export function ArticleCard({ article, index }: { article: Article; index: number }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className={`group block py-6 border-b border-[var(--border)] animate-fade-up delay-${index + 1}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3
            className="text-[17px] font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-snug mb-1.5"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}
          >
            {article.title}
          </h3>
          <p className="text-[14.5px] text-[var(--text-secondary)] leading-relaxed line-clamp-2 mb-2.5">
            {article.description}
          </p>
          <div className="flex items-center gap-3 text-[12.5px] text-[var(--text-muted)]">
            <time>{article.date}</time>
            <span className="opacity-30">·</span>
            <span>{article.readingTime}</span>
            {article.tags.length > 0 && (
              <>
                <span className="opacity-30">·</span>
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                  >
                    {tag}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>
        <svg
          className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all mt-1.5 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </div>
    </Link>
  )
}
