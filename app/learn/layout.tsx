import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { ThemeChoice } from './_components/ThemeChoice'
import { ViewWidth } from './_components/ViewWidth'
import './learn.css'

/**
 * Standalone layout for the learning section. components/SiteFrame.tsx
 * renders every non-/old route bare, so this section owns its full
 * chrome — no site Header, no Footer.
 *
 * The chrome here is a printed header, not a nav bar: a thin rail with a
 * hairline under it, the publication's name on the left and the way back
 * out on the right. It is opaque — nothing in this section blurs or tints
 * what is behind it.
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
  // The two --ln-ground values, so the mobile browser chrome blends into
  // the page instead of banding a near-black strip above a whiteprint.
  // This one genuinely has to differ per mode and cannot be a token: a
  // <meta> colour is not CSS and cannot read var(--ln-ground).
  //
  // It follows the operating system rather than the rail's own LIGHT /
  // DARK switch, because next-themes drives the theme with a class on
  // <html> and a media attribute is the only thing a meta tag understands.
  // For the reader who has not overridden their machine — nearly all of
  // them — the two agree.
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#12100E' },
    { media: '(prefers-color-scheme: light)', color: '#F7F5F1' },
  ],
}

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="learn-root">
      <script dangerouslySetInnerHTML={{ __html: WIDTH_SCRIPT }} />

      <header className="learn-rail">
        <div className="learn-rail-inner">
          {/* The publication's name goes to the publication's front page,
              not to the main site — a masthead is a way back to the index
              you are inside, and the way out is on the right.
              `/learn` and not `/`: on learn.sushantgundla.com middleware.ts
              folds `/learn` back onto `/`, and on the main site and in dev
              `/` is the blog's home, not this section's. One href, right on
              every host. */}
          <Link href="/learn" className="sign">
            Sushant Gundla / Learn
          </Link>

          {/* The right of the rail: how wide to read, which way round to
              read it, then the way out. The two switches are twins and sit
              together; the way out stays last. */}
          <div className="learn-rail-right">
            <ViewWidth />
            <ThemeChoice />
            <a href="https://sushantgundla.com/about" className="sign-quiet">
              About Sushant ↗
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
