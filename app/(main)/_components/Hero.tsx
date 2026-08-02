'use client'

import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import Image from 'next/image'
import { siteConfig } from '@/lib/config'

/** Formats a Date as HH:MM in the Asia/Kolkata timezone. */
function formatIST(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

/** Tracks `prefers-reduced-motion` and updates live if the user changes it. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const handleChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  return reduced
}

export function Hero(): JSX.Element {
  const reduceMotion = usePrefersReducedMotion()

  // --- Live Bengaluru status line, ticks every second, guarded for hydration.
  const [time, setTime] = useState<string | null>(null)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const tick = () => {
      setTime(formatIST(new Date()))
      setPulse((p) => !p)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const statusText = time ? `Bengaluru · ${time} IST · available` : 'Bengaluru · --:-- IST · available'

  // --- Staggered name reveal on mount (no CSS keyframes; JS-driven transition).
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (reduceMotion) {
      setRevealed(true)
      return
    }
    const raf = requestAnimationFrame(() => setRevealed(true))
    return () => cancelAnimationFrame(raf)
  }, [reduceMotion])

  const nameWords = siteConfig.name.split(' ')
  let charCursor = 0

  // --- Magnetic primary button.
  const btnRef = useRef<HTMLAnchorElement>(null)
  const [btnOffset, setBtnOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (reduceMotion) return
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const btn = btnRef.current
      if (!btn) return
      const rect = btn.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy)
      const radius = 90
      if (dist < radius) {
        const strength = (1 - dist / radius) * 14
        const angle = Math.atan2(dy, dx)
        setBtnOffset({ x: Math.cos(angle) * strength, y: Math.sin(angle) * strength })
      } else {
        setBtnOffset({ x: 0, y: 0 })
      }
    }
    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [reduceMotion])

  // --- Portrait tilt, follows pointer while hovered, disabled on touch / reduced motion.
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  function handleFrameMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || e.pointerType === 'touch') return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: py * -8, y: px * 8 })
  }

  function handleFrameLeave() {
    setTilt({ x: 0, y: 0 })
  }

  const marqueeItems = siteConfig.skills.map((s) => s.label)

  return (
    <section id="v2-hero" className="v2-section" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="v2-orb" style={{ top: '-12%', left: '-10%' }} />
      <div className="v2-orb" style={{ bottom: '-18%', right: '-8%' }} />

      <div className="v2-wrap">
        <div
          className="v2-row"
          style={{ alignItems: 'center', gap: 'clamp(32px, 6vw, 80px)' }}
        >
          {/* --- Left: identity --- */}
          <div className="v2-col" style={{ flex: '1.3 1 520px', minWidth: '300px', gap: '1.5rem' }}>
            <div className="v2-eyebrow" suppressHydrationWarning>
              <span
                className="v2-dot"
                style={{
                  transform: pulse ? 'scale(1.6)' : 'scale(1)',
                  opacity: pulse ? 0.5 : 1,
                  transition: 'transform 1s ease-in-out, opacity 1s ease-in-out',
                }}
              />
              {statusText}
            </div>

            <h1 className="v2-title v2-title-xl" aria-label={siteConfig.name}>
              {nameWords.map((word, wi) => (
                <span key={wi} aria-hidden="true" style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                  {word.split('').map((char, ci) => {
                    const i = charCursor++
                    return (
                      <span
                        key={ci}
                        aria-hidden="true"
                        style={{
                          display: 'inline-block',
                          opacity: revealed ? 1 : 0,
                          transform: revealed ? 'translateY(0)' : 'translateY(0.6em)',
                          transition: 'opacity 0.7s var(--v2-ease), transform 0.7s var(--v2-ease)',
                          transitionDelay: `${i * 35}ms`,
                        }}
                      >
                        {char}
                      </span>
                    )
                  })}
                  {wi < nameWords.length - 1 ? ' ' : ''}
                </span>
              ))}
            </h1>

            {/* No employer or product named here. The home page is his own
                capability page; where he works belongs on /about, which still
                names PDI Technologies in full. */}
            <p className="v2-body v2-muted" style={{ maxWidth: '46ch' }}>
              Technical Lead for AI/ML — I architect the agent frameworks, RAG pipelines and LLM
              gateways behind AI products running in production.
            </p>

            <div className="v2-row" style={{ gap: '1rem' }}>
              <a
                ref={btnRef}
                href="#v2-work"
                className="v2-btn"
                style={{
                  transform: `translate(${btnOffset.x}px, ${btnOffset.y}px)`,
                  transition: 'transform 0.15s ease-out, background 0.2s var(--v2-ease), box-shadow 0.5s var(--v2-ease)',
                }}
              >
                View my work
              </a>
              <a href="#v2-contact" className="v2-btn-ghost">
                Get in touch
              </a>
            </div>
          </div>

          {/* --- Right: portrait --- */}
          <div style={{ flex: '1 1 340px', minWidth: '240px', display: 'flex', justifyContent: 'center' }}>
            <div
              className="v2-frame"
              onPointerMove={handleFrameMove}
              onPointerLeave={handleFrameLeave}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '380px',
                aspectRatio: '4 / 5',
                transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: 'transform 0.4s var(--v2-ease)',
              }}
            >
              <Image
                src="/portrait-home.jpg"
                alt={`Portrait of ${siteConfig.name}`}
                fill
                priority
                sizes="(max-width: 900px) 70vw, 380px"
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>

        <div
          className="v2-mono v2-muted"
          style={{ textAlign: 'center', marginTop: 'clamp(48px, 8vh, 96px)', fontSize: '0.8rem', letterSpacing: '0.08em' }}
        >
          scroll ↓
        </div>
      </div>

      <div className="v2-marquee" style={{ marginTop: 'clamp(32px, 6vh, 64px)' }}>
        <div className="v2-marquee-track">
          <span>
            {marqueeItems.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </span>
          <span aria-hidden="true">
            {marqueeItems.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </span>
        </div>
      </div>
    </section>
  )
}
