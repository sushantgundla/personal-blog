import type { Metadata } from 'next'
import { getAllRadarPosts, getAllRadarPicks } from '@/lib/radar'
import { Reveal } from '../_components/Reveal'

export const metadata: Metadata = {
  title: 'Radar',
  description: 'Signals, notes, and picks from the AI frontier.',
}

const ArrowUpRight = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17L17 7M17 7H7M17 7v10" />
  </svg>
)

export default function V4RadarPage() {
  const posts = getAllRadarPosts()
  const picks = getAllRadarPicks()

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 py-14 md:py-20">
      <Reveal>
        <h1 className="v4-display font-black tracking-tight text-on-surface text-5xl md:text-6xl leading-[1.05]">
          Radar
        </h1>
      </Reveal>
      <Reveal delay={80}>
        <p className="text-on-surface-variant text-base md:text-lg mt-5 max-w-2xl">
          Signals, notes, and picks from the AI frontier.
        </p>
      </Reveal>

      <div className="mt-12 md:mt-16 grid grid-cols-1 lg:grid-cols-2 gap-x-12 xl:gap-x-16 gap-y-14">
        {/* ---------- Pulses ---------- */}
        <section>
          <ColumnHeader index="01" title="Pulses" count={posts.length} />
          {posts.length > 0 ? (
            <ul className="border-t border-outline-variant/50">
              {posts.map((post, i) => {
                const excerpt = post.content.trim().split(/\n\n+/)[0]
                return (
                  <Reveal key={post.slug} delay={Math.min(i, 8) * 40}>
                    <li>
                      <div className="v4-row group -mx-3 px-3 py-4 md:py-[18px] border-b border-outline-variant/50">
                        <span className="v4-row-fill" aria-hidden="true" />
                        <div className="v4-row-content">
                          <div className="v4-row-meta flex items-center gap-x-2.5 font-mono text-[10px] uppercase tracking-widest">
                            <time>{post.date}</time>
                            {post.tags?.[0] && (
                              <>
                                <span className="opacity-40">·</span>
                                <span>{post.tags[0]}</span>
                              </>
                            )}
                          </div>
                          <h3 className="v4-row-title v4-display font-bold tracking-tight text-lg md:text-xl leading-[1.2] mt-1.5">
                            {post.title}
                          </h3>
                          {excerpt && (
                            <p className="mt-1.5 text-on-surface-variant text-sm leading-relaxed line-clamp-2 group-hover:text-white/90 transition-colors">
                              {excerpt}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  </Reveal>
                )
              })}
            </ul>
          ) : (
            <EmptyState title="Quiet on the wire." body="Notes will land here as they happen." />
          )}
        </section>

        {/* ---------- Picks ---------- */}
        <section>
          <ColumnHeader index="02" title="Picks" count={picks.length} />
          {picks.length > 0 ? (
            <ul className="border-t border-outline-variant/50">
              {picks.map((pick, i) => (
                <Reveal key={pick.slug} delay={Math.min(i, 8) * 40}>
                  <li>
                    <a
                      href={pick.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="v4-row group block -mx-3 px-3 py-4 md:py-[18px] border-b border-outline-variant/50"
                    >
                      <span className="v4-row-fill" aria-hidden="true" />
                      <div className="v4-row-content">
                        <div className="v4-row-meta flex items-center gap-x-2.5 font-mono text-[10px] uppercase tracking-widest">
                          <span className="text-primary group-hover:text-on-primary transition-colors">{pick.type}</span>
                          <span className="opacity-40">·</span>
                          <span>{pick.date}</span>
                        </div>
                        <div className="flex items-start justify-between gap-3 mt-1.5">
                          <h3 className="v4-row-title v4-display font-bold tracking-tight text-lg md:text-xl leading-[1.2]">
                            {pick.title}
                          </h3>
                          <ArrowUpRight className="v4-row-arrow shrink-0 mt-1" />
                        </div>
                        {pick.description && (
                          <p className="mt-1.5 text-on-surface-variant text-sm leading-relaxed line-clamp-2 group-hover:text-white/90 transition-colors">
                            {pick.description}
                          </p>
                        )}
                      </div>
                    </a>
                  </li>
                  </Reveal>
                ))}
              </ul>
            ) : (
            <EmptyState title="Nothing curated yet." body="Picks worth your time will surface here." />
          )}
        </section>
      </div>
    </div>
  )
}

function ColumnHeader({ index, title, count }: { index: string; title: string; count: number }) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
        {index} / {title}
      </span>
      <span className="font-mono text-[11px] tabular-nums text-on-surface-variant/50">
        {String(count).padStart(2, '0')}
      </span>
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 border-t border-b border-outline-variant/60">
      <p className="v4-display text-xl font-bold text-on-surface mb-2">{title}</p>
      <p className="text-on-surface-variant text-sm max-w-xs text-center leading-relaxed">{body}</p>
    </div>
  )
}
