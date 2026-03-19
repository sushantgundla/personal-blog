import { getAllArticles, getArticleBySlug } from '@/lib/articles'
import { MDXRemote } from 'next-mdx-remote/rsc'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const articles = getAllArticles()
  return articles.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getArticleBySlug(params.slug)
  if (!article) return {}

  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      type: 'article',
      publishedTime: article.date,
    },
  }
}

export default function ArticlePage({ params }: Props) {
  const article = getArticleBySlug(params.slug)

  if (!article) {
    notFound()
  }

  return (
    <article>
      {/* Back link */}
      <Link
        href="/articles"
        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-10 animate-fade-up"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Back to articles
      </Link>

      {/* Header */}
      <header className="mb-10 animate-fade-up delay-1">
        <h1
          className="text-[32px] font-bold tracking-tight leading-[1.2] text-[var(--text-primary)] mb-3"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.025em' }}
        >
          {article.title}
        </h1>
        <div className="flex items-center gap-3 text-[13px] text-[var(--text-muted)]">
          <time>{article.date}</time>
          <span className="opacity-30">·</span>
          <span>{article.readingTime}</span>
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide bg-[var(--bg-secondary)] text-[var(--text-muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="prose animate-fade-up delay-2">
        <MDXRemote
          source={article.content}
          options={{
            mdxOptions: {
              rehypePlugins: [rehypeSlug, rehypeHighlight],
            },
          }}
        />
      </div>

      {/* Bottom nav */}
      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <Link
          href="/articles"
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--accent)] hover:opacity-80 transition-opacity"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          All articles
        </Link>
      </div>
    </article>
  )
}
