'use client'

import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { siteConfig } from '@/lib/config'
import { Reveal } from './Reveal'

/** Pulls the start year out of a period string like "Oct 2025 – Present". */
function startYear(period: string): string {
  const match = period.match(/\d{4}/)
  return match ? match[0] : period
}

/** Turns "Oct 2025 – Present" into a compact badge like "2025–". */
function badgeFor(period: string): string {
  const years = period.match(/\d{4}/g) ?? []
  if (years.length === 0) return period
  if (period.toLowerCase().includes('present')) return `${years[0]}–`
  if (years.length === 1) return years[0]
  return `${years[0]}–${years[years.length - 1]}`
}

interface RoleCardProps {
  company: string
  role: string
  period: string
  location: string
  highlights: string[]
  isCurrent: boolean
  defaultOpen: boolean
}

function RoleCard({ company, role, period, location, highlights, isCurrent, defaultOpen }: RoleCardProps): JSX.Element {
  const [open, setOpen] = useState(defaultOpen)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [maxHeight, setMaxHeight] = useState<string>(defaultOpen ? 'none' : '0px')
  const panelId = `v2-work-panel-${company.replace(/\s+/g, '-').toLowerCase()}`

  useEffect(() => {
    const node = panelRef.current
    if (!node) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setMaxHeight(open ? 'none' : '0px')
      return
    }

    if (open) {
      const height = node.scrollHeight
      setMaxHeight(`${height}px`)
      const timeout = window.setTimeout(() => setMaxHeight('none'), 400)
      return () => window.clearTimeout(timeout)
    }

    // Closing: snap to the measured height first, then collapse on next frame
    // so the transition has a starting point to animate from.
    const height = node.scrollHeight
    setMaxHeight(`${height}px`)
    const frame = window.requestAnimationFrame(() => setMaxHeight('0px'))
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  return (
    <div className="v2-card v2-card-lift" style={{ position: 'relative', paddingBlock: 'clamp(16px, 2.4vw, 22px)' }}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        style={{
          all: 'unset',
          display: 'block',
          width: '100%',
          cursor: 'pointer',
          boxSizing: 'border-box',
        }}
      >
        <div className="v2-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div className="v2-stack" style={{ gap: '4px' }}>
            <div className="v2-row" style={{ alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className="v2-sub">{company}</span>
              {isCurrent && <span className="v2-chip v2-chip-on">Current</span>}
            </div>
            <span className="v2-mono v2-muted" style={{ fontSize: '0.9em' }}>{role}</span>
          </div>
          <span className="v2-badge">{badgeFor(period)}</span>
        </div>

        <div className="v2-row" style={{ gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
          <span className="v2-mono v2-muted" style={{ fontSize: '0.85em' }}>{period}</span>
          <span className="v2-muted" style={{ fontSize: '0.85em' }}>{location}</span>
        </div>

        <p className="v2-body v2-muted" style={{ marginTop: '10px', marginBottom: 0 }}>
          {highlights[0]}
        </p>
      </button>

      <div
        ref={panelRef}
        id={panelId}
        style={{
          overflow: 'hidden',
          maxHeight,
          opacity: open ? 1 : 0,
          transition: 'max-height 0.4s var(--v2-ease), opacity 0.3s var(--v2-ease)',
        }}
      >
        <div className="v2-stack" style={{ gap: '8px', paddingTop: '10px', marginTop: '10px', borderTop: '1px solid var(--v2-line)' }}>
          {highlights.map((h) => (
            /* flexWrap must be 'nowrap': .v2-row wraps by default, which pushed
               the long highlight text onto its own line and left the bullet dot
               stranded alone above it. minWidth:0 lets the text shrink instead. */
            <div
              key={h}
              className="v2-row"
              style={{ gap: '10px', alignItems: 'flex-start', flexWrap: 'nowrap' }}
            >
              <span className="v2-dot" style={{ marginTop: '7px', flexShrink: 0 }} />
              <span className="v2-body" style={{ fontSize: '0.95em', minWidth: 0, flex: 1 }}>
                {h}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Work(): JSX.Element {
  const { work, education } = siteConfig
  const span = `${startYear(work[work.length - 1].period)} → present`
  const companyCount = work.length
  const location = work[0].location.split('·')[0].trim().split(',')[0]

  return (
    <section id="v2-work" className="v2-section">
      <div className="v2-wrap">
        <Reveal>
          <span className="v2-eyebrow">Career</span>
          <h2 className="v2-head">Where I&apos;ve worked</h2>
          <div className="v2-row" style={{ gap: '18px', marginTop: '14px', flexWrap: 'wrap' }}>
            <span className="v2-mono v2-muted">{span}</span>
            <span className="v2-mono v2-muted">{companyCount} companies</span>
            <span className="v2-mono v2-muted">{location}</span>
          </div>
        </Reveal>

        <div style={{ position: 'relative', marginTop: '24px' }}>
          <div
            style={{
              position: 'absolute',
              left: '5px',
              top: '8px',
              bottom: '8px',
              width: 0,
              borderLeft: '1px solid var(--v2-line)',
            }}
            aria-hidden="true"
          />
          <div className="v2-stack" style={{ gap: '16px' }}>
            {work.map((entry, i) => (
              <Reveal key={entry.company} delay={i * 80}>
                <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: '16px', alignItems: 'start' }}>
                  <div style={{ position: 'relative', height: '100%' }}>
                    <span
                      className="v2-dot"
                      style={{
                        position: 'relative',
                        top: '10px',
                        width: '11px',
                        height: '11px',
                        display: 'block',
                        ...(i === 0 ? { animation: 'v2-work-pulse 2s ease-in-out infinite' } : {}),
                      }}
                    />
                  </div>
                  <RoleCard
                    company={entry.company}
                    role={entry.role}
                    period={entry.period}
                    location={entry.location}
                    highlights={entry.highlights}
                    isCurrent={i === 0}
                    defaultOpen={i === 0}
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={100}>
          <div style={{ marginTop: '28px' }}>
            <span className="v2-eyebrow v2-muted">Education</span>
            <div className="v2-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '12px' }}>
              {education.map((edu) => (
                <div key={edu.school} className="v2-card" style={{ padding: '14px' }}>
                  <div className="v2-mono v2-muted" style={{ fontSize: '0.85em' }}>{edu.period}</div>
                  <div className="v2-body" style={{ marginTop: '6px', fontWeight: 600 }}>{edu.school}</div>
                  <div className="v2-muted" style={{ fontSize: '0.9em', marginTop: '2px' }}>{edu.degree}</div>
                  {edu.grade && (
                    <div className="v2-mono v2-muted" style={{ fontSize: '0.85em', marginTop: '6px' }}>{edu.grade}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <style>{`
        @keyframes v2-work-pulse {
          0%, 100% { box-shadow: 0 0 0 0 var(--v2-accent-soft); }
          50% { box-shadow: 0 0 0 6px var(--v2-accent-soft); }
        }
        @media (prefers-reduced-motion: reduce) {
          #v2-work .v2-dot { animation: none !important; }
        }
      `}</style>
    </section>
  )
}

export default Work
