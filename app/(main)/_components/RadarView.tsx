import type { JSX } from 'react'
import type { RadarPick, RadarPost } from '@/lib/radar'

export interface RadarViewProps {
  posts: RadarPost[]
  picks: RadarPick[]
}

/** Turns "2026-03-12" into "12 Mar 2026". Falls back to the raw string if it doesn't parse. */
function formatDate(dateStr: string): string {
  const parsed = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function PulseEntry({ post }: { post: RadarPost }): JSX.Element {
  const paragraphs = post.content.trim().split(/\n\n+/)

  return (
    <div style={{ paddingBlock: 'clamp(16px, 2.2vw, 22px)' }}>
      <div className="v2-row" style={{ gap: '8px' }}>
        <span className="v2-mono v2-muted" style={{ fontSize: '0.78em' }}>
          {formatDate(post.date)}
        </span>
        {post.tags[0] && (
          <>
            <span className="v2-mono v2-muted" style={{ fontSize: '0.78em' }}>
              ·
            </span>
            <span className="v2-mono v2-muted" style={{ fontSize: '0.78em' }}>
              {post.tags[0]}
            </span>
          </>
        )}
      </div>
      <h3 className="v2-sub" style={{ marginTop: '6px' }}>
        {post.title}
      </h3>
      <div className="v2-col" style={{ gap: '0.6rem', marginTop: '8px' }}>
        {paragraphs.map((p, i) => (
          <p key={i} className="v2-body v2-muted" style={{ margin: 0 }}>
            {p}
          </p>
        ))}
      </div>
    </div>
  )
}

function PickEntry({ pick }: { pick: RadarPick }): JSX.Element {
  return (
    <a
      href={pick.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        paddingBlock: 'clamp(16px, 2.2vw, 22px)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div className="v2-row" style={{ gap: '8px' }}>
        <span className="v2-eyebrow">{pick.type}</span>
        <span className="v2-mono v2-muted" style={{ fontSize: '0.78em' }}>
          {formatDate(pick.date)}
        </span>
      </div>
      <h3 className="v2-sub" style={{ marginTop: '6px' }}>
        {pick.title}
      </h3>
      {pick.description && (
        <p className="v2-body v2-muted" style={{ margin: '8px 0 0' }}>
          {pick.description}
        </p>
      )}
      {pick.tags.length > 0 && (
        <div className="v2-row" style={{ gap: '8px', marginTop: '10px' }}>
          {pick.tags.map((tag) => (
            <span key={tag} className="v2-chip">
              {tag}
            </span>
          ))}
        </div>
      )}
    </a>
  )
}

/**
 * Two-column radar view: Pulses on the left, Picks on the right, both fully
 * visible with no tabs. Each column heading carries its own total count.
 * `.v2-grid[data-cols="2"]` collapses to one column (Pulses above Picks) once
 * the viewport can no longer fit two 320px columns side by side.
 */
export function RadarView({ posts, picks }: RadarViewProps): JSX.Element {
  return (
    <div className="v2-grid" data-cols="2" style={{ alignItems: 'start' }}>
      <div className="v2-col" style={{ gap: 0 }}>
        <div className="v2-row" style={{ justifyContent: 'space-between' }}>
          <span className="v2-eyebrow v2-mono">01 / PULSES</span>
          <span className="v2-mono v2-muted">{posts.length}</span>
        </div>
        <div className="v2-rule" style={{ marginTop: '14px' }} />
        {posts.length === 0 ? (
          <p className="v2-body v2-muted" style={{ marginTop: '20px' }}>
            No pulses yet — check back soon.
          </p>
        ) : (
          posts.map((post) => (
            <div key={post.slug}>
              <PulseEntry post={post} />
              <div className="v2-rule" />
            </div>
          ))
        )}
      </div>

      <div className="v2-col" style={{ gap: 0 }}>
        <div className="v2-row" style={{ justifyContent: 'space-between' }}>
          <span className="v2-eyebrow v2-mono">02 / PICKS</span>
          <span className="v2-mono v2-muted">{picks.length}</span>
        </div>
        <div className="v2-rule" style={{ marginTop: '14px' }} />
        {picks.length === 0 ? (
          <p className="v2-body v2-muted" style={{ marginTop: '20px' }}>
            No picks yet — check back soon.
          </p>
        ) : (
          picks.map((pick) => (
            <div key={pick.slug}>
              <PickEntry pick={pick} />
              <div className="v2-rule" />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default RadarView
