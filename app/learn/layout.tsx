import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import './learn.css'

/**
 * Standalone layout for the learning section. components/SiteFrame.tsx
 * renders every non-/old route bare, so this section owns its full
 * chrome — no site Header, no Footer.
 *
 * The chrome here is a platform sign, not a nav bar: a thin printed rail
 * with a hairline under it, the publication's name on the left and the way
 * back out on the right. It is opaque — nothing in this section blurs or
 * tints what is behind it.
 *
 * Unlike the rest of the site, this section defines its own palette. Every
 * colour resolves to an --ln-* token in learn.css, with a .light override,
 * so next-themes still drives both modes without --primary or the
 * --surface-* ramp reaching in. Every rule there is scoped under
 * .learn-root and never leaks out.
 */

export const metadata: Metadata = {
  // Section-wide default. The listing, a course and a lesson each set
  // their own more specific title/description; this is the fallback.
  title: 'Learn — build with AI, one lesson at a time',
  description:
    'Short, plain-English lessons on building with AI — one idea at a time, with a quiz at the end of each and somewhere to go deeper.',
}

export const viewport: Viewport = {
  // Matches --ln-ground in the dark theme, so the mobile browser chrome
  // blends into the page instead of banding against it.
  themeColor: '#12100E',
}

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="learn-root">
      <header className="learn-rail">
        <div className="learn-rail-inner">
          <Link href="/" className="sign">
            Sushant Gundla / Learn
          </Link>
          <a href="https://sushantgundla.com" className="sign-quiet">
            The site ↗
          </a>
        </div>
      </header>

      <main className="learn-main">{children}</main>

      <footer className="learn-foot">
        <p className="sign-quiet">Written by Sushant Gundla — the lessons stand alone</p>
      </footer>
    </div>
  )
}
