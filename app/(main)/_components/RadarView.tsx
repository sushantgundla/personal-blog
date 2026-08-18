'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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

/** An entry passes the filter when it carries at least one selected tag. Empty selection passes everything. */
function matchesTags(tags: string[], selected: Set<string>): boolean {
  if (selected.size === 0) return true
  return tags.some((tag) => selected.has(tag))
}

/** "Machine Learning" -> "machine-learning", for use as a DOM id. */
function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * A tag toggle: a visually hidden checkbox plus a `.prism-chip` label.
 *
 * Deliberately NOT a <button>. `.prism-root button` in prism.css (0,1,1) resets
 * font, background and border, and it outranks `.prism-chip` (0,1,0) — a chip
 * rendered as a button silently loses its pill in every theme. The /articles
 * filter uses the same input + label pairing for exactly this reason.
 */
function TagToggle({
  tag,
  count,
  checked,
  onToggle,
  idPrefix,
}: {
  tag: string
  count?: number
  checked: boolean
  onToggle: (tag: string) => void
  idPrefix: string
}): JSX.Element {
  const id = `${idPrefix}-${slugifyTag(tag)}`
  return (
    <>
      <input
        type="checkbox"
        id={id}
        className="prism-radar-tag-input"
        checked={checked}
        onChange={() => onToggle(tag)}
      />
      <label htmlFor={id} className={checked ? 'prism-chip prism-chip-on' : 'prism-chip'}>
        <span>{tag}</span>
        {count !== undefined && <span className="prism-radar-filter-tally">{count}</span>}
        {count === undefined && <span aria-hidden="true">×</span>}
      </label>
    </>
  )
}

