/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a second Next process use its own build directory, e.g.
  //   NEXT_DIST_DIR=.next-dev npm run dev
  // Without this, running `next build` while a `next dev` server is up wipes
  // the chunks out from under the running server and every request 404s.
  // Defaults to '.next', so normal `npm run dev` / `npm run build` are unchanged.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Next's default per-page static-generation timeout is 60s. Each Atlas
  // country page fires ~11 requests against APIs that throttle hard (World
  // Bank, Wikidata, Comtrade) — measured live at 204s for /atlas/isl and
  // 280s for /atlas/ind under throttling, entirely in data fetching (route
  // compilation itself is ~360ms). Without raising this, the build worker
  // gets SIGTERM'd mid-fetch and Next restarts that page's generation,
  // which just repeats the same slow, throttled requests. See
  // docs/atlas/design.md.
  staticPageGenerationTimeout: 420,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'commons.wikimedia.org',
      },
    ],
  },
  // The context-grid documentation is a separate Astro build in its own Vercel project. It is
  // served from a path here rather than its own subdomain so the docs live on the same domain
  // as everything else, and so the docs project needs no domain of its own.
  //
  // The Astro site is built with `base: '/context-grid'`, so every link and asset URL it emits
  // already carries that prefix -- which is what makes it correct here. Vercel, though, serves
  // that build at the root of its own project domain rather than under the base, so the prefix
  // is stripped on the way across. Both rules are needed: the first for the bare
  // `/context-grid`, the second for every page and asset under it.
  async rewrites() {
    const docs = 'https://context-grid-blush.vercel.app'
    return [
      { source: '/context-grid', destination: docs },
      { source: '/context-grid/:path*', destination: `${docs}/:path*` },
    ]
  },
}

module.exports = nextConfig
