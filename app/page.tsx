import { getAllArticles } from '@/lib/articles'
import { getAllRadarPosts, getAllRadarPicks } from '@/lib/radar'
import { ArticleCard } from '@/components/ArticleCard'
import { RadarTabs } from '@/components/RadarTabs'
import { siteConfig } from '@/lib/config'
import Link from 'next/link'
import Image from 'next/image'

const accentColors = ['var(--accent)', 'var(--accent-violet)', 'var(--accent-blue)']

export default function Home() {
  const articles = getAllArticles().slice(0, 3)
  const radarPosts = getAllRadarPosts()
  const radarPicks = getAllRadarPicks()

  return (
    <div className="space-y-16">

    {/* Hero with portrait */}
    <section className="animate-fade-up">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div
          className="flex-shrink-0 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
            padding: '3px',
          }}
        >
          <div className="rounded-[14px] overflow-hidden bg-[var(--bg-secondary)]">
            <Image
              src="/portrait.jpg"
              alt={siteConfig.name}
              width={200}
              height={200}
              className="w-[120px] sm:w-[140px] object-cover object-top"
              style={{ aspectRatio: '3/4' }}
              unoptimized
            />
          </div>
        </div>
        <div>
          <h1
            className="text-[38px] font-bold tracking-tight leading-[1.1] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span style={{ color: 'var(--accent)' }}>{siteConfig.name}</span>
          </h1>
          <p
            className="text-[15px] text-[var(--text-muted)] tracking-wide mb-5"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {siteConfig.tagline}
          </p>

          {/* Social links */}
          <div className="flex gap-2.5">
            {Object.entries(siteConfig.social).map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-all"
              >
                {platform === 'twitter' && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                )}
                {platform === 'github' && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                )}
                {platform === 'linkedin' && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                )}
              </a>
            ))}
            <a
              href={`mailto:${siteConfig.email}`}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>

    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-16 lg:gap-12 items-start">

      {/* ── LEFT COLUMN ── */}
      <div>
        {/* Recent Articles */}
        <section className="animate-fade-up delay-1">
          <h2
            className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Recent writing
          </h2>
          {articles.length > 0 ? (
            <>
              <div>
                {articles.map((article, i) => (
                  <ArticleCard key={article.slug} article={article} index={i} />
                ))}
              </div>
              <Link
                href="/articles"
                className="inline-flex items-center gap-1.5 mt-6 text-[13.5px] font-medium text-[var(--accent)] hover:opacity-80 transition-opacity"
              >
                View all articles
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
            </>
          ) : (
            <div className="py-12 text-center border border-dashed border-[var(--border)] rounded-lg">
              <p className="text-[var(--text-muted)] text-[14px] mb-1">No articles yet</p>
              <p className="text-[var(--text-muted)] text-[13px] opacity-70">
                Add <code className="text-[12px] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">.mdx</code> files to <code className="text-[12px] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">content/articles/</code> to get started
              </p>
            </div>
          )}
        </section>

        {/* ── RADAR SECTION ── */}
        <section className="animate-fade-up delay-3 mt-16">
          <div className="flex items-baseline justify-between mb-4">
            <h2
              className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Radar
            </h2>
            <Link
              href="/radar"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--accent)] hover:opacity-80 transition-opacity"
            >
              View all
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </div>
          <RadarTabs posts={radarPosts} picks={radarPicks} />
        </section>
      </div>

      {/* ── RIGHT COLUMN — Experience ── */}
      <aside className="animate-fade-up delay-2 order-last lg:order-none lg:sticky lg:top-8">
        <h2
          className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Experience
        </h2>
        <div className="space-y-0">
          {siteConfig.work.map((job, i) => (
            <div key={i} className="flex gap-3.5 py-3.5 border-b border-[var(--border)] last:border-0">
              <div
                className="w-2 h-2 rounded-full mt-[7px] flex-shrink-0"
                style={{ background: accentColors[i % accentColors.length] }}
              />
              <div>
                <div
                  className="text-[14px] font-semibold text-[var(--text-primary)] leading-snug"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {job.company}
                </div>
                <div className="text-[12.5px] text-[var(--text-secondary)] mt-0.5">
                  {job.role}
                </div>
                <div className="text-[11.5px] text-[var(--text-muted)] mt-0.5">
                  {job.period}
                </div>
              </div>
            </div>
          ))}
        </div>
        <Link
          href="/about"
          className="inline-flex items-center gap-1.5 mt-5 text-[13px] font-medium text-[var(--accent)] hover:opacity-80 transition-opacity"
        >
          Full resume
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </Link>
      </aside>

    </div>

    </div>
  )
}
