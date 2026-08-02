'use client'

import dynamic from 'next/dynamic'
import type { TradeArcsProps } from './TradeArcs'

// TradeArcs imports the full COUNTRY_PATHS dataset (lib/atlas/geo/world-paths.ts,
// ~160KB — every country's border geometry) just to paint its faint world-outline
// backdrop behind a handful of trade-partner arcs. Importing it directly from the
// dossier page (a Server Component) meant that whole dataset rode along in every
// /atlas/[iso3] page's initial JS/RSC payload, even though the dossier's primary
// content — the facts, story, indicators — never touches map geometry at all.
//
// `ssr: false` here defers TradeArcs (and the COUNTRY_PATHS import it drags in)
// out of the initial render entirely: it mounts client-side, after the rest of
// the dossier has already painted, instead of blocking/bloating the first
// response. `next/dynamic` with `ssr: false` can only be called from a Client
// Component (Next.js throws if it's called directly in a Server Component) —
// this file's only job is to be that boundary, so the dossier page itself can
// stay a plain Server Component.
const TradeArcs = dynamic(() => import('./TradeArcs').then((m) => m.TradeArcs), {
  ssr: false,
  loading: () => (
    <section className="atlas-note" aria-label="Trade partner map" aria-busy="true">
      <div className="atlas-section-rule">— TRADE PARTNERS —</div>
      <p className="atlas-label">Loading trade partner map…</p>
    </section>
  ),
})

export function TradeArcsLazy(props: TradeArcsProps) {
  return <TradeArcs {...props} />
}
