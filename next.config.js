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
}

module.exports = nextConfig
