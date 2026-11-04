import { NextResponse, type NextRequest } from 'next/server'
import { ISO_COUNTRIES } from '@/lib/atlas/iso-countries'

/**
 * Where the no-JavaScript search on /atlas submits — the `<noscript>` form in
 * app/atlas/_components/AtlasSearch.tsx sends `/atlas/search?c=IND`, and this
 * redirects to the real dossier URL, `/atlas/IND`, entirely server-side.
 *
 * It lives here rather than in app/atlas/page.tsx (which used to read
 * `searchParams.c` and redirect) because a page that reads searchParams is
 * rendered on every request: that one fallback was switching the whole
 * landing plate off its hourly `revalidate` and onto a fresh server render
 * for every visitor. As its own route the plate goes back to being cached.
 *
 * Accepts an ISO3 or ISO2 code in any case. Anything that matches nothing
 * goes back to the plate.
 */
export function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get('c')?.trim().toUpperCase()
  const match = requested
    ? ISO_COUNTRIES.find((c) => c.iso3 === requested || c.iso2 === requested)
    : undefined
  return NextResponse.redirect(new URL(match ? `/atlas/${match.iso3}` : '/atlas', request.url), 303)
}
