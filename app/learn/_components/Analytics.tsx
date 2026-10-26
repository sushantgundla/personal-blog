'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

/**
 * Visitor counting, by GoatCounter (https://www.goatcounter.com).
 *
 * It sets no cookie, stores nothing in the browser and sends no personal
 * data — GoatCounter keeps a page path, the referrer, the screen width and
 * what the request headers already say (country, browser, system). That is
 * why the section needs no consent banner, and why it does not break the
 * promise that nothing about the reader is kept outside their own browser.
 *
 * Off until NEXT_PUBLIC_GOATCOUNTER_CODE is set: with no code this renders
 * nothing and `trackEvent` does nothing. See .env.example.
 *
 * count.js counts one view per full page load. Moving between lessons
 * with a <Link> is not a page load, so it is told not to count on load
 * (`no_onload`) and the views are sent from here instead, on every change
 * of path. It stays off on localhost by itself.
 */

const CODE = process.env.NEXT_PUBLIC_GOATCOUNTER_CODE

interface GoatCounterVars {
  path?: string
  title?: string
  referrer?: string
  event?: boolean
}

declare global {
  interface Window {
    goatcounter?: { count: (vars?: GoatCounterVars) => void }
  }
}

/** The path of the last view sent. Module scope, so a remount does not repeat it. */
let lastPath: string | null = null

function countView() {
  const counter = window.goatcounter
  const path = window.location.pathname
  // Script not loaded yet (onReady will call this again), or already counted.
  if (!counter || path === lastPath) return

  counter.count({
    path,
    // count.js would otherwise reuse the page's original referrer for every
    // later view and credit the search result with all of them.
    referrer: lastPath ? `${window.location.origin}${lastPath}` : undefined,
  })
  lastPath = path
}

/** A named moment, such as `finished/rag/chunking`. Shows under Events. */
export function trackEvent(name: string) {
  window.goatcounter?.count({ path: name, title: name, event: true })
}

export function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    countView()
  }, [pathname])

  if (!CODE) return null

  return (
    <Script
      src="https://gc.zgo.at/count.js"
      data-goatcounter={`https://${CODE}.goatcounter.com/count`}
      data-goatcounter-settings='{"no_onload":true}'
      strategy="afterInteractive"
      onReady={countView}
    />
  )
}
