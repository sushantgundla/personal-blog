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
    <div className="prism-card prism-card-lift prism-radar-entry">
      <div className="prism-row" style={{ gap: '8px', alignItems: 'center' }}>
        <span className="prism-mono prism-muted" style={{ fontSize: '0.78em' }}>
          {formatDate(post.date)}
        </span>
        {post.tags[0] && (
          <span className="prism-chip" style={{ fontSize: '0.72em' }}>
            {post.tags[0]}
          </span>
        )}
        {isLatest && (
          <span className="prism-badge" style={{ fontSize: '0.6rem', padding: '0.2em 0.55em' }}>
            Latest
          </span>
        )}
      </div>
      <h3 className="prism-sub" style={{ marginTop: '6px' }}>
        {post.title}
      </h3>
      <div className="prism-col" style={{ gap: '0.6rem', marginTop: '8px' }}>
        {paragraphs.map((p, i) => (
          <p key={i} className="prism-body prism-muted" style={{ margin: 0 }}>
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
      className="prism-card prism-card-lift prism-radar-entry prism-radar-pick"
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div className="prism-row" style={{ gap: '8px', alignItems: 'center' }}>
        <span className="prism-eyebrow prism-radar-type" data-type={pick.type}>
          {pick.type}
        </span>
        <span className="prism-mono prism-muted" style={{ fontSize: '0.78em' }}>
          {formatDate(pick.date)}
        </span>
        {isLatest && (
          <span className="prism-badge" style={{ fontSize: '0.6rem', padding: '0.2em 0.55em' }}>
            Latest
          </span>
        )}
      </div>
      <div className="prism-row" style={{ gap: '6px', alignItems: 'baseline', marginTop: '6px' }}>
        <h3 className="prism-sub prism-radar-pick-title" style={{ margin: 0 }}>
          {pick.title}
        </h3>
        <span className="prism-radar-arrow" aria-hidden="true">
          ↗
        </span>
      </div>
      {pick.description && (
        <p className="prism-body prism-muted" style={{ margin: '8px 0 0' }}>
          {pick.description}
        </p>
      )}
      {pick.tags.length > 0 && (
        <div className="prism-row" style={{ gap: '8px', marginTop: '10px' }}>
          {pick.tags.map((tag) => (
            <span key={tag} className="prism-chip">
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
 * `.prism-grid[data-cols="2"]` collapses to one column (Pulses above Picks) once
 * the viewport can no longer fit two 320px columns side by side.
 *
 * Entries are page-scoped classes (`.prism-radar-*`), styled by the
 * `<style>` block below — the same pattern `articles/page.tsx` uses for its
 * tag filter. This keeps every visual rule (hover, focus, type colour) out
 * of inline `style={{}}`, which stays structural-only per docs/architecture/design-system.md.
 */
export function RadarView({ posts, picks }: RadarViewProps): JSX.Element {
  return (
    <>
      <div className="prism-grid prism-radar-scope" data-cols="2" style={{ alignItems: 'start' }}>
        <div className="prism-col" style={{ gap: 0 }}>
          <div className="prism-row" style={{ justifyContent: 'space-between' }}>
            <span className="prism-eyebrow prism-mono">01 / PULSES</span>
            <span className="prism-mono prism-muted">{posts.length}</span>
          </div>
          <div className="prism-rule" style={{ marginTop: '14px' }} />
          {posts.length === 0 ? (
            <p className="prism-body prism-muted" style={{ marginTop: '20px' }}>
              No pulses yet — check back soon.
            </p>
          ) : (
            posts.map((post, i) => (
              <Reveal key={post.slug} delay={(i % 6) * 50}>
                <PulseEntry post={post} isLatest={i === 0} />
                <div className="prism-rule" />
              </Reveal>
            ))
          )}
        </div>

        <div className="prism-col" style={{ gap: 0 }}>
          <div className="prism-row" style={{ justifyContent: 'space-between' }}>
            <span className="prism-eyebrow prism-mono">02 / PICKS</span>
            <span className="prism-mono prism-muted">{picks.length}</span>
          </div>
          <div className="prism-rule" style={{ marginTop: '14px' }} />
          {picks.length === 0 ? (
            <p className="prism-body prism-muted" style={{ marginTop: '20px' }}>
              No picks yet — check back soon.
            </p>
          ) : (
            picks.map((pick, i) => (
              <Reveal key={pick.slug} delay={(i % 6) * 50}>
                <PickEntry pick={pick} isLatest={i === 0} />
                <div className="prism-rule" />
              </Reveal>
            ))
          )}
        </div>
      </div>

      {/* dangerouslySetInnerHTML, not a text child — see docs/architecture/design-system.md §6.
          A plain <style> text child gets escaped differently on the server
          vs the client the moment a quote appears (attribute selectors
          below, e.g. [data-type="tool"]), and that mismatch throws away the
          whole server-rendered tree. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Skin comes from .prism-card, which every theme file styles — that is
           why radar looked different from the rest of the site. Only layout
           and link-reset live here; do not re-declare border, background,
           radius or shadow or the theme's card treatment gets overridden. */
        .prism-radar-entry {
          display: block;
          margin-block: 2px;
        }
        .prism-radar-pick:focus-visible {
          outline: 2px solid var(--prism-accent);
          outline-offset: 2px;
        }
        @media (hover: hover) {
          .prism-radar-entry:hover {
            transform: translateX(3px);
          }
        }
        .prism-radar-pick-title {
          transition: color var(--prism-dur-fast) var(--prism-ease);
        }
        .prism-radar-entry:hover .prism-radar-pick-title,
        .prism-radar-pick:focus-visible .prism-radar-pick-title {
          color: var(--prism-accent);
        }
        .prism-radar-arrow {
          font-size: 0.78em;
          color: var(--prism-muted);
          transition: transform var(--prism-dur-fast) var(--prism-ease),
                      color var(--prism-dur-fast) var(--prism-ease);
        }
        .prism-radar-entry:hover .prism-radar-arrow,
        .prism-radar-pick:focus-visible .prism-radar-arrow {
          color: var(--prism-accent);
        }
        @media (hover: hover) {
          .prism-radar-entry:hover .prism-radar-arrow,
          .prism-radar-pick:focus-visible .prism-radar-arrow {
            transform: translate(2px, -2px);
          }
        }
        .prism-radar-type {
          padding: 0.22em 0.6em;
          border-radius: var(--prism-radius-sm);
          border: var(--prism-border-w) solid var(--prism-line);
        }
        .prism-radar-type[data-type="tool"],
        .prism-radar-type[data-type="resource"] {
          color: var(--prism-accent);
          border-color: color-mix(in srgb, var(--prism-accent) 40%, transparent);
          background: color-mix(in srgb, var(--prism-accent) 12%, transparent);
        }
        .prism-radar-type[data-type="blog"],
        .prism-radar-type[data-type="model"] {
          color: var(--prism-accent-2);
          border-color: color-mix(in srgb, var(--prism-accent-2) 40%, transparent);
          background: color-mix(in srgb, var(--prism-accent-2) 12%, transparent);
        }
        .prism-radar-type[data-type="repo"],
        .prism-radar-type[data-type="paper"] {
          color: var(--prism-accent-3);
          border-color: color-mix(in srgb, var(--prism-accent-3) 40%, transparent);
          background: color-mix(in srgb, var(--prism-accent-3) 12%, transparent);
        }
        @media (prefers-reduced-motion: reduce) {
          .prism-radar-entry,
          .prism-radar-arrow,
          .prism-radar-pick-title {
            transition: none;
          }
          .prism-radar-entry:hover,
          .prism-radar-entry:hover .prism-radar-arrow,
          .prism-radar-pick:focus-visible .prism-radar-arrow {
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
