'use client'

import { useMemo, useRef, useState } from 'react'
import type { JSX, KeyboardEvent } from 'react'
import type { RadarPick, RadarPost } from '@/lib/radar'

export interface RadarViewProps {
  posts: RadarPost[]
  picks: RadarPick[]
}

type Tab = 'pulses' | 'picks'

const TABS: { id: Tab; label: string }[] = [
  { id: 'pulses', label: 'Pulses' },
  { id: 'picks', label: 'Picks' },
]

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

function PulseCard({ post }: { post: RadarPost }): JSX.Element {
  const paragraphs = post.content.trim().split(/\n\n+/)

  return (
    <div className="v2-card v2-col" style={{ gap: '0.75rem' }}>
      <div className="v2-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="v2-sub" style={{ fontWeight: 700 }}>
          {post.title}
        </span>
        <span className="v2-mono v2-muted" style={{ fontSize: '0.82em', flexShrink: 0 }}>
          {formatDate(post.date)}
        </span>
      </div>
      <div className="v2-col" style={{ gap: '0.6rem' }}>
        {paragraphs.map((p, i) => (
          <p key={i} className="v2-body v2-muted" style={{ margin: 0 }}>
            {p}
          </p>
        ))}
      </div>
      {post.tags.length > 0 && (
        <div className="v2-row" style={{ gap: '8px' }}>
          {post.tags.map((tag) => (
            <span key={tag} className="v2-chip">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function PickCard({ pick }: { pick: RadarPick }): JSX.Element {
  return (
    <a
      href={pick.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'block', height: '100%', textDecoration: 'none', color: 'inherit' }}
    >
      <div className="v2-card v2-card-lift v2-col" style={{ height: '100%', gap: '0.6rem' }}>
        <div className="v2-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className="v2-badge">{pick.type}</span>
          <span className="v2-mono v2-muted" style={{ fontSize: '0.8em', flexShrink: 0 }}>
            {hostnameOf(pick.url)}
          </span>
        </div>
        <span className="v2-body" style={{ fontWeight: 700 }}>
          {pick.title}
        </span>
        {pick.description && (
          <p className="v2-body v2-muted" style={{ margin: 0 }}>
            {pick.description}
          </p>
        )}
        <div className="v2-row" style={{ gap: '8px', marginTop: 'auto' }}>
          {pick.tags.map((tag) => (
            <span key={tag} className="v2-chip">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </a>
  )
}

export function RadarView({ posts, picks }: RadarViewProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('pulses')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ pulses: null, picks: null })

  const pickTypes = useMemo(() => {
    const seen = new Set<string>()
    for (const pick of picks) seen.add(pick.type)
    return Array.from(seen)
  }, [picks])

  const filteredPicks = useMemo(
    () => (typeFilter === 'all' ? picks : picks.filter((p) => p.type === typeFilter)),
    [picks, typeFilter]
  )

  function onTabKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const idx = TABS.findIndex((t) => t.id === activeTab)
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const dir = e.key === 'ArrowRight' ? 1 : -1
      const next = TABS[(idx + dir + TABS.length) % TABS.length]
      setActiveTab(next.id)
      tabRefs.current[next.id]?.focus()
    }
  }

  return (
    <div className="v2-col" style={{ gap: 'clamp(20px, 3vw, 32px)' }}>
      <div className="v2-row" role="tablist" aria-label="Radar view" style={{ gap: '8px' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el
            }}
            type="button"
            role="tab"
            id={`radar-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`radar-panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={`v2-btn-quiet${activeTab === tab.id ? ' v2-chip-on' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={onTabKeyDown}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'pulses' && (
        <div id="radar-panel-pulses" role="tabpanel" aria-labelledby="radar-tab-pulses">
          {posts.length === 0 ? (
            <p className="v2-body v2-muted">No pulses yet — check back soon.</p>
          ) : (
            <div className="v2-col" style={{ gap: '16px' }}>
              {posts.map((post) => (
                <PulseCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'picks' && (
        <div id="radar-panel-picks" role="tabpanel" aria-labelledby="radar-tab-picks">
          {picks.length === 0 ? (
            <p className="v2-body v2-muted">No picks yet — check back soon.</p>
          ) : (
            <div className="v2-col" style={{ gap: '20px' }}>
              {pickTypes.length > 1 && (
                <div className="v2-row" role="group" aria-label="Filter picks by type" style={{ gap: '8px' }}>
                  <button
                    type="button"
                    className={`v2-btn-quiet${typeFilter === 'all' ? ' v2-chip-on' : ''}`}
                    aria-pressed={typeFilter === 'all'}
                    onClick={() => setTypeFilter('all')}
                  >
                    All
                  </button>
                  {pickTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`v2-btn-quiet${typeFilter === type ? ' v2-chip-on' : ''}`}
                      aria-pressed={typeFilter === type}
                      onClick={() => setTypeFilter(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
              <div className="v2-grid" data-cols="3">
                {filteredPicks.map((pick) => (
                  <PickCard key={pick.slug} pick={pick} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RadarView