function PulseEntry({ post, isLatest }: { post: RadarPost; isLatest: boolean }): JSX.Element {
  const paragraphs = post.content.trim().split(/\n\n+/)

  return (
    <div className="prism-card prism-card-lift prism-radar-entry">
      <div className="prism-row" style={{ gap: '8px', alignItems: 'center' }}>
        <span className="prism-mono prism-muted" style={{ fontSize: '0.78em' }}>
          {formatDate(post.date)}
        </span>
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
      {post.tags.length > 0 && (
        <div className="prism-row" style={{ gap: '8px', marginTop: '12px' }}>
          {post.tags.map((tag) => (
            <span key={tag} className="prism-chip">
              {tag}
            </span>
          ))}
        </div>
      )}
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
 * Above the grid sits a toolbar whose right-hand end opens a tag filter. Tags
 * are OR-ed: an entry survives if it carries any selected tag, so selecting
 * "Agents" and "Models" widens rather than narrows. Both columns share one
 * selection, because the tag vocabulary is shared and a reader thinking about
 * "Memory" wants the pulse and the pick together.
 *
 * This is a client component (state lives in `selected`) unlike the pure-CSS
 * radio filter on /articles. Multi-select needs a real "clear all", live counts
 * and an empty state, none of which a `:has()` chain gives you honestly.
 *
 * Entries are page-scoped classes (`.prism-radar-*`), styled by the
 * `<style>` block below. This keeps every visual rule (hover, focus, type colour)
 * out of inline `style={{}}`, which stays structural-only per
 * docs/architecture/design-system.md.
 */
export function RadarView({ posts, picks }: RadarViewProps): JSX.Element {
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [isOpen, setIsOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement | null>(null)

  /** Every tag across both columns, with how many entries carry it. Sorted by count, then name. */
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const tags of [...posts.map((p) => p.tags), ...picks.map((p) => p.tags)]) {
      for (const tag of tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [posts, picks])

  const visiblePosts = useMemo(
    () => posts.filter((post) => matchesTags(post.tags, selected)),
    [posts, selected]
  )
  const visiblePicks = useMemo(
    () => picks.filter((pick) => matchesTags(pick.tags, selected)),
    [picks, selected]
  )

  // Close on Escape or on a click that lands outside the filter. Both listeners
  // only exist while the panel is open, so the page carries no idle handlers.
  useEffect(() => {
    if (!isOpen) return

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') setIsOpen(false)
    }
    function onPointerDown(event: PointerEvent): void {
      const node = filterRef.current
      if (node && !node.contains(event.target as Node)) setIsOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [isOpen])

  function toggleTag(tag: string): void {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  const activeCount = selected.size
  const summary =
    activeCount === 0
      ? `${posts.length} pulses · ${picks.length} picks`
      : `${visiblePosts.length} of ${posts.length} pulses · ${visiblePicks.length} of ${picks.length} picks`

  return (
    <>
      <div className="prism-radar-scope">
        {tagCounts.length > 1 && (
          <div className="prism-radar-toolbar">
            <span className="prism-mono prism-muted prism-radar-summary">{summary}</span>

            <div className="prism-radar-filter" ref={filterRef}>
              <button
                type="button"
                className="prism-btn-ghost prism-radar-filter-btn"
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-controls="prism-radar-filter-panel"
                onClick={() => setIsOpen((open) => !open)}
              >
                <span>Filter by tag</span>
                {activeCount > 0 && (
                  <span className="prism-badge prism-radar-filter-count">{activeCount}</span>
                )}
                <span className="prism-radar-filter-caret" data-open={isOpen} aria-hidden="true">
                  ▾
                </span>
              </button>

              {isOpen && (
                <div
                  id="prism-radar-filter-panel"
                  className="prism-card prism-radar-filter-panel"
                  role="group"
                  aria-label="Filter radar entries by tag"
                >
                  <div className="prism-radar-filter-head">
                    <span className="prism-eyebrow">
                      {activeCount === 0 ? 'Showing everything' : `${activeCount} selected`}
                    </span>
                    <button
                      type="button"
                      className="prism-btn-quiet prism-radar-filter-clear"
                      onClick={() => setSelected(new Set())}
                      disabled={activeCount === 0}
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="prism-radar-filter-tags">
                    {tagCounts.map(([tag, count]) => (
                      <TagToggle
                        key={tag}
                        tag={tag}
                        count={count}
                        checked={selected.has(tag)}
                        onToggle={toggleTag}
                        idPrefix="prism-radar-tag"
                      />
                    ))}
                  </div>

                  <p className="prism-body prism-muted prism-radar-filter-hint">
                    Pick more than one to widen the net — an entry shows if it matches any
                    selected tag.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeCount > 0 && (
          <div className="prism-radar-active">
            {Array.from(selected).map((tag) => (
              <TagToggle
                key={tag}
                tag={tag}
                checked
                onToggle={toggleTag}
                idPrefix="prism-radar-active"
              />
            ))}
            <button
              type="button"
              className="prism-btn-quiet prism-radar-filter-clear"
              onClick={() => setSelected(new Set())}
            >
              Clear all
            </button>
          </div>
        )}

        <div className="prism-grid" data-cols="2" style={{ alignItems: 'start' }}>
          <div className="prism-col" style={{ gap: 0 }}>
            <div className="prism-row" style={{ justifyContent: 'space-between' }}>
              <span className="prism-eyebrow prism-mono">01 / PULSES</span>
              <span className="prism-mono prism-muted">{visiblePosts.length}</span>
            </div>
            <div className="prism-rule" style={{ marginTop: '14px' }} />
            {posts.length === 0 ? (
              <p className="prism-body prism-muted" style={{ marginTop: '20px' }}>
                No pulses yet — check back soon.
              </p>
            ) : visiblePosts.length === 0 ? (
              <p className="prism-body prism-muted" style={{ marginTop: '20px' }}>
                No pulses carry those tags. Try widening the filter.
              </p>
            ) : (
              visiblePosts.map((post, i) => (
                <Reveal key={post.slug} delay={(i % 6) * 50}>
                  <PulseEntry post={post} isLatest={post.slug === posts[0]?.slug} />
                  <div className="prism-rule" />
                </Reveal>
              ))
            )}
          </div>

          <div className="prism-col" style={{ gap: 0 }}>
            <div className="prism-row" style={{ justifyContent: 'space-between' }}>
              <span className="prism-eyebrow prism-mono">02 / PICKS</span>
              <span className="prism-mono prism-muted">{visiblePicks.length}</span>
            </div>
            <div className="prism-rule" style={{ marginTop: '14px' }} />
            {picks.length === 0 ? (
              <p className="prism-body prism-muted" style={{ marginTop: '20px' }}>
                No picks yet — check back soon.
              </p>
            ) : visiblePicks.length === 0 ? (
              <p className="prism-body prism-muted" style={{ marginTop: '20px' }}>
                No picks carry those tags. Try widening the filter.
              </p>
            ) : (
              visiblePicks.map((pick, i) => (
                <Reveal key={pick.slug} delay={(i % 6) * 50}>
                  <PickEntry pick={pick} isLatest={pick.slug === picks[0]?.slug} />
                  <div className="prism-rule" />
                </Reveal>
              ))
            )}
          </div>
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

        /* ---- Tag filter -------------------------------------------------- */
        /* The toolbar is deliberately OUTSIDE any .prism-reveal: that class
           applies filter: blur(), which would make it a containing block and
           trap the panel's positioning. */
        .prism-radar-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .prism-radar-summary {
          font-size: 0.8rem;
        }
        .prism-radar-filter {
          position: relative;
          margin-left: auto;
        }
        .prism-radar-filter-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5em;
        }
        .prism-radar-filter-count {
          font-size: 0.6rem;
          padding: 0.2em 0.5em;
        }
        .prism-radar-filter-caret {
          font-size: 0.7em;
          transition: transform var(--prism-dur-fast) var(--prism-ease);
        }
        .prism-radar-filter-caret[data-open="true"] {
          transform: rotate(180deg);
        }
        /* Anchored to the button's right edge so it opens inward from the
           right-hand end of the toolbar and never overflows the page gutter. */
        .prism-radar-filter-panel {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          z-index: 30;
          width: min(360px, calc(100vw - 48px));
          padding: 16px;
          box-shadow: var(--prism-shadow-lg);
        }
        .prism-radar-filter-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }
        .prism-radar-filter-clear {
          font-size: 0.75rem;
        }
        .prism-radar-filter-clear[disabled] {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .prism-radar-filter-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          max-height: 320px;
          overflow-y: auto;
        }
        /* The checkbox behind each chip. Kept in the layout (not display:none)
           so it stays focusable and reachable by a screen reader. */
        .prism-radar-tag-input {
          position: absolute;
          opacity: 0;
          width: 1px;
          height: 1px;
          pointer-events: none;
        }
        .prism-radar-scope label.prism-chip {
          cursor: pointer;
          font-size: 0.76rem;
          padding: 0.38em 0.8em;
        }
        .prism-radar-tag-input:focus-visible + .prism-chip {
          outline: 2px solid var(--prism-accent);
          outline-offset: 3px;
        }
        .prism-radar-filter-tally {
          color: var(--prism-faint);
          font-size: 0.9em;
        }
        .prism-radar-filter-hint {
          margin: 12px 0 0;
          font-size: 0.78rem;
        }
        .prism-radar-active {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          margin-bottom: 20px;
        }

        @media (prefers-reduced-motion: reduce) {
          .prism-radar-entry,
          .prism-radar-arrow,
          .prism-radar-pick-title,
          .prism-radar-filter-caret {
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
