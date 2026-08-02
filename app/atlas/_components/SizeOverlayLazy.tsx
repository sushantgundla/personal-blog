'use client'

import dynamic from 'next/dynamic'
import type { SizeOverlayProps } from './SizeOverlay'

// Same reasoning as TradeArcsLazy.tsx: SizeOverlay imports the full
// COUNTRY_PATHS dataset (~160KB) client-side, both for the two outlines it
// draws and for the "compare against" dropdown's 174-country name list. That
// rides along with every /atlas/[iso3] page even though only one card in the
// Extras section uses it. `ssr: false` defers it to mount after the rest of
// the dossier — see TradeArcsLazy.tsx for why the dynamic() call has to live
// in its own Client Component file rather than in DossierExtras.tsx directly.
const SizeOverlay = dynamic(() => import('./SizeOverlay').then((m) => m.SizeOverlay), {
  ssr: false,
  loading: () => (
    <div className="atlas-note" aria-busy="true">
      <span className="atlas-label">Size, side by side</span>
      <p className="atlas-label">Loading size comparison…</p>
    </div>
  ),
})

export function SizeOverlayLazy(props: SizeOverlayProps) {
  return <SizeOverlay {...props} />
}
