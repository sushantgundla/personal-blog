'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

/**
 * Chrome switch. The /v4 redesign and /atlas own their full layout, so on those
 * routes we render children raw and let the route layout provide the header,
 * main, and footer. Every other route keeps the exact current site chrome.
 */
export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname && /^\/(v4|atlas)\b/.test(pathname)) {
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
