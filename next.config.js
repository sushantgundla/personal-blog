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
}

module.exports = nextConfig
