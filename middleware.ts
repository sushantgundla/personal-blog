import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Serves the learning section on its own subdomain.
 *
 * `learn.sushantgundla.com/foo` and `sushantgundla.com/learn/foo` are the same
 * page. Requests arriving on the subdomain get `/learn` glued onto the front of
 * their path before Next picks a route, so one set of files under `app/learn/`
 * answers both addresses.
 *
 * It is a rewrite, not a redirect, on purpose: a redirect would send the
 * visitor to `sushantgundla.com/learn/...` and the subdomain would vanish from
 * the address bar. A rewrite changes only which route renders — the URL the
 * visitor sees stays on `learn.sushantgundla.com`.
 *
 * Not live until the domain exists: `learn.sushantgundla.com` still has to be
 * added to the Vercel project's Domains, and DNS pointed at Vercel with a CNAME
 * for `learn`. Until both are done nothing reaches this file on that host.
 */

const LEARN_HOST = 'learn.sushantgundla.com'

export function middleware(request: NextRequest) {
  // `Host` carries the port in local dev (`learn.localhost:3000`); the name is
  // all we compare on.
  const host = request.headers.get('host')?.split(':')[0].toLowerCase()

  if (host !== LEARN_HOST) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // Already prefixed — `learn.sushantgundla.com/learn/x` is a path a visitor can
  // type, and prefixing again would give `/learn/learn/x`, which is a 404.
  if (pathname === '/learn' || pathname.startsWith('/learn/')) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  // `/` -> `/learn`, and `/foo` -> `/learn/foo`. Cloning keeps the query string.
  url.pathname = pathname === '/' ? '/learn' : `/learn${pathname}`

  return NextResponse.rewrite(url)
}

export const config = {
  // Everything except API routes, Next's own build output, the favicon, and any
  // path that looks like a file (it has a dot in it) — so images, fonts and the
  // rest of the static assets are never touched. The `/context-grid` rewrite in
  // next.config.js is unaffected: on every host but the subdomain this file
  // returns `NextResponse.next()` and the config rewrite runs as before.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
