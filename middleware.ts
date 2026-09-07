import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  APEX_HOSTS,
  LEARN_HOST,
  LEARN_ORIGIN,
  isLearnPath,
  learnSubdomainLive,
  stripLearnPrefix,
} from '@/lib/learn-domain'

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
 *
 * The apex -> subdomain redirect below makes the subdomain the section's only
 * public address. It is inert until `NEXT_PUBLIC_LEARN_SUBDOMAIN_LIVE=1` is set
 * in the Vercel project, which must not happen before that domain and its DNS
 * are in place — turning it on early would send every visitor to a host that
 * does not resolve.
 */

export function middleware(request: NextRequest) {
  // `Host` carries the port in local dev (`learn.localhost:3000`); the name is
  // all we compare on.
  const host = request.headers.get('host')?.split(':')[0].toLowerCase()
  const { pathname, search } = request.nextUrl

  // The main site, once the subdomain is live: `/learn/...` has moved, so send
  // visitors and crawlers to its new address and keep only one URL per page.
  //
  // 308 and not 307: 307 is temporary, and a temporary redirect tells search
  // engines to keep the old URL indexed — the opposite of what this is for. 308
  // is the permanent one that, like 301, also guarantees the method and body
  // survive the redirect.
  //
  // isLearnPath() is anchored at the start of the path, so `/atlas/learn` and
  // `/atlas/learn/flags` — a different section entirely — never match.
  if (learnSubdomainLive && host && APEX_HOSTS.includes(host) && isLearnPath(pathname)) {
    return NextResponse.redirect(`${LEARN_ORIGIN}${stripLearnPrefix(pathname)}${search}`, 308)
  }

  // Any other host, localhost included, is left completely alone: `npm run dev`
  // keeps serving the section at `localhost:3000/learn` whether the switch is on
  // or off. The `/context-grid` rewrite in next.config.js still runs, because
  // this returns `NextResponse.next()` on every host but the subdomain.
  if (host !== LEARN_HOST) {
    return NextResponse.next()
  }

  // On the subdomain, `/learn/foo` is a URL a visitor can type and it would
  // otherwise be a second address for the page already at `/foo` — a duplicate
  // the rewrite below creates. Fold it back onto the short form. Not gated on
  // the switch: nothing reaches this host until the domain exists, and when it
  // does this is right in either state.
  if (isLearnPath(pathname)) {
    return NextResponse.redirect(`${LEARN_ORIGIN}${stripLearnPrefix(pathname)}${search}`, 308)
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
