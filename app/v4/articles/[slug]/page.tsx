import './prose.css'
import Link from 'next/link'
import { getAllArticles, getArticleBySlug } from '@/lib/articles'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import { Reveal } from '../../_components/Reveal'

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

export default function V4ArticlePage({ params }: Props) {
  const article = getArticleBySlug(params.slug)

  if (!article) {
    notFound()
  }

  return (
    <article className="mx-auto max-w-3xl px-5 md:px-8 py-16 md:py-24">
      <Reveal>
        <Link
          href="/v4/articles"
          className="inline-flex items-center gap-1.5 text-primary font-mono text-xs uppercase tracking-widest hover:opacity-80 transition-opacity mb-10"
        >
          ← All writing
        </Link>

        <header className="mb-10">
          <h1 className="v4-display font-bold tracking-tight text-on-surface text-4xl md:text-5xl leading-tight">
            {article.title}
          </h1>
          <div className="flex items-center gap-3 flex-wrap mt-5 font-mono text-[10px] md:text-[11px] uppercase tracking-widest text-on-surface-variant">
            <span>{article.date}</span>
            <span className="opacity-40">·</span>
            <span>{article.readingTime}</span>
            {article.tags.map((tag) => (
              <span key={tag} className="opacity-60">
                {tag}
              </span>
            ))}
          </div>
        </header>
      </Reveal>

      <div className="v4-prose">
        <MDXRemote
          source={article.content}
          options={{
            mdxOptions: {
              rehypePlugins: [rehypeSlug, rehypeHighlight],
            },
          }}
        />
      </div>

      <div className="mt-16 pt-8 border-t border-outline-variant/60">
        <Link
          href="/v4/articles"
          className="inline-flex items-center gap-1.5 text-primary font-mono text-xs uppercase tracking-widest hover:opacity-80 transition-opacity"
        >
          ← All writing
        </Link>
      </div>
    </article>
  )
}
