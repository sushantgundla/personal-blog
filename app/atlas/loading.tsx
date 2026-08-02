/**
 * Shared fallback for every /atlas/* route that renders a page on demand
 * instead of at build time — a dossier for one of the ~225 countries
 * outside PRERENDER_ISO3 ([iso3]/page.tsx), any compare pair
 * (compare/[pair]/page.tsx has no generateStaticParams at all), or a
 * rankings page outside its own prerendered set. Those routes call out to
 * World Bank, Wikidata and Comtrade before they can render anything, and
 * with no loading.tsx in the tree a first-time visit sat on a blank
 * screen for up to a minute with zero feedback — a click that looked
 * like it had done nothing. This is the fix: Next shows this the instant
 * navigation starts and swaps it for the real page the moment the async
 * work resolves. Once a route's `revalidate` window has it cached, this
 * never appears again for that route.
 */
export default function AtlasLoading() {
  return (
    <div
      className="atlas-fade-in flex min-h-[60vh] flex-col items-center justify-center gap-3 px-5 text-center"
      role="status"
      aria-live="polite"
    >
      <span className="atlas-label atlas-loading-pulse">Engraving the plate…</span>
      <span className="atlas-serial">First look at this one — fetching its numbers now</span>
    </div>
  )
}
