import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { ViewWidth } from './_components/ViewWidth'
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
 *
 * The rail also carries the reading-width switch. Its value lives in
 * localStorage and has to be on <html> before the first paint, or every
 * reader who chose the wide column would watch it snap in from the narrow
 * one — hence the blocking script below, which is the same trick
 * next-themes uses for dark mode.
 */

/**
 * Runs before anything paints. Deliberately tiny and dependency-free: it
 * blocks the parser, so every byte is time on screen. localStorage throws
 * outright in some privacy modes, so the whole body is in a try/catch and
 * failing simply leaves the default narrow column.
 *
 * Keep the key in step with WIDTH_KEY / WIDTH_ATTR in
 * app/learn/_components/ViewWidth.tsx.
 */
const WIDTH_SCRIPT = `try{var w=localStorage.getItem('learn:width:v1');if(w==='wide')document.documentElement.setAttribute('data-ln-width','wide')}catch(e){}`

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
      <script dangerouslySetInnerHTML={{ __html: WIDTH_SCRIPT }} />

      <header className="learn-rail">
        <div className="learn-rail-inner">
          <Link href="/" className="sign">
            Sushant Gundla / Learn
          </Link>

          {/* The right of the rail: how wide to read, then the way out. */}
          <div className="learn-rail-right">
            <ViewWidth />
            <a href="https://sushantgundla.com" className="sign-quiet">
              The site ↗
            </a>
          </div>
        </div>
      </header>

      <main className="learn-main">{children}</main>

      <footer className="learn-foot">
        <p className="sign-quiet">Written by Sushant Gundla — the lessons stand alone</p>
      </footer>
    </div>
  )
}
