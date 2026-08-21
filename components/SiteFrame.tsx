'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

/**
 * Chrome switch.
 *
 * The whole site now runs on the redesign in app/(main)/, which brings its own
 * nav, footer and dimension shell. So the rule has inverted: routes render bare
 * by default, and only the handful listed below still get the original
 * Header/Footer chrome.
 *
 * /old is the previous home page, kept for reference. /atlas owns its own
 * layout.
 */
const LEGACY_CHROME = /^\/old\b/

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname && !LEGACY_CHROME.test(pathname)) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <main className="pt-32 pb-20 max-w-7xl mx-auto px-8">{children}</main>
      <Footer />
    </>
  )
}
