'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

/**
 * Chrome switch.
 *
 * The home page and the /v4 redesign own their full layout, so on those routes
 * we render children raw and let the route layout provide the header, main and
 * footer.
 *
 * Note `pathname === '/'` is an exact match: only the home page itself is bare.
 * /old (the previous home page), /articles, /projects, /about and /radar all
 * still get the original site chrome.
 */
export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname && (pathname === '/' || /^\/v4\b/.test(pathname))) {
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
