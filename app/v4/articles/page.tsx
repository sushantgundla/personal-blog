import Link from 'next/link'
import { getAllArticles } from '@/lib/articles'
import { Reveal } from '../_components/Reveal'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Writing',
  description: 'Technical deep-dives into the architecture of modern machine intelligence, retrieval systems, and neural optimization.',
}

const ArrowRight = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

export default function V4ArticlesPage() {
  const articles = getAllArticles()

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 py-16 md:py-24">
      <Reveal>
        <h1 className="v4-display font-black tracking-tight text-on-surface text-5xl md:text-7xl leading-[1.05]">
          Writing
        </h1>
      </Reveal>
      <Reveal delay={80}>
        <p className="text-on-surface-variant text-lg mt-6 max-w-2xl">
          Technical deep-dives into the architecture of modern machine intelligence, retrieval systems, and neural optimization.
        </p>
      </Reveal>

      <div className="mt-16 md:mt-20">
        {articles.length > 0 ? (
          <>
            {articles.map((a, i) => (
              <Reveal key={a.slug} delay={i * 60}>
                <Link
                  href={`/v4/articles/${a.slug}`}
                  className="v4-row -mx-3 px-3 group block border-t border-outline-variant/60 py-8 md:py-10"
                >
                  <span className="v4-row-fill" aria-hidden="true" />
                  <div className="v4-row-content flex items-start md:items-center gap-6 md:gap-10">
                    <span className="v4-row-index font-mono text-xs tabular-nums pt-2.5 md:pt-1">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h2 className="v4-row-title v4-display font-bold tracking-tight text-2xl md:text-4xl leading-[1.08]">
                        {a.title}
                      </h2>
                      <div className="v4-row-meta flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 font-mono text-[10px] md:text-[11px] uppercase tracking-widest">
                        <span>{a.date}</span>
                        <span className="opacity-40">·</span>
                        <span>{a.readingTime}</span>
                        {a.tags?.map((t) => (
                          <span key={t} className="opacity-60">{t}</span>
                        ))}
                      </div>
                      <p className="mt-4 text-on-surface-variant text-sm md:text-base max-w-2xl leading-relaxed">
                        {a.description}
                      </p>
                    </div>
                    <ArrowRight className="v4-row-arrow shrink-0 hidden md:block" />
                  </div>
                </Link>
              </Reveal>
            ))}
            <div className="border-t border-outline-variant/60" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 border-t border-b border-outline-variant/60">
            <p className="v4-display text-2xl font-bold text-on-surface mb-2">
              Drafts in progress.
            </p>
            <p className="text-on-surface-variant text-sm max-w-md text-center leading-relaxed">
              The ideas are brewing, the outlines are messy, and the first drafts are terrible, exactly as they should be. Writing will land here soon.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
