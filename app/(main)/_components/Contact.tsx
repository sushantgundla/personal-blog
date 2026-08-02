'use client'

import { useState } from 'react'
import type { JSX } from 'react'
import Link from 'next/link'
import { siteConfig } from '@/lib/config'
import { Reveal } from './Reveal'

const MARQUEE_ITEMS = ['Agentic AI', 'RAG', 'LLM Systems', 'MCP', 'Production Infra', 'Let’s talk']

function MarqueeContent(): JSX.Element {
  return (
    <>
      {MARQUEE_ITEMS.map((item) => (
        <span key={item}>{item}</span>
      ))}
      <span className="v2-dot" aria-hidden="true" />
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
    <section id="v2-contact" className="v2-section">
      <div className="v2-wrap">
        <Reveal>
          <span className="v2-eyebrow">Get in touch</span>
          <h2 className="v2-title v2-title-xl" style={{ marginTop: '18px', maxWidth: '14ch' }}>
            Let&apos;s build something that ships.
          </h2>
        </Reveal>

        <Reveal delay={80}>
          <div className="v2-grid" data-cols="2" style={{ marginTop: 'clamp(32px, 5vw, 56px)' }}>
            <div className="v2-panel v2-card-lift v2-col" style={{ gap: '20px' }}>
              <div className="v2-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="v2-eyebrow">Email</span>
                <span className="v2-mono v2-muted" style={{ fontSize: '0.78em' }}>Direct</span>
              </div>
              <a
                href={`mailto:${siteConfig.email}`}
                className="v2-link"
                style={{
                  fontFamily: 'var(--v2-font-head)',
                  fontSize: 'clamp(1.35rem, 3vw, 2.1rem)',
                  fontWeight: 700,
                  wordBreak: 'break-word',
                }}
              >
                {siteConfig.email}
              </a>
              <button
                type="button"
                className="v2-btn-ghost"
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
              <div className="v2-panel v2-card-lift v2-col" style={{ gap: '20px', height: '100%' }}>
                <div className="v2-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="v2-eyebrow">LinkedIn</span>
                  <span className="v2-mono v2-muted" style={{ fontSize: '0.78em' }}>↗</span>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--v2-font-head)',
                    fontSize: 'clamp(1.35rem, 3vw, 2.1rem)',
                    fontWeight: 700,
                  }}
                >
                  Connect on LinkedIn
                </span>
                <span className="v2-body v2-muted">Fastest way to reach me about roles, projects, and work.</span>
              </div>
            </a>
          </div>
        </Reveal>

        <Reveal delay={140}>
          <div className="v2-row" style={{ marginTop: '28px', gap: '24px' }}>
            <a href={siteConfig.social.github} target="_blank" rel="noopener noreferrer" className="v2-btn-quiet">
              GitHub
            </a>
            <a href={siteConfig.social.twitter} target="_blank" rel="noopener noreferrer" className="v2-btn-quiet">
              X
            </a>
          </div>
        </Reveal>
      </div>

      <div className="v2-marquee" style={{ marginTop: 'clamp(64px, 8vw, 96px)' }} aria-hidden="true">
        <div className="v2-marquee-track">
          <span>
            <MarqueeContent />
          </span>
          <span>
            <MarqueeContent />
          </span>
        </div>
      </div>

      <div className="v2-wrap">
        <Reveal delay={80}>
          <div
            className="v2-row"
            style={{
              marginTop: 'clamp(48px, 6vw, 72px)',
              paddingTop: '28px',
              borderTop: '1px solid var(--v2-line)',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div className="v2-stack" style={{ gap: '4px' }}>
              <span className="v2-body" style={{ fontWeight: 600 }}>
                {siteConfig.name}
              </span>
              <span className="v2-muted" style={{ fontSize: '0.9em' }}>
                {role} · {location} · © {year}
              </span>
            </div>

            <div className="v2-stack" style={{ gap: '4px', textAlign: 'right' }}>
              {/* This page is now the site home, so the old home lives at /old. */}
              <Link href="/old" className="v2-link" style={{ fontSize: '0.95em' }}>
                ← previous site
              </Link>
              <span className="v2-muted" style={{ fontSize: '0.85em' }}>
                Try another dimension — press <span className="v2-kbd">⌘</span>{' '}
                <span className="v2-kbd">K</span>
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default Contact
