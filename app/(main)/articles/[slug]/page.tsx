import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import { getAllArticles, getArticleBySlug } from '@/lib/articles'
import { Reveal } from '../../_components/Reveal'
import './prose.css'

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

/** Turns "2026-03-12" into "12 Mar 2026". Falls back to the raw string if it doesn't parse. */
function formatDate(dateStr: string): string {
  const parsed = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ArticlePage({ params }: Props) {
  const article = getArticleBySlug(params.slug)

  if (!article) {
    notFound()
  }

  // getAllArticles() sorts most-recent-first, so the array index before the
  // current one is the newer post ("Next") and the one after is older ("Previous").
  const articles = getAllArticles()
  const currentIndex = articles.findIndex((a) => a.slug === params.slug)
  const prevArticle =
    currentIndex >= 0 && currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null
  const nextArticle = currentIndex > 0 ? articles[currentIndex - 1] : null

  return (
    <article className="prism-section">
      <div className="prism-wrap" style={{ maxWidth: 'var(--prism-measure)' }}>
        <Reveal>
          <Link
            href="/articles"
            className="prism-btn-quiet"
            style={{ marginBottom: 'clamp(24px, 4vh, 40px)' }}
          >
            ← All writing
          </Link>
        </Reveal>

        <Reveal delay={60}>
          <header className="prism-col" style={{ gap: '1rem', marginBottom: 'clamp(32px, 5vh, 56px)' }}>
            <h1 className="prism-title">{article.title}</h1>
            <div className="prism-row" style={{ gap: '12px' }}>
              <time className="prism-mono prism-muted" style={{ fontSize: '0.85em' }} dateTime={article.date}>
                {formatDate(article.date)}
              </time>
              <span className="prism-mono prism-muted" style={{ fontSize: '0.85em' }}>
                {article.readingTime}
              </span>
              {article.tags.map((tag) => (
                <span key={tag} className="prism-chip">
                  {tag}
                </span>
              ))}
            </div>
          </header>
        </Reveal>

        <Reveal delay={120}>
          <div className="prism-prose">
            <MDXRemote
              source={article.content}
              options={{
                mdxOptions: {
                  rehypePlugins: [rehypeSlug, rehypeHighlight],
                },
              }}
            />
          </div>
        </Reveal>

        <div
          className="prism-rule"
          style={{ marginTop: 'clamp(48px, 6vh, 72px)', marginBottom: 'clamp(24px, 4vh, 40px)' }}
        />

        {(prevArticle || nextArticle) && (
          <div className="prism-row" style={{ justifyContent: 'space-between', gap: '24px' }}>
            <div>
              {prevArticle && (
                <Link
                  href={`/articles/${prevArticle.slug}`}
                  className="prism-col"
                  style={{ gap: '0.35rem', textDecoration: 'none', color: 'inherit' }}
                >
                  <span className="prism-eyebrow">← Previous</span>
                  <span className="prism-body" style={{ fontWeight: 600, maxWidth: 'none' }}>
                    {prevArticle.title}
                  </span>
                </Link>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              {nextArticle && (
                <Link
                  href={`/articles/${nextArticle.slug}`}
                  className="prism-col"
                  style={{ gap: '0.35rem', textDecoration: 'none', color: 'inherit', alignItems: 'flex-end' }}
                >
                  <span className="prism-eyebrow">Next →</span>
                  <span className="prism-body" style={{ fontWeight: 600, maxWidth: 'none' }}>
                    {nextArticle.title}
                  </span>
                </Link>
              )}
            </div>
          </div>
        )}

        <Reveal delay={180}>
          <div style={{ marginTop: 'clamp(32px, 5vh, 48px)' }}>
            <Link href="/articles" className="prism-btn-ghost">
              All writing
            </Link>
          </div>
        </Reveal>
      </div>
    </article>
  )
}
