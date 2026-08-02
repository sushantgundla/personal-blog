import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { ISO_COUNTRIES } from '@/lib/atlas/iso-countries'
import { AtlasSearch } from './_components/AtlasSearch'
import './atlas.css'

/**
 * Standalone layout for The Atlas. This route does not go through
 * components/SiteFrame.tsx — it owns its full chrome (no site Header,
 * no Footer). Its design tokens, fonts and effects live entirely in
 * atlas.css under .atlas-root and never leak into the rest of the site.
 */

export const metadata: Metadata = {
  title: 'The Atlas',
  description:
    'An interactive atlas of every country: geography, economy, trade, society and history, rendered as an uncut sheet of banknotes.',
}

export const viewport: Viewport = {
  themeColor: '#0F0D0B',
}

/**
 * Reusable SVG <pattern> defs referenced by atlas.css's .atlas-hatch /
 * .atlas-hatch-dense / .atlas-hatch-ink classes (url(#atlas-hatch) etc).
 * Rendered once, hidden, so every map path and note edge in the app can
 * point at the same three pattern ids instead of each component
 * reinventing its own hatch.
 */
function AtlasHatchDefs() {
  return (
    <svg aria-hidden="true" focusable="false" style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        {/* Sparse 45° engraving hatch — resting state for land. */}
        <pattern id="atlas-hatch" width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="4" stroke="var(--note-intaglio-dim)" strokeWidth="0.5" />
        </pattern>
        {/* Densified hatch — hover state, same 45° angle, tighter pitch. */}
        <pattern
          id="atlas-hatch-dense"
          width="2"
          height="2"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
        >
          <line x1="0" y1="0" x2="0" y2="2" stroke="var(--note-ember)" strokeWidth="0.6" />
        </pattern>
        {/* Per-country ink hatch — same pitch as the resting state, tinted
            with the country's derived hue via --note-ink. */}
        <pattern
          id="atlas-hatch-ink"
          width="4"
          height="4"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
        >
          <line x1="0" y1="0" x2="0" y2="4" stroke="var(--note-ink)" strokeWidth="0.5" />
        </pattern>
      </defs>
    </svg>
  )
}

export default function AtlasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="atlas-root atlas-grain min-h-screen flex flex-col">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..700&display=swap"
        rel="stylesheet"
      />

      <AtlasHatchDefs />

      <header className="atlas-top-bar flex items-center justify-between gap-4 px-5 md:px-8 py-4 border-b border-[var(--note-rule)]">
        <Link
          href="/"
          className="atlas-label !text-[10px] !tracking-[0.2em] hover:text-[var(--note-ember)] transition-colors"
        >
          ← sushantgundla.com
        </Link>

        {/* One search control, rendered directly here — every /atlas/*
            route shares this header, so this is the single place a
            visitor can jump to any country from anywhere in the Atlas.
            See AtlasSearch.tsx for why this replaced an earlier
            DOM-relocation hack that produced a duplicate search box. */}
        <div className="flex-1 max-w-sm">
          <AtlasSearch countries={ISO_COUNTRIES} />
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  )
}
