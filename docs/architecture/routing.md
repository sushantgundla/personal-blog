# Routing

Every route in the app, what renders it, and which layout wraps it. For the design system used by the live site, see [design-system.md](./design-system.md). For the wider directory layout, see [overview.md](./overview.md).

## The chrome switch: `components/SiteFrame.tsx`

Every route passes through the root layout (`app/layout.tsx`), which renders `SiteFrame`. `SiteFrame` decides whether a route gets the legacy `Header`/`Footer` chrome (Tailwind-based, defined in `components/Header.tsx` and `components/Footer.tsx`):

```ts
const LEGACY_CHROME = /^\/old\b/
```

Only paths matching `/old` (and anything under it) get `Header`/`Footer`. Every other route — including `/` and `/atlas/*` — renders bare from `SiteFrame`'s point of view and supplies its own chrome inside its own route-group layout. This is inverted from how it used to work: the redesign in `app/(main)/` is now the default, so the legacy chrome is the exception, kept alive only for `/old`.

## `/` — the live site (`app/(main)`)

`(main)` is a Next.js **route group**: the parenthesized segment doesn't appear in the URL, so `app/(main)/page.tsx` serves `/`, `app/(main)/about/page.tsx` serves `/about`, and so on.

Layout: `app/(main)/layout.tsx` (`PrismLayout`). Mounts, in order: `Backdrop` (theme-reactive canvas), `DimensionEngine` (the theme-swap engine + SVG filter defs), `Nav` (fixed top bar), `#prism-shell` wrapping `{children}`, `.prism-noise` (grain overlay), `DimensionHUD` (the theme picker button, deliberately outside `#prism-shell` so it stays still during transitions), `Cursor` (custom cursor). Pulls in `app/(main)/prism.css`, the base stylesheet for the whole [design system](./design-system.md).

| Route | File | Renders |
|---|---|---|
| `/` | `app/(main)/page.tsx` | `Hero`, `Signal`, `Writing` (latest 4 articles), `RadarHome` (latest radar post + 4 picks), `Contact`. Server component — reads `getAllArticles()` and radar data via `lib/articles.ts` / `lib/radar.ts` and passes them down as props. |
| `/about` | `app/(main)/about/page.tsx` | Bio, work history, education, skills, contact — all from `siteConfig` (`lib/config.ts`). |
| `/articles` | `app/(main)/articles/page.tsx` | The article index, with tag filtering. Reads `getAllArticles()`. |
| `/articles/[slug]` | `app/(main)/articles/[slug]/page.tsx` | A single article, rendered from MDX via `MDXRemote` (`next-mdx-remote/rsc`) with `rehype-highlight` and `rehype-slug`. `generateStaticParams` pre-builds one page per file in `content/articles/`. 404s via `notFound()` for an unknown slug. Its own stylesheet: `app/(main)/articles/[slug]/prose.css`. |
| `/projects` | `app/(main)/projects/page.tsx` | Header + metadata on the server; hands the static `projects` array (`lib/projects.ts`) to `ProjectsGrid.tsx`, a client component that owns the interactive tag filter. |
| `/radar` | `app/(main)/radar/page.tsx` | `RadarView`, showing radar posts ("Pulses") and picks side by side. Reads `getAllRadarPosts()` / `getAllRadarPicks()`. |

## `/old` — the previous home page

File: `app/old/page.tsx`. Not inside `app/(main)`, so it does **not** get `PrismLayout` or any Prism styling — instead `SiteFrame` gives it the legacy `Header`/`Footer` chrome, and it's styled with Tailwind like the rest of the pre-redesign site.

Kept for reference after the redesign shipped to `/`. Marked `robots: { index: false }` with `alternates: { canonical: '/' }` — it isn't meant to rank; indexing it alongside `/` would split ranking signals between two pages with near-identical content.

## `/atlas/*` — a standalone data-viz app

Layout: `app/atlas/layout.tsx`. Also fully self-contained: no site `Header`/`Footer`, its own font (Bodoni Moda), its own top bar with just a "← sushantgundla.com" link back to `/`, its own stylesheet `app/atlas/atlas.css` plus a CSS Module per component (`app/atlas/_components/*.module.css`). An interactive atlas of every country, rendered as an uncut sheet of banknotes — geography, economy, trade, society, and history.

| Route | File |
|---|---|
| `/atlas` | `app/atlas/page.tsx` |
| `/atlas/[iso3]` | `app/atlas/[iso3]/page.tsx` — one country's "dossier"; `not-found.tsx` handles an unknown code |
| `/atlas/compare` | `app/atlas/compare/page.tsx` |
| `/atlas/compare/[countries]` | `app/atlas/compare/[countries]/page.tsx` |
| `/atlas/rankings` | `app/atlas/rankings/page.tsx` |
| `/atlas/rankings/[indicator]` | `app/atlas/rankings/[indicator]/page.tsx` |
| `/atlas/api/refresh` | `app/atlas/api/refresh/route.ts` — API route, not a page |

Data comes from `content/atlas/` (snapshot JSON, famous-people data) plus build-time scripts in `scripts/atlas/` (`npm run atlas:iso`, `npm run atlas:geo`) that generate ISO/geo lookup tables.

## Summary

| Path prefix | Layout | Chrome | Styling |
|---|---|---|---|
| `/`, `/about`, `/articles*`, `/projects`, `/radar` | `app/(main)/layout.tsx` | Own `Nav`, no `Header`/`Footer` | `/v2` design system — see [design-system.md](./design-system.md) |
| `/old` | root layout only | `Header`/`Footer` via `SiteFrame` | Tailwind |
| `/atlas/*` | `app/atlas/layout.tsx` | Own minimal top bar | `app/atlas/atlas.css` + CSS Modules |
