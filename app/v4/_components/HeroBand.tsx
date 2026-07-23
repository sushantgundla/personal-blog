'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { KineticName } from './KineticName'
import { MagneticButton } from './MagneticButton'
import { useScrollProgress } from './ScrollFx'

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

/**
 * The full-bleed rust identity band: huge kinetic name, tagline, portrait,
 * and CTAs. Parallaxes and fades (transform + opacity only) as the page
 * scrolls past it, and reverts to a static frame under reduced motion.
 */
export function HeroBand({ role, intro }: { role: string; intro: string }) {
  const { ref, progress } = useScrollProgress<HTMLElement>()
  const [portraitVisible, setPortraitVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setPortraitVisible(true), 250)
    return () => clearTimeout(t)
  }, [])

  return (
    <section ref={ref} className="v4-band relative overflow-hidden">
      <div className="v4-band-glow" aria-hidden="true" style={{ transform: `translateY(${progress * -50}px)` }} />

      <div
        className="relative mx-auto max-w-6xl px-5 md:px-8 pt-20 md:pt-24 pb-12 md:pb-16"
        style={{
          transform: `translateY(${progress * 24}px) scale(${1 - progress * 0.04})`,
          opacity: 1 - progress * 0.55,
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <p className="font-mono text-[11px] md:text-xs uppercase tracking-[0.28em] mb-6" style={{ color: 'rgba(var(--on-band-rgb), 0.75)' }}>
              {role}
            </p>

            <h1
              className="v4-display font-black leading-[0.88] text-6xl sm:text-7xl md:text-[5.6rem] lg:text-[6.3rem] tracking-tight"
              style={{ color: 'var(--on-band)' }}
            >
              <KineticName text="Sushant Gundla" />
            </h1>

            <p className="text-lg md:text-xl leading-relaxed max-w-xl mt-8" style={{ color: 'rgba(var(--on-band-rgb), 0.88)' }}>
              {intro}
            </p>

            <div className="flex flex-wrap items-center gap-5 mt-10">
              <MagneticButton>
                <Link
                  href="/v4/articles"
                  className="v4-band-cta inline-flex items-center gap-2 font-semibold text-sm px-7 py-4 rounded-full"
                  style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
                >
                  Read the writing
                  <ArrowRight />
                </Link>
              </MagneticButton>
              <MagneticButton strength={0.25}>
                <a
                  href="/resume.pdf"
                  download
                  className="v4-band-cta-ghost inline-flex items-center gap-2 font-semibold text-sm px-7 py-4 rounded-full border"
                  style={{ borderColor: 'rgba(var(--on-band-rgb), 0.4)', color: 'var(--on-band)' }}
                >
                  Résumé
                </a>
              </MagneticButton>
            </div>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="v4-portrait relative mx-auto w-64 sm:w-80 lg:w-full lg:max-w-none max-w-sm">
              <div className={`v4-portrait-frame relative aspect-[4/5] overflow-hidden ${portraitVisible ? 'is-visible' : ''}`}>
                <Image
                  src="/portrait-home.jpg"
                  alt="Sushant Gundla"
                  fill
                  sizes="(max-width: 1024px) 256px, 30vw"
                  className="v4-portrait-img object-cover object-top"
                  unoptimized
                  priority
                />
                <div className="v4-portrait-tint" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
