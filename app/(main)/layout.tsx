import DimensionEngine from './_components/DimensionEngine'
import { DimensionHUD } from './_components/DimensionHUD'
import Backdrop from './_components/Backdrop'
import Cursor from './_components/Cursor'
import { Nav } from './_components/Nav'
import './prism.css'

// No metadata export here on purpose. This is now the live home page, so it
// inherits the real site metadata from app/layout.tsx — title, canonical,
// OpenGraph and an indexable robots rule. While this lived at /v2 it carried
// a preview title and robots:{index:false}; both would be wrong now.

/**
 * v2 "Dimension" shell.
 *
 * Layering, bottom to top:
 *   Backdrop  — z 0, the theme-reactive canvas
 *   #prism-shell — z 2, ALL page content. Transitions distort this element only.
 *   .prism-noise — z 3, grain overlay
 *   DimensionHUD — z 9000, deliberately outside #prism-shell so the switcher
 *                  stays perfectly still while the page tears itself apart.
 *   Cursor    — z 9999
 *
 * The fonts here are the union of every face the base stylesheet references.
 * Individual themes @import their own extra faces from their own CSS file.
 */
export default function PrismLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="prism-root">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
        rel="stylesheet"
      />

      <Backdrop />
      <DimensionEngine />

      {/* Nav sits outside #prism-shell so it stays put while the shell tears
          itself apart during a dimension transition — same reason the
          dimension button is outside it. */}
      <Nav />

      <div id="prism-shell">{children}</div>

      <div className="prism-noise" aria-hidden="true" />
      <DimensionHUD />
      <Cursor />
    </div>
  )
}
