import type { JSX } from 'react'
import type { RadarPick, RadarPost } from '@/lib/radar'
import { Reveal } from './Reveal'

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

function PulseEntry({ post, isLatest }: { post: RadarPost; isLatest: boolean }): JSX.Element {
  const paragraphs = post.content.trim().split(/\n\n+/)

  return (
    <div className="v2-card v2-card-lift v2-radar-entry">
      <div className="v2-row" style={{ gap: '8px', alignItems: 'center' }}>
        <span className="v2-mono v2-muted" style={{ fontSize: '0.78em' }}>
          {formatDate(post.date)}
        </span>
        {post.tags[0] && (
          <span className="v2-chip" style={{ fontSize: '0.72em' }}>
            {post.tags[0]}
          </span>
        )}
        {isLatest && (
          <span className="v2-badge" style={{ fontSize: '0.6rem', padding: '0.2em 0.55em' }}>
            Latest
          </span>
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

function PickEntry({ pick, isLatest }: { pick: RadarPick; isLatest: boolean }): JSX.Element {
  return (
    <a
      href={pick.url}
      target="_blank"
      rel="noopener noreferrer"
      className="v2-card v2-card-lift v2-radar-entry v2-radar-pick"
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div className="v2-row" style={{ gap: '8px', alignItems: 'center' }}>
        <span className="v2-eyebrow v2-radar-type" data-type={pick.type}>
          {pick.type}
        </span>
        <span className="v2-mono v2-muted" style={{ fontSize: '0.78em' }}>
          {formatDate(pick.date)}
        </span>
        {isLatest && (
          <span className="v2-badge" style={{ fontSize: '0.6rem', padding: '0.2em 0.55em' }}>
            Latest
          </span>
        )}
      </div>
      <div className="v2-row" style={{ gap: '6px', alignItems: 'baseline', marginTop: '6px' }}>
        <h3 className="v2-sub v2-radar-pick-title" style={{ margin: 0 }}>
          {pick.title}
        </h3>
        <span className="v2-radar-arrow" aria-hidden="true">
          ↗
        </span>
      </div>
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
 *
 * Entries are page-scoped classes (`.v2-radar-*`), styled by the
 * `<style>` block below — the same pattern `articles/page.tsx` uses for its
 * tag filter. This keeps every visual rule (hover, focus, type colour) out
 * of inline `style={{}}`, which stays structural-only per CONTRACT.md.
 */
export function RadarView({ posts, picks }: RadarViewProps): JSX.Element {
  return (
    <>
      <div className="v2-grid v2-radar-scope" data-cols="2" style={{ alignItems: 'start' }}>
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
            posts.map((post, i) => (
              <Reveal key={post.slug} delay={(i % 6) * 50}>
                <PulseEntry post={post} isLatest={i === 0} />
                <div className="v2-rule" />
              </Reveal>
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
            picks.map((pick, i) => (
              <Reveal key={pick.slug} delay={(i % 6) * 50}>
                <PickEntry pick={pick} isLatest={i === 0} />
                <div className="v2-rule" />
              </Reveal>
            ))
          )}
        </div>
      </div>

      {/* dangerouslySetInnerHTML, not a text child — see CONTRACT.md §7b.
          A plain <style> text child gets escaped differently on the server
          vs the client the moment a quote appears (attribute selectors
          below, e.g. [data-type="tool"]), and that mismatch throws away the
          whole server-rendered tree. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Skin comes from .v2-card, which every theme file styles — that is
           why radar looked different from the rest of the site. Only layout
           and link-reset live here; do not re-declare border, background,
           radius or shadow or the theme's card treatment gets overridden. */
        .v2-radar-entry {
          display: block;
          margin-block: 2px;
        }
        .v2-radar-pick:focus-visible {
          outline: 2px solid var(--v2-accent);
          outline-offset: 2px;
        }
        @media (hover: hover) {
          .v2-radar-entry:hover {
            transform: translateX(3px);
          }
        }
        .v2-radar-pick-title {
          transition: color var(--v2-dur-fast) var(--v2-ease);
        }
        .v2-radar-entry:hover .v2-radar-pick-title,
        .v2-radar-pick:focus-visible .v2-radar-pick-title {
          color: var(--v2-accent);
        }
        .v2-radar-arrow {
          font-size: 0.78em;
          color: var(--v2-muted);
          transition: transform var(--v2-dur-fast) var(--v2-ease),
                      color var(--v2-dur-fast) var(--v2-ease);
        }
        .v2-radar-entry:hover .v2-radar-arrow,
        .v2-radar-pick:focus-visible .v2-radar-arrow {
          color: var(--v2-accent);
        }
        @media (hover: hover) {
          .v2-radar-entry:hover .v2-radar-arrow,
          .v2-radar-pick:focus-visible .v2-radar-arrow {
            transform: translate(2px, -2px);
          }
        }
        .v2-radar-type {
          padding: 0.22em 0.6em;
          border-radius: var(--v2-radius-sm);
          border: var(--v2-border-w) solid var(--v2-line);
        }
        .v2-radar-type[data-type="tool"],
        .v2-radar-type[data-type="resource"] {
          color: var(--v2-accent);
          border-color: color-mix(in srgb, var(--v2-accent) 40%, transparent);
          background: color-mix(in srgb, var(--v2-accent) 12%, transparent);
        }
        .v2-radar-type[data-type="blog"],
        .v2-radar-type[data-type="model"] {
          color: var(--v2-accent-2);
          border-color: color-mix(in srgb, var(--v2-accent-2) 40%, transparent);
          background: color-mix(in srgb, var(--v2-accent-2) 12%, transparent);
        }
        .v2-radar-type[data-type="repo"],
        .v2-radar-type[data-type="paper"] {
          color: var(--v2-accent-3);
          border-color: color-mix(in srgb, var(--v2-accent-3) 40%, transparent);
          background: color-mix(in srgb, var(--v2-accent-3) 12%, transparent);
        }
        @media (prefers-reduced-motion: reduce) {
          .v2-radar-entry,
          .v2-radar-arrow,
          .v2-radar-pick-title {
            transition: none;
          }
          .v2-radar-entry:hover,
          .v2-radar-entry:hover .v2-radar-arrow,
          .v2-radar-pick:focus-visible .v2-radar-arrow {
            transform: none;
          }
        }
      `,
        }}
      />
    </>
  )
}

export default RadarView
