import type { Metadata } from 'next'

/**
 * One switch, one host name, shared by everything that has an opinion about
 * where the learning section lives.
 *
 * The section is written under `app/learn/`, so on the main site it answers at
 * `sushantgundla.com/learn/...`. The intention is that it has exactly one
 * public address instead: `https://learn.sushantgundla.com`. That cannot be
 * turned on until the subdomain has been added to the Vercel project and its
 * DNS CNAME resolves, and only the site owner can do that — so every part of
 * the move sits behind `NEXT_PUBLIC_LEARN_SUBDOMAIN_LIVE`.
 *
 * Off (unset, or any value other than `'1'`) is today's behaviour, unchanged.
 *
 * Deliberately kept in its own file rather than in lib/learn.ts: that module
 * reads the filesystem, and this one has to be importable from middleware and
 * from client components. `NEXT_PUBLIC_` is what makes the browser side
 * possible — the value is baked into the bundle at build time, which also
 * means flipping it in Vercel needs a redeploy (the "Redeploy" button; no code
 * change).
 */

/** The learning section's own host, without a scheme. */
export const LEARN_HOST = 'learn.sushantgundla.com'

/** The learning section's own origin. Every canonical URL starts with this. */
export const LEARN_ORIGIN = `https://${LEARN_HOST}`

/** The main site, on both the names Vercel answers. */
export const APEX_HOSTS = ['sushantgundla.com', 'www.sushantgundla.com']

/** True only when the variable is exactly `'1'`. Anything else is off. */
export const learnSubdomainLive = process.env.NEXT_PUBLIC_LEARN_SUBDOMAIN_LIVE === '1'

/**
 * `/learn` itself, or anything under it — anchored at the start, so
 * `/atlas/learn` and `/learnings` never match.
 */
export function isLearnPath(pathname: string): boolean {
  return pathname === '/learn' || pathname.startsWith('/learn/')
}

/**
 * The path a `/learn` URL has on the subdomain: `/learn` -> `/`,
 * `/learn/foo/bar` -> `/foo/bar`. Only meaningful for paths isLearnPath()
 * accepts.
 */
export function stripLearnPrefix(pathname: string): string {
  const rest = pathname.slice('/learn'.length)
  return rest === '' || rest === '/' ? '/' : rest
}

/**
 * The `alternates` slice of a `/learn` page's metadata, ready to spread.
 *
 * `path` is the page's path on the subdomain: `/` for the index,
 * `/build-with-llms` for a course, `/build-with-llms/what-a-model-is` for a
 * lesson.
 *
 * Returns an empty object when the switch is off, so spreading it leaves the
 * page's metadata exactly as it is today. It is a spread rather than a plain
 * `alternates:` value on purpose — writing `alternates: undefined` would clear
 * the value inherited from app/layout.tsx instead of leaving it alone.
 */
export function learnCanonical(path: string): Pick<Metadata, 'alternates'> {
  if (!learnSubdomainLive) return {}
  return { alternates: { canonical: `${LEARN_ORIGIN}${path}` } }
}
