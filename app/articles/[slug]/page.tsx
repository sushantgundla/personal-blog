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
        className="inline-flex items-center gap-1.5 text-primary font-label text-[10px] uppercase tracking-widest hover:opacity-80 transition-opacity mb-10 animate-fade-up"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Articles
      </Link>

      {/* Header */}
      <header className="mb-10 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-on-surface mb-4">
          {article.title}
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <time className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
            {article.date}
          </time>
          <span className="text-on-surface-variant/30">&middot;</span>
          <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
            {article.readingTime}
          </span>
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[9px] font-label font-bold uppercase tracking-widest"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="prose max-w-3xl animate-fade-up" style={{ animationDelay: '200ms' }}>
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
      <div className="mt-16 pt-8 border-t border-outline-variant/20">
        <Link
          href="/articles"
          className="inline-flex items-center gap-1.5 text-primary font-label text-[10px] uppercase tracking-widest hover:opacity-80 transition-opacity"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          All Articles
        </Link>
      </div>
    </article>
  )
}
