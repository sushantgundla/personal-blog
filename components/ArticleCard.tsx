import Link from 'next/link'
import { Article } from '@/lib/articles'

interface ArticleCardProps {
  article: Article
  index: number
  featured?: boolean
}

export function ArticleCard({ article, index, featured = false }: ArticleCardProps) {
  if (featured) {
    return (
      <Link
        href={`/articles/${article.slug}`}
        className="group block animate-fade-up"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
            {article.date}
          </span>
          <span className="text-on-surface-variant/30">&middot;</span>
          <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
            {article.readingTime}
          </span>
        </div>

        <h2 className="font-headline text-3xl font-bold tracking-tighter text-on-surface group-hover:text-primary transition-colors mb-3">
          {article.title}
        </h2>

        {article.description && (
          <p className="text-on-surface-variant text-base mb-4 leading-relaxed">
            {article.description}
          </p>
        )}

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[9px] font-label font-bold uppercase tracking-widest"
            >
              {tag}
            </span>
          ))}
        </div>

        <span className="inline-flex items-center gap-1.5 text-primary text-sm font-medium group-hover:gap-2.5 transition-all">
          Read Protocol
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </span>
      </Link>
    )
  }

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group block bg-surface-container-low p-6 rounded-xl hover:bg-surface-container-high transition animate-fade-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
          {article.date}
        </span>
        <span className="text-on-surface-variant/30">&middot;</span>
        <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
          {article.readingTime}
        </span>
      </div>

      <h3 className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors mb-2">
        {article.title}
      </h3>

      {article.description && (
        <p className="text-on-surface-variant text-sm line-clamp-2 mb-3">
          {article.description}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {article.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[9px] font-label font-bold uppercase tracking-widest"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  )
}
