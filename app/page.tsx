import { getAllArticles } from '@/lib/articles'
import { getAllRadarPosts, getAllRadarPicks } from '@/lib/radar'
import { siteConfig } from '@/lib/config'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  const articles = getAllArticles().slice(0, 2)
  const radarPosts = getAllRadarPosts()
  const radarPicks = getAllRadarPicks()
  const latestPulse = radarPosts[0]

  return (
    <div>

      {/* ── HERO ── */}
      <section className="mb-40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left */}
          <div className="lg:col-span-7">
            {/* Status badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-outline-variant/30 bg-surface-container/50 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="font-label text-[11px] uppercase tracking-[0.12em] text-on-surface-variant">
                Available for Technical Leadership
              </span>
            </div>

            {/* Name */}
            <h1 className="font-headline text-6xl md:text-8xl font-bold tracking-tighter leading-[0.95] mb-6 name-glow-hover">
              <span className="animate-name-reveal inline-block">Sushant</span>
              <br />
              <span className="text-primary animate-name-glow inline-block">Gundla</span>
            </h1>

            {/* Tagline */}
            <p className="text-xl text-on-surface-variant max-w-lg mb-10 leading-relaxed whitespace-pre-line">
              {siteConfig.tagline}
              {'\n'}Architecting the intersection of generative intelligence and high-performance engineering.
            </p>

            {/* Buttons */}
            <div className="flex gap-4 mb-8">
              <Link
                href="/articles"
                className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-primary text-white font-label text-sm font-semibold tracking-wide hover:bg-primary/90 transition-colors"
              >
                View Articles
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-7 py-3 rounded-full border border-outline-variant text-on-surface font-label text-sm font-semibold tracking-wide hover:bg-surface-container transition-colors"
              >
                Resume
              </Link>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-8">
              <a href={siteConfig.social.twitter} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary transition-colors">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href={siteConfig.social.github} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary transition-colors">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href={siteConfig.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary transition-colors">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href={`mailto:${siteConfig.email}`} className="text-on-surface-variant hover:text-primary transition-colors">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </a>
            </div>
          </div>

          {/* Right — Portrait */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative">
              {/* Gradient glow */}
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-3xl border border-outline-variant/20 overflow-hidden group">
                <Image
                  src="/portrait-home.jpg"
                  alt={siteConfig.name}
                  width={480}
                  height={560}
                  className="w-full object-cover grayscale group-hover:grayscale-0 scale-100 group-hover:scale-105 transition-all duration-700 ease-out"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI RADAR ── */}
      <section className="mb-40">
        <div className="mb-10">
          <h2 className="font-headline text-4xl font-bold uppercase tracking-tight text-on-surface hover:text-primary transition-colors cursor-default">
            AI Radar
          </h2>
          <p className="text-on-surface-variant text-sm mt-2">
            Signals from the frontier of machine intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Latest Pulse */}
          <Link href="/radar" className="rounded-2xl border border-outline-variant/20 bg-surface-container p-8 hover:border-primary/30 hover:bg-surface-container-high hover:shadow-lg hover:shadow-primary/5 transition-all group block">
            <span className="font-label text-[11px] uppercase tracking-[0.12em] text-primary mb-4 block">
              Latest Pulse
            </span>
            <blockquote className="text-on-surface text-lg leading-relaxed font-body italic">
              {latestPulse
                ? latestPulse.content?.slice(0, 200) || latestPulse.title
                : 'The agentic paradigm isn\'t about replacing humans — it\'s about giving every engineer a fleet of tireless, context-aware collaborators.'}
            </blockquote>
            {latestPulse && (
              <p className="text-on-surface-variant text-sm mt-4">
                {latestPulse.date}
              </p>
            )}
          </Link>

          {/* Recent Picks */}
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container p-8 hover:border-primary/30 hover:bg-surface-container-high hover:shadow-lg hover:shadow-primary/5 transition-all">
            <span className="font-label text-[11px] uppercase tracking-[0.12em] text-secondary mb-6 block">
              Recent Picks
            </span>
            <div className="space-y-4">
              {radarPicks.length > 0 ? (
                radarPicks.slice(0, 4).map((pick) => (
                  <a
                    key={pick.slug}
                    href={pick.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 hover:translate-x-1 transition-transform"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-on-surface text-sm font-medium group-hover:text-primary transition-colors truncate">
                        {pick.title}
                      </p>
                      <p className="text-on-surface-variant text-xs mt-0.5 truncate">
                        {pick.description}
                      </p>
                    </div>
                  </a>
                ))
              ) : (
                <p className="text-on-surface-variant text-sm italic">Picks coming soon.</p>
              )}
            </div>
            <Link href="/radar" className="inline-flex items-center gap-1.5 mt-6 text-primary font-label text-xs uppercase tracking-wider hover:opacity-80 transition-opacity">
              View all
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── RECENT ARTICLES ── */}
      <section className="mb-40">
        <div className="flex items-end justify-between mb-10">
          <h2 className="font-headline text-4xl font-bold uppercase tracking-tight text-on-surface hover:text-primary transition-colors cursor-default">
            Articles
          </h2>
          <Link
            href="/articles"
            className="inline-flex items-center gap-1.5 font-label text-sm text-primary hover:opacity-80 transition-opacity"
          >
            View All
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="group rounded-2xl border border-outline-variant/20 bg-surface-container p-8 hover:border-primary/30 hover:bg-surface-container-high hover:shadow-lg hover:shadow-primary/5 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-label text-xs text-on-surface-variant">
                    {article.date}
                  </span>
                  {article.readingTime && (
                    <>
                      <span className="text-outline-variant">|</span>
                      <span className="font-label text-xs text-on-surface-variant">
                        {article.readingTime}
                      </span>
                    </>
                  )}
                </div>
                <h3 className="font-headline text-xl font-semibold text-on-surface group-hover:text-primary transition-colors mb-3">
                  {article.title}
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2 font-body">
                  {article.description}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center border border-dashed border-outline-variant/30 rounded-2xl">
            <p className="text-on-surface-variant text-sm">No articles yet.</p>
          </div>
        )}
      </section>

      {/* ── PROJECTS ── */}
      <section className="mb-40">
        <div className="flex items-end justify-between mb-10">
          <h2 className="font-headline text-4xl font-bold uppercase tracking-tight text-on-surface hover:text-primary transition-colors cursor-default">
            Projects
          </h2>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 font-label text-sm text-primary hover:opacity-80 transition-opacity"
          >
            View All
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>

        <div className="py-16 text-center border border-dashed border-outline-variant/30 rounded-2xl hover:border-primary/30 hover:bg-surface-container-high hover:shadow-lg hover:shadow-primary/5 transition-all">
          <p className="text-4xl mb-4">🧪</p>
          <p className="font-headline text-lg font-bold text-on-surface mb-1">Still cooking.</p>
          <p className="text-on-surface-variant text-sm max-w-md mx-auto">
            Projects will appear here once they escape the lab.
          </p>
        </div>
      </section>

    </div>
  )
}
