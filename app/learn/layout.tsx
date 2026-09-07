import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import './learn.css'

/**
 * Standalone layout for the learning section. components/SiteFrame.tsx
 * renders every non-/old route bare, so this section owns its full
 * chrome — no site Header, no Footer.
 *
 * Unlike /atlas, this section does not invent its own palette: learn.css
 * drives everything from the main site's tokens in app/globals.css, so it
 * follows the theme and looks right in both dark and light. Every rule
 * there is scoped under .learn-root and never leaks out.
 */

export const metadata: Metadata = {
  // Section-wide default. The listing, a course and a lesson each set
  // their own more specific title/description; this is the fallback.
  title: 'Learn — build with AI, one lesson at a time',
  description:
    'Short, plain-English lessons on building with AI — one idea at a time, with a quiz at the end of each and somewhere to go deeper.',
}

export const viewport: Viewport = {
  // Matches --surface in the dark theme, so the mobile browser chrome
  // blends into the page instead of banding against it.
  themeColor: '#121212',
}

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="learn-root">
      {/* Thin and quiet on purpose — this is a reading site, and the
          header should never compete with the lesson under it. */}
      <header className="learn-top-bar">
        <div className="learn-top-bar-inner">
          <Link href="/learn" className="learn-top-link">
            SUSHANT GUNDLA · LEARN
          </Link>
          <a href="https://sushantgundla.com" className="learn-top-link">
            ← the site
          </a>
        </div>
      </header>

      <main className="learn-main">{children}</main>

      <footer className="learn-footer">
        <div className="measure">
          <p>Written by Sushant Gundla. Read it in any order — the lessons stand alone.</p>
        </div>
      </footer>
    </div>
  )
}
