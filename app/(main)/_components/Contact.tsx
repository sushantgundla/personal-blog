'use client'

import { useState } from 'react'
import type { JSX } from 'react'
import { siteConfig } from '@/lib/config'
import { Reveal } from './Reveal'

const MARQUEE_ITEMS = ['Agentic AI', 'RAG', 'LLM Systems', 'MCP', 'Production Infra', 'Let’s talk']

function MarqueeContent(): JSX.Element {
  return (
    <>
      {MARQUEE_ITEMS.map((item) => (
        <span key={item}>{item}</span>
      ))}
      <span className="prism-dot" aria-hidden="true" />
    </>
  )
}

export function Contact(): JSX.Element {
  const [copied, setCopied] = useState(false)
  const role = siteConfig.work[0]?.role ?? siteConfig.title
  const location = siteConfig.work[0]?.location.split('·')[0].trim() ?? ''
  const year = new Date().getFullYear()

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(siteConfig.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard access can fail (permissions, insecure context) — the mailto link still works.
    }
  }

  return (
    <section id="prism-contact" className="prism-section">
      <div className="prism-wrap">
        <Reveal>
          <span className="prism-eyebrow">Get in touch</span>
          <h2 className="prism-title prism-title-xl" style={{ marginTop: '18px', maxWidth: '14ch' }}>
            Let&apos;s build something that ships.
          </h2>
        </Reveal>

        <Reveal delay={80}>
          <div className="prism-grid" data-cols="2" style={{ marginTop: 'clamp(32px, 5vw, 56px)' }}>
            <div className="prism-panel prism-card-lift prism-col" style={{ gap: '20px' }}>
              <div className="prism-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="prism-eyebrow">Email</span>
                <span className="prism-mono prism-muted" style={{ fontSize: '0.78em' }}>Direct</span>
              </div>
              <a
                href={`mailto:${siteConfig.email}`}
                className="prism-link"
                style={{
                  fontFamily: 'var(--prism-font-head)',
                  fontSize: 'clamp(1.35rem, 3vw, 2.1rem)',
                  fontWeight: 700,
                  wordBreak: 'break-word',
                }}
              >
                {siteConfig.email}
              </a>
              <button
                type="button"
                className="prism-btn-ghost"
                onClick={handleCopy}
                aria-label={copied ? 'Email copied to clipboard' : 'Copy email address'}
                style={{ alignSelf: 'flex-start' }}
              >
                {copied ? 'Copied ✓' : 'Copy address'}
              </button>
            </div>

            <a
              href={siteConfig.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', height: '100%', textDecoration: 'none', color: 'inherit' }}
            >
              <div className="prism-panel prism-card-lift prism-col" style={{ gap: '20px', height: '100%' }}>
                <div className="prism-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="prism-eyebrow">LinkedIn</span>
                  <span className="prism-mono prism-muted" style={{ fontSize: '0.78em' }}>↗</span>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--prism-font-head)',
                    fontSize: 'clamp(1.35rem, 3vw, 2.1rem)',
                    fontWeight: 700,
                  }}
                >
                  Connect on LinkedIn
                </span>
                <span className="prism-body prism-muted">Fastest way to reach me about roles, projects, and work.</span>
              </div>
            </a>
          </div>
        </Reveal>

        <Reveal delay={140}>
          <div className="prism-row" style={{ marginTop: '28px', gap: '24px' }}>
            <a href={siteConfig.social.github} target="_blank" rel="noopener noreferrer" className="prism-btn-quiet">
              GitHub
            </a>
            <a href={siteConfig.social.twitter} target="_blank" rel="noopener noreferrer" className="prism-btn-quiet">
              X
            </a>
          </div>
        </Reveal>
      </div>

      <div className="prism-marquee" style={{ marginTop: 'clamp(64px, 8vw, 96px)' }} aria-hidden="true">
        <div className="prism-marquee-track">
          <span>
            <MarqueeContent />
          </span>
          <span>
            <MarqueeContent />
          </span>
        </div>
      </div>

      <div className="prism-wrap">
        <Reveal delay={80}>
          <div
            className="prism-row"
            style={{
              marginTop: 'clamp(48px, 6vw, 72px)',
              paddingTop: '28px',
              borderTop: '1px solid var(--prism-line)',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            {/* Name leads, then role and location on their own lines. They used
                to run together as "role · location · © year" on one long line,
                which crowded badly and left the right side to a back-link and a
                shortcut hint the owner did not want. Year sits alone on the
                right so the two sides balance. */}
            <div className="prism-stack" style={{ gap: '6px' }}>
              <span className="prism-sub" style={{ fontWeight: 700 }}>
                {siteConfig.name}
              </span>
              <span className="prism-muted" style={{ fontSize: '0.9em' }}>
                {role}
              </span>
              <span className="prism-mono prism-muted" style={{ fontSize: '0.82em' }}>
                {location}
              </span>
            </div>

            <span className="prism-mono prism-muted" style={{ fontSize: '0.82em' }}>
              © {year}
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default Contact
