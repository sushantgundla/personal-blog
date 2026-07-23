'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

/**
 * Chrome switch. The /v4 redesign owns its full layout, so on that route we
 * render children raw and let the v4 layout provide the header, main, and
 * footer. Every other route keeps the exact current site chrome.
 */
export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname && /^\/v4\b/.test(pathname)) {
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
