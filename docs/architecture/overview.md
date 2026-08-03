# Architecture overview

This is the 10-minute orientation for someone new to this repo: the stack, where things live, and how a page turns into a response. For the design system that makes the redesign look like 30 different sites, see [design-system.md](./design-system.md). For a route-by-route map, see [routing.md](./routing.md).

## Stack

- **Framework**: Next.js 14, App Router, React 18.
- **Language**: TypeScript, strict mode.
- **Styling**: three separate systems, kept apart on purpose (see "Three design systems in one repo" below).
- **Content**: MDX files read from disk at build/request time via `fs` + `gray-matter`, rendered with `next-mdx-remote/rsc`, syntax-highlighted with `rehype-highlight`, slugged with `rehype-slug`.
- **Dark mode**: `next-themes`, wired up in `components/ThemeProvider.tsx`.
- **Reading time**: `reading-time` (hand-rolled in `lib/articles.ts` rather than the package, see below).
- **No database.** All content is files in `content/`, read at request time on the server.
- **No new dependencies without discussion** — the `/v2` design system in particular is built with zero extra packages, hand-rolled CSS and vanilla DOM APIs only (see `docs/architecture/design-system.md` Code rules).

## Directory layout

```
app/                    Next.js App Router routes
  layout.tsx            Root layout — <html>, fonts, JSON-LD, ThemeProvider, SiteFrame
  globals.css            Tailwind base + the site-wide (non-/v2) design tokens
  (main)/                The live site. Route group — the "(main)" segment does not appear in the URL.
    layout.tsx           PrismLayout — mounts the theme engine, backdrop, cursor, nav
    page.tsx             Home page ("/")
    about/, articles/, projects/, radar/    the other top-level routes
    _components/         Client + server components private to this route group
    _lib/dimensions.ts   The theme-swap engine
    prism.css               Base stylesheet: every design token + the class vocabulary
    transitions.css      The seven "enter" animations played when a theme swaps
  old/                   The previous home page, kept at /old, noindex
  v4/                    A separate design (Tailwind-based), its own layout, own routes
  atlas/                 "The Atlas" — a standalone data-viz app, its own layout, own routes
components/             Shared components used outside app/(main): Header, Footer, SiteFrame, ArticleCard, RadarTabs, RadarPickCard, RadarPostCard, ThemeProvider
content/                All MDX/JSON content, read from disk — never imported as modules
  articles/              Blog posts (MDX)
  radar/posts/, radar/picks/   Short-form "Radar" entries (MDX)
  atlas/                 Snapshot JSON + famous-people data for the Atlas
lib/                    Server-side data access + shared config
  articles.ts            Reads content/articles — fs, server-only
  radar.ts               Reads content/radar/{posts,picks} — fs, server-only
  config.ts              siteConfig: name, tagline, bio, social links, work history, skills
  projects.ts             Static projects[] array
public/                 Static assets
  v2/themes/*.css        The 30 theme stylesheets for /v2
scripts/atlas/          Build-time scripts that generate the Atlas's geo/iso data
```

## Content vs. code

Content lives in `content/` as MDX or JSON and is never imported as a JS module — it is read from disk with Node's `fs` at request time, by the functions in `lib/`. This means:

- Adding a new article, radar post, or pick is a file add, not a code change.
- Anything that calls `fs` (`lib/articles.ts`, `lib/radar.ts`) can only run on the server. Every page under `app/(main)` that needs article or radar data is a **server component** that reads the data and passes it down as plain props — client components never call `getAllArticles()` or `getAllRadarPosts()` directly. `app/(main)/page.tsx` is the clearest example of this pattern.
- `lib/config.ts` and `lib/projects.ts` are plain in-memory data (no `fs`), so either server or client components can import them directly.

## How a page renders

Take a request for `/articles/is-rag-dead` as the walkthrough:

1. `app/layout.tsx` (root layout) always renders first: `<html>`, JSON-LD, font preconnects, `ThemeProvider` (next-themes, for the site-wide light/dark toggle — separate from the `/v2` dimension system), then `SiteFrame`.
2. `components/SiteFrame.tsx` decides whether the route gets the legacy `Header`/`Footer` chrome. Only `/old` does; every other route (including this one) renders bare, because `app/(main)/layout.tsx` brings its own nav and footer.
3. Because the URL has no `/old`, `/v4`, or `/atlas` prefix, Next.js resolves it inside the `(main)` route group: `app/(main)/layout.tsx` (`PrismLayout`) wraps the page. This mounts `Backdrop`, `DimensionEngine`, `Nav`, the `.prism-noise` overlay, `DimensionHUD`, and `Cursor` around the page content.
4. `app/(main)/articles/[slug]/page.tsx` is a server component. It calls `getArticleBySlug(slug)` from `lib/articles.ts` (a `fs` read), 404s via `notFound()` if the slug doesn't exist, and renders the MDX body through `MDXRemote` with `rehype-highlight` and `rehype-slug`.
5. Everything on the page is built from the `/v2` token + class vocabulary (`.prism-card`, `.prism-title`, etc.), so it repaints correctly no matter which of the 30 theme stylesheets is currently loaded. See `docs/architecture/design-system.md` for how that works.

## Three design systems in one repo

The repo currently carries three unrelated styling approaches, kept strictly apart:

| Route(s) | Styling | Notes |
|---|---|---|
| `app/(main)/*` (the live site, `/`) | Hand-written CSS, zero Tailwind, token-driven (`/v2` system) | See `docs/architecture/design-system.md`. This is the one that reskins with a single stylesheet swap. |
| `app/old/*` | Tailwind, via `components/SiteFrame.tsx`'s legacy chrome | The previous home page, kept for reference, noindexed. |
| `app/v4/*` | Tailwind, its own tokens in `app/v4/v4.css` | A separate, self-contained design prototype ("Bold Signal"). Not linked from primary nav. |
| `app/atlas/*` | Its own CSS (`app/atlas/atlas.css`, CSS modules per component) | A standalone data-viz app (an interactive atlas of every country), fully separate chrome, no Header/Footer. |

None of these share tokens or classes with each other. If you're editing a page, check which of the four route roots it's under before copying a pattern from a different one.

## Where to go next

- **Design tokens, class vocabulary, themes, transitions** → [design-system.md](./design-system.md)
- **Every route, what renders it, which layout it uses** → [routing.md](./routing.md)
