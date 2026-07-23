import type { Metadata } from 'next'
import { getAllRadarPosts, getAllRadarPicks } from '@/lib/radar'
import { Reveal } from '../_components/Reveal'

export const metadata: Metadata = {
  title: 'Radar',
  description: 'Signals, notes, and picks from the AI frontier.',
}

const ArrowUpRight = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17L17 7M17 7H7M17 7v10" />
  </svg>
)

export default function V4RadarPage() {
  const posts = getAllRadarPosts()
  const picks = getAllRadarPicks()

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 py-16 md:py-24">
      <Reveal>
        <h1 className="v4-display font-black tracking-tight text-on-surface text-5xl md:text-7xl leading-[1.05]">
          Radar
        </h1>
      </Reveal>
      <Reveal delay={80}>
        <p className="text-on-surface-variant text-lg mt-6 max-w-2xl">
          Signals, notes, and picks from the AI frontier.
        </p>
      </Reveal>

      <Section index="01" title="Pulses">
        {posts.length > 0 ? (
          <>
            {posts.map((post, i) => {
              const excerpt = post.content.trim().split(/\n\n+/)[0]
              return (
                <Reveal key={post.slug} delay={i * 60}>
                  <div className="border-t border-outline-variant/60 py-8 md:py-10">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] md:text-[11px] uppercase tracking-widest text-on-surface-variant">
                      <span>{post.date}</span>
                      {post.tags?.slice(0, 3).map((t) => (
                        <span key={t} className="opacity-60">
                          {t}
                        </span>
                      ))}
                    </div>
                    <h3 className="v4-display font-bold tracking-tight text-2xl md:text-3xl leading-[1.1] mt-3 text-on-surface">
                      {post.title}
                    </h3>
                    {excerpt && (
                      <p className="mt-4 text-on-surface-variant text-sm md:text-base max-w-2xl leading-relaxed">
                        {excerpt}
                      </p>
                    )}
                  </div>
                </Reveal>
              )
            })}
            <div className="border-t border-outline-variant/60" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 border-t border-b border-outline-variant/60">
            <p className="v4-display text-2xl font-bold text-on-surface mb-2">Quiet on the wire.</p>
            <p className="text-on-surface-variant text-sm max-w-md text-center leading-relaxed">
              Nothing logged yet. Notes will land here as they happen.
            </p>
          </div>
        )}
      </Section>

      <Section index="02" title="Picks">
        {picks.length > 0 ? (
          <>
            {picks.map((pick, i) => (
              <Reveal key={pick.slug} delay={i * 60}>
                <a
                  href={pick.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="v4-row -mx-3 px-3 group block border-t border-outline-variant/60 py-8 md:py-10"
                >
                  <span className="v4-row-fill" aria-hidden="true" />
                  <div className="v4-row-content flex items-start md:items-center gap-6 md:gap-10">
                    <span className="v4-row-index font-mono text-xs tabular-nums pt-2.5 md:pt-1">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="v4-row-title v4-display font-bold tracking-tight text-2xl md:text-3xl leading-[1.1]">
                        {pick.title}
                      </h3>
                      <div className="v4-row-meta flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 font-mono text-[10px] md:text-[11px] uppercase tracking-widest">
                        <span>{pick.type}</span>
                        <span className="opacity-40">·</span>
                        <span>{pick.date}</span>
                      </div>
                      {pick.description && (
                        <p className="mt-4 text-on-surface-variant text-sm md:text-base max-w-2xl leading-relaxed">
                          {pick.description}
                        </p>
                      )}
                    </div>
                    <ArrowUpRight className="v4-row-arrow shrink-0 hidden md:block" />
                  </div>
                </a>
              </Reveal>
            ))}
            <div className="border-t border-outline-variant/60" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 border-t border-b border-outline-variant/60">
            <p className="v4-display text-2xl font-bold text-on-surface mb-2">Nothing curated yet.</p>
            <p className="text-on-surface-variant text-sm max-w-md text-center leading-relaxed">
              Picks worth your time will surface here.
            </p>
          </div>
        )}
      </Section>
    </div>
  )
}

function Section({
  index,
  title,
  children,
}: {
  index: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-16 md:mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16">
        <div className="lg:col-span-3">
          <div className="v4-sticky-label mb-8 lg:mb-0">
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
              {index} / {title}
            </span>
          </div>
        </div>
        <div className="lg:col-span-9">{children}</div>
      </div>
    </section>
  )
}
