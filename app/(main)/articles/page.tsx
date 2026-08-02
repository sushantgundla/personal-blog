import { Fragment } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllArticles } from '@/lib/articles'
import { Reveal } from '../_components/Reveal'

export const metadata: Metadata = {
  title: 'Writing',
  // His own wording — matches the visible intro below. Do not paraphrase.
  description:
    'Technical deep-dives into the architecture of modern machine intelligence, retrieval systems, and neural optimization.',
}

interface ArticleSummary {
  slug: string
  title: string
  date: string
  description: string
  tags: string[]
  readingTime: string
}

/** Turns "2026-03-12" into "12 Mar 2026". Falls back to the raw string if it doesn't parse. */
function formatDate(dateStr: string): string {
  const parsed = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** "Machine Learning" -> "machine-learning", for use as a DOM id. */
function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function ArticlesPage() {
  const articles: ArticleSummary[] = getAllArticles().map(
    ({ slug, title, date, description, tags, readingTime }) => ({
      slug,
      title,
      date,
      description,
      tags,
      readingTime,
    })
  )
  const [featured, ...rest] = articles
  const uniqueTags = Array.from(new Set(articles.flatMap((a) => a.tags))).sort()

  return (
    <>
      <section className="v2-section" style={{ paddingBottom: 0 }}>
        <div className="v2-wrap">
          <Reveal>
            {/* Headline and intro are his own copy, carried over verbatim from
                the previous designs — do not paraphrase them. */}
            <span className="v2-eyebrow">Articles</span>
            <h1 className="v2-title" style={{ marginTop: '0.5rem' }}>
              Writing
            </h1>
            <p className="v2-body v2-muted" style={{ marginTop: '1.25rem' }}>
              Technical deep-dives into the architecture of modern machine intelligence, retrieval
              systems, and neural optimization.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="v2-section" style={{ paddingTop: 'clamp(24px, 4vh, 48px)' }}>
        <div className="v2-wrap">
          {articles.length === 0 ? (
            <Reveal>
              <div
                className="v2-panel v2-col"
                style={{ alignItems: 'center', textAlign: 'center', gap: '0.75rem' }}
              >
                <span className="v2-eyebrow">Drafts in progress</span>
                <p className="v2-sub">Nothing published yet.</p>
                <p className="v2-body v2-muted">
                  The outlines are messy and the first drafts are terrible, exactly as they
                  should be. Check back soon.
                </p>
              </div>
            </Reveal>
          ) : (
            <div className="v2-articles-scope">
              {uniqueTags.length > 1 && (
                <Reveal>
                  <div className="v2-row" style={{ marginBottom: 'clamp(24px, 4vh, 40px)' }}>
                    <input
                      type="radio"
                      name="v2-article-tag"
                      id="v2-tag-all"
                      className="v2-articles-radio"
                      defaultChecked
                    />
                    <label htmlFor="v2-tag-all" className="v2-chip">
                      All
                    </label>
                    {uniqueTags.map((tag) => (
                      <Fragment key={tag}>
                        <input
                          type="radio"
                          name="v2-article-tag"
                          id={`v2-tag-${slugifyTag(tag)}`}
                          className="v2-articles-radio"
                        />
                        <label htmlFor={`v2-tag-${slugifyTag(tag)}`} className="v2-chip">
                          {tag}
                        </label>
                      </Fragment>
                    ))}
                  </div>
                </Reveal>
              )}

              {featured && (
                <Reveal>
                  <Link
                    href={`/articles/${featured.slug}`}
                    data-tags={`|${featured.tags.join('|')}|`}
                    className="v2-articles-card"
                    style={{
                      display: 'block',
                      textDecoration: 'none',
                      color: 'inherit',
                      marginBottom: 'clamp(24px, 4vh, 40px)',
                    }}
                  >
                    <div
                      className="v2-card v2-card-lift v2-col"
                      style={{ gap: '0.85rem', padding: 'clamp(28px, 4vw, 48px)' }}
                    >
                      <div className="v2-row" style={{ gap: '12px', flexWrap: 'wrap' }}>
                        <span
                          className="v2-badge"
                          style={{ fontSize: '0.62rem', padding: '0.22em 0.6em' }}
                        >
                          Latest
                        </span>
                        <h2 className="v2-head" style={{ margin: 0 }}>
                          {featured.title}
                        </h2>
                      </div>
                      <div className="v2-row" style={{ gap: '12px' }}>
                        <span className="v2-mono v2-muted" style={{ fontSize: '0.85em' }}>
                          {formatDate(featured.date)}
                        </span>
                        <span className="v2-mono v2-muted" style={{ fontSize: '0.85em' }}>
                          {featured.readingTime}
                        </span>
                      </div>
                      <p className="v2-body v2-muted" style={{ margin: 0 }}>
                        {featured.description}
                      </p>
                      {featured.tags.length > 0 && (
                        <div className="v2-row" style={{ gap: '8px' }}>
                          {featured.tags.map((tag) => (
                            <span key={tag} className="v2-chip">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </Reveal>
              )}

              {rest.length > 0 && (
                <div className="v2-grid">
                  {rest.map((article, i) => (
                    <Reveal key={article.slug} delay={(i % 4) * 60}>
                      <Link
                        href={`/articles/${article.slug}`}
                        data-tags={`|${article.tags.join('|')}|`}
                        className="v2-articles-card"
                        style={{
                          display: 'block',
                          height: '100%',
                          textDecoration: 'none',
                          color: 'inherit',
                        }}
                      >
                        <div
                          className="v2-card v2-card-lift v2-col"
                          style={{
                            height: '100%',
                            gap: '0.6rem',
                            paddingBlock: 'clamp(16px, 2.4vw, 24px)',
                          }}
                        >
                          <span className="v2-sub" style={{ fontWeight: 700 }}>
                            {article.title}
                          </span>
                          <div className="v2-row" style={{ gap: '12px' }}>
                            <span className="v2-mono v2-muted" style={{ fontSize: '0.85em' }}>
                              {formatDate(article.date)}
                            </span>
                            <span className="v2-mono v2-muted" style={{ fontSize: '0.85em' }}>
                              {article.readingTime}
                            </span>
                          </div>
                          <p className="v2-body v2-muted" style={{ margin: 0 }}>
                            {article.description}
                          </p>
                          {article.tags.length > 0 && (
                            <div className="v2-row" style={{ gap: '8px' }}>
                              {article.tags.map((tag) => (
                                <span key={tag} className="v2-chip">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              )}

              {/* Pure-CSS tag filter: radios drive :has() to hide cards whose
                  data-tags doesn't include the selected tag. No client JS,
                  so this stays a plain server component.

                  dangerouslySetInnerHTML, not a text child: the generated
                  selectors contain double quotes ([data-tags*="|AI|"]), and
                  React escapes those to &quot; when a <style> has a text child
                  on the server but not on the client. That mismatch threw
                  "Text content does not match server-rendered HTML" and forced
                  the whole page to re-render on the client. */}
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                .v2-articles-radio {
                  position: absolute;
                  opacity: 0;
                  width: 1px;
                  height: 1px;
                  pointer-events: none;
                }
                .v2-articles-scope label.v2-chip {
                  cursor: pointer;
                }
                .v2-articles-radio:focus-visible + .v2-chip {
                  outline: 2px solid var(--v2-accent);
                  outline-offset: 3px;
                }
                .v2-articles-radio:checked + .v2-chip {
                  background: var(--v2-accent-soft);
                  border-color: var(--v2-accent);
                  color: var(--v2-accent);
                }
                .v2-articles-card {
                  cursor: pointer;
                  transition: opacity var(--v2-dur) var(--v2-ease),
                              filter var(--v2-dur) var(--v2-ease);
                }
                /* Selecting a tag EMPHASISES the matches rather than hiding the
                   rest: every article stays on the page and keeps its slot in
                   the grid, and non-matching ones simply recede. Hiding them
                   made the grid jump and buried writing the reader might still
                   want. Same behaviour as the status filter on /projects. */
                ${uniqueTags
                  .map(
                    (tag) =>
                      `.v2-articles-scope:has(#v2-tag-${slugifyTag(tag)}:checked) .v2-articles-card:not([data-tags*="|${tag}|"]) { opacity: 0.3; filter: saturate(0.4); }`
                  )
                  .join('\n                ')}
                @media (prefers-reduced-motion: reduce) {
                  .v2-articles-card { transition: none; }
                }
              `,
                }}
              />
            </div>
          )}
        </div>
      </section>
    </>
  )
}
