'use client'

import Link from 'next/link'
import type { JSX } from 'react'
import type { RadarPick, RadarPost } from '@/lib/radar'
import { Reveal } from './Reveal'

export interface RadarHomeProps {
  latestPost: RadarPost | null
  picks: RadarPick[]
}

/** Turns "2026-03-12" into "12 Mar 2026". Falls back to the raw string if it doesn't parse. */
function formatDate(dateStr: string): string {
  const parsed = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Extracts a bare hostname from a URL, e.g. "https://arxiv.org/abs/123" -> "arxiv.org". */
function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** First paragraph of a pulse's content, trimmed to a short excerpt. */
function excerptOf(content: string): string {
  const firstParagraph = content.trim().split(/\n\n+/)[0] ?? ''
  return firstParagraph.length > 220 ? `${firstParagraph.slice(0, 220).trimEnd()}…` : firstParagraph
}

export function RadarHome({ latestPost, picks }: RadarHomeProps): JSX.Element | null {
  if (!latestPost && picks.length === 0) return null

  const recentPicks = picks.slice(0, 4)

  return (
    <section id="v2-radar" className="v2-section">
      <div className="v2-wrap">
        <Reveal>
          <span className="v2-eyebrow"><span className="v2-dot" />AI Radar</span>
          <h2 className="v2-head">Signals from the frontier</h2>
        </Reveal>

        {latestPost && (
          <Reveal delay={60}>
            <div style={{ marginTop: '24px' }}>
              <Link
                href="/radar"
                style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
              >
                <div className="v2-card v2-card-lift v2-col" style={{ gap: '0.75rem' }}>
                  <div className="v2-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="v2-eyebrow">Latest pulse</span>
                    <span className="v2-mono v2-muted" style={{ fontSize: '0.82em' }}>
                      {formatDate(latestPost.date)}
                    </span>
                  </div>
                  <span className="v2-sub" style={{ fontWeight: 700 }}>
                    {latestPost.title}
                  </span>
                  <p className="v2-body v2-muted" style={{ margin: 0 }}>
                    {excerptOf(latestPost.content)}
                  </p>
                  {latestPost.tags.length > 0 && (
                    <div className="v2-row" style={{ gap: '8px' }}>
                      {latestPost.tags.map((tag) => (
                        <span key={tag} className="v2-chip">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </div>
          </Reveal>
        )}

        {recentPicks.length > 0 && (
          <div style={{ marginTop: latestPost ? 'clamp(16px, 2.4vw, 24px)' : '24px' }}>
            <Reveal delay={100}>
              <span className="v2-eyebrow" style={{ display: 'block', marginBottom: '12px' }}>
                Recent picks
              </span>
            </Reveal>
            <div className="v2-grid" data-cols="4">
              {recentPicks.map((pick, i) => (
                <Reveal key={pick.slug} delay={120 + i * 60}>
                  <a
                    href={pick.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', height: '100%', textDecoration: 'none', color: 'inherit' }}
                  >
                    <div
                      className="v2-card v2-card-lift v2-col"
                      style={{ height: '100%', gap: '0.5rem', paddingBlock: 'clamp(14px, 2vw, 18px)' }}
                    >
                      <span className="v2-badge">{pick.type}</span>
                      <span className="v2-body" style={{ fontWeight: 600, fontSize: '0.92em' }}>
                        {pick.title}
                      </span>
                      <span className="v2-mono v2-muted" style={{ fontSize: '0.78em' }}>
                        {hostnameOf(pick.url)}
                      </span>
                    </div>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        )}

        <Reveal delay={200}>
          <div style={{ marginTop: '24px' }}>
            <Link href="/radar" className="v2-btn-ghost">
              All signals →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default RadarHome
