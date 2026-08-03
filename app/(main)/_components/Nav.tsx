'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * Fixed top bar: wordmark on the left, four section links on the right.
 *
 * Built entirely from the docs/architecture/design-system.md §3 class vocabulary (.v2-mono,
 * .v2-btn-quiet, .v2-link) so every one of the 30 theme files repaints it
 * for free. Only structural concerns — fixed positioning, flex layout,
 * gaps, z-index, the scroll-driven hide/show transform — are set inline or
 * in the scoped <style> block below; every colour, border and font comes
 * from the --v2-* tokens.
 *
 * Hides on scroll down, reappears on scroll up, and always stays visible
 * near the top of the page so it never fights the visitor for the first
 * screenful of content.
 */

const NAV_LINKS: { href: string; label: string }[] = [
  { href: '/articles', label: 'Writing' },
  { href: '/projects', label: 'Projects' },
  { href: '/radar', label: 'Radar' },
  { href: '/about', label: 'About' },
];

// A section is active for its own route and every sub-route under it, so
// /articles/some-post still lights up "Writing".
function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav() {
  const pathname = usePathname() ?? '';
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    // Respect reduced motion by never hiding the bar at all — no listener,
    // no transform, it just stays put.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    lastY.current = window.scrollY;
    const THRESHOLD = 8; // ignores the small jitters that cause flicker
    const TOP_GUARD = 80; // always visible near the very top of the page
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;

        if (y <= TOP_GUARD) {
          setHidden(false);
        } else if (delta > THRESHOLD) {
          setHidden(true);
          lastY.current = y;
        } else if (delta < -THRESHOLD) {
          setHidden(false);
          lastY.current = y;
        }
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        #v2-nav {
          position: fixed;
          top: 0;
          inset-inline: 0;
          z-index: 800;
          transform: translateY(0);
          transition: transform var(--v2-dur-fast) var(--v2-ease);
          background: color-mix(in srgb, var(--v2-bg) 78%, transparent);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: var(--v2-border-w) solid var(--v2-line);
        }
        #v2-nav.v2-nav-hidden {
          transform: translateY(-100%);
        }
        #v2-nav .v2-nav-inner {
          max-width: var(--v2-max);
          margin-inline: auto;
          padding-inline: var(--v2-gutter);
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        #v2-nav .v2-nav-mark {
          text-decoration: none;
          white-space: nowrap;
          font-size: 1.2rem;
          font-weight: 800;
          letter-spacing: 0.01em;
          color: var(--v2-text);
        }
        #v2-nav .v2-nav-mark-full {
          display: none;
        }
        #v2-nav .v2-nav-links {
          display: flex;
          align-items: center;
          gap: clamp(10px, 3vw, 28px);
          list-style: none;
          margin: 0;
          padding: 0;
        }
        #v2-nav .v2-nav-link {
          font-size: 0.88rem;
          white-space: nowrap;
        }
        #v2-nav .v2-nav-link-active {
          color: var(--v2-accent);
          border-color: var(--v2-accent);
        }
        @media (min-width: 640px) {
          #v2-nav .v2-nav-mark-short { display: none; }
          #v2-nav .v2-nav-mark-full { display: inline; }
        }
        @media (max-width: 400px) {
          #v2-nav .v2-nav-inner { height: 56px; }
          #v2-nav .v2-nav-links { gap: 8px; }
          #v2-nav .v2-nav-link { font-size: 0.76rem; padding-inline: 0.1em; }
          #v2-nav .v2-nav-mark { font-size: 1.05rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          #v2-nav { transition: none; transform: none !important; }
        }
      `}</style>
      <nav id="v2-nav" aria-label="Primary navigation" className={hidden ? 'v2-nav-hidden' : ''}>
        <div className="v2-nav-inner">
          <Link
            href="/"
            className="v2-nav-mark v2-mono"
            aria-label="Sushant Gundla — home"
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            <span className="v2-nav-mark-short">SG</span>
            <span className="v2-nav-mark-full">Sushant Gundla</span>
          </Link>

          <ul className="v2-nav-links">
            {NAV_LINKS.map(({ href, label }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`v2-btn-quiet v2-nav-link${active ? ' v2-nav-link-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </>
  );
}

export default Nav;
