# The `/v2` design system ("DIMENSION")

This covers the design system behind the live site (`app/(main)/*`, served at `/`). Its defining feature: the whole site can repaint into 30 completely different visual designs by swapping one `<link>` tag. This file documents the tokens, the class vocabulary, the theme file contract, and the engine that drives it. For where this fits in the wider repo, see [overview.md](./overview.md). For which routes use it, see [routing.md](./routing.md).

This file was formerly `app/(main)/CONTRACT.md`, an instruction set written for AI agents building the system. It has been rewritten here as reference documentation for a maintainer; every token and class name below has been checked against `app/(main)/v2.css`.

## 1. The core trick

One `<link id="v2-theme-link">` tag's `href` is swapped between 30 stylesheets:

```js
document.getElementById('v2-theme-link').href = `/v2/themes/${slug}.css`
```

That one swap is enough to repaint the entire page — colours, fonts, radii, shadows, cursor, background animation, even the transition style used for the *next* swap — because of a discipline enforced across the base stylesheet:

1. **Every colour, radius, shadow, font, and border in the base is a CSS variable** (a `--v2-*` custom property), declared under `:root` in `app/(main)/v2.css`. A theme file only ever re-sets these variables plus a small amount of `!important` skin for what variables can't carry (border style, clip-path, text-shadow).
2. **Every visual element on the page is built from a fixed class vocabulary** (`.v2-card`, `.v2-btn`, `.v2-title`, …). A theme file targets these classes — never a bespoke one — so restyling `.v2-card` once restyles every card on the page, everywhere.
3. **`/v2` uses zero Tailwind classes.** No `flex`, no `mt-4`, no `text-lg`, anywhere under `app/(main)`. Tailwind's utility classes carry higher specificity than the hand-written rules below and would win against theme files, breaking the swap. All styling under `app/(main)` is hand-written CSS in `app/(main)/v2.css` (base) or `public/v2/themes/*.css` (themes). The one exception: the root `<div className="v2-root">` in `app/(main)/layout.tsx` — nothing else may carry a Tailwind class.

If you need something the vocabulary doesn't cover, invent it inside your own component file and prefix the class `v2-` (page-scoped classes like `.v2-radar-entry` in `RadarView.tsx` are the pattern — see §6).

## 2. Design tokens

Declared under `:root` in `app/(main)/v2.css`. A theme file may override any token in the first four groups; the Layout group is structural and is never touched by a theme. Values below are Ember's (the default theme's) values, verified against `app/(main)/v2.css`.

### Colour

| Token | Meaning | Ember default |
|---|---|---|
| `--v2-bg` | page background | `#0a0908` |
| `--v2-bg-2` | alternate band background | `#100e0c` |
| `--v2-surface` | card / panel fill | `#141110` |
| `--v2-surface-2` | raised or hovered fill | `#1c1917` |
| `--v2-surface-3` | inset / track fill | `#252220` |
| `--v2-text` | primary text | `#f5f0ea` |
| `--v2-muted` | secondary text | `rgba(245,240,234,0.58)` |
| `--v2-faint` | tertiary text / watermarks | `rgba(245,240,234,0.45)` |
| `--v2-line` | primary border colour | `rgba(245,240,234,0.12)` |
| `--v2-line-2` | strong border / rule | `rgba(245,240,234,0.24)` |
| `--v2-accent` | primary accent | `#ff6b35` |
| `--v2-accent-2` | secondary accent | `#ffb03a` |
| `--v2-accent-3` | tertiary / rare accent | `#7c3aed` |
| `--v2-accent-soft` | accent at low alpha, for fills | `rgba(255,107,53,0.10)` |
| `--v2-on-accent` | text placed ON the accent colour | `#0a0908` |

`--v2-faint` was raised from `0.30` to `0.45` alpha after measurement showed it as low as 1.9:1 contrast where it landed on real text (the marquee ticker, mono labels) — nine theme files had already patched around the old value. Every theme must keep body text at 4.5:1 contrast or better; this is enforced by convention, not by tooling.

### Shape & depth

| Token | Meaning | Ember default |
|---|---|---|
| `--v2-radius` | standard radius (cards, inputs) | `14px` |
| `--v2-radius-sm` | chips, small controls | `8px` |
| `--v2-radius-lg` | large panels, hero media | `24px` |
| `--v2-radius-pill` | fully round controls | `999px` |
| `--v2-border-w` | standard border width | `1px` |
| `--v2-shadow` | resting elevation | `0 1px 2px rgba(0,0,0,0.4)` |
| `--v2-shadow-lg` | hovered / floating elevation | `0 24px 60px -20px rgba(0,0,0,0.7)` |
| `--v2-glow` | accent glow, used on hover | `0 0 0 rgba(0,0,0,0)` |

### Type

| Token | Meaning | Ember default |
|---|---|---|
| `--v2-font-display` | huge headline face | `'Fraunces', Georgia, serif` |
| `--v2-font-head` | section headings, UI labels | `'Space Grotesk', system-ui, sans-serif` |
| `--v2-font-body` | paragraphs | `'Inter', system-ui, sans-serif` |
| `--v2-font-mono` | code, numbers, HUD | `'JetBrains Mono', ui-monospace, monospace` |
| `--v2-display-weight` | weight for `.v2-title` | `800` |
| `--v2-display-tracking` | letter-spacing for `.v2-title` | `-0.04em` |
| `--v2-head-transform` | `none` / `uppercase` for `.v2-eyebrow` and `.v2-badge` | `uppercase` |
| `--v2-head-tracking` | `.v2-eyebrow` / `.v2-badge` letter-spacing | `0.18em` |

### Motion

| Token | Meaning | Ember default |
|---|---|---|
| `--v2-ease` | standard easing | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--v2-dur` | standard duration | `0.5s` |
| `--v2-dur-fast` | micro-interactions | `0.2s` |

### JS-read mode tokens

These three carry no CSS effect of their own — they are read out of `getComputedStyle` by JavaScript, so a theme file must always declare all three even though they look inert in the CSS.

| Token | Meaning | Ember default |
|---|---|---|
| `--v2-backdrop` | which canvas animation `Backdrop.tsx` runs | `dots` |
| `--v2-cursor` | which custom cursor `Cursor.tsx` renders | `ring` |
| `--v2-enter` | which transition plays on entering this theme | `tear` |

### Layout (structural — never overridden by themes)

| Token | Value | Note |
|---|---|---|
| `--v2-max` | `100%` | The page is full-bleed by design — no fixed max-width. A flat pixel cap left bare background down the sides on any display wider than the cap. |
| `--v2-gutter` | `clamp(16px, 3.5vw, 72px)` | Side padding for `.v2-wrap`. |
| `--v2-measure` | `68ch` | Max line length for long-form text only (`.v2-body`), not for layout — a paragraph running the full width of an ultrawide display is unreadable even though the page itself has no width cap. |
| `--v2-section-y` | `clamp(80px, 12vh, 160px)` | Vertical padding for `.v2-section`. |

## 3. Class vocabulary

The only classes a theme file may target. Build every section out of these — a theme that restyles `.v2-card` restyles every card on the page at once; that's the whole trick.

### Layout primitives

| Class | Use |
|---|---|
| `.v2-wrap` | centred container, `max-width: var(--v2-max)`, side gutters |
| `.v2-section` | top-level `<section>`; owns vertical rhythm padding |
| `.v2-band` | full-bleed alternate-background band (uses `--v2-bg-2`) |
| `.v2-grid` | responsive auto-fit grid; `data-cols="2\|3\|4"` hints column count |
| `.v2-row` | flex row, centred, wraps, token-driven gap |
| `.v2-col` | flex column, token-driven gap |
| `.v2-stack` | vertical rhythm via `> * + * { margin-top }` |

### Containers

| Class | Use |
|---|---|
| `.v2-card` | **the workhorse.** Any card, tile, panel, box. |
| `.v2-card-lift` | modifier on `.v2-card` — adds hover/focus lift + border/shadow change |
| `.v2-panel` | large bordered region (bigger than a card, larger radius) |

### Type

| Class | Use |
|---|---|
| `.v2-title` | display headline, `--v2-font-display`, fluid `clamp(2rem, 5vw, 3.5rem)` |
| `.v2-title-xl` | modifier on `.v2-title` — hero scale, `clamp(3rem, 11vw, 9rem)` |
| `.v2-head` | section heading (h2 scale) |
| `.v2-sub` | sub-heading (h3 scale) |
| `.v2-eyebrow` | tiny uppercase mono label above a heading |
| `.v2-body` | paragraph text, capped at `--v2-measure` |
| `.v2-muted` | muted text colour utility |
| `.v2-mono` | monospace utility |
| `.v2-num` | large tabular number (stats); brightens to accent on hover |

### Controls

| Class | Use |
|---|---|
| `.v2-btn` | primary button, filled with accent |
| `.v2-btn-ghost` | secondary button, outlined |
| `.v2-btn-quiet` | tertiary / text-only button, underline on hover |
| `.v2-chip` | tag / pill / skill token |
| `.v2-chip-on` | modifier — active/selected chip |
| `.v2-link` | inline text link, underline-wipe treatment |
| `.v2-icon-btn` | square icon-only button |

### Ornament

| Class | Use |
|---|---|
| `.v2-rule` | horizontal divider line |
| `.v2-dot` | small accent dot / bullet marker |
| `.v2-frame` | image/media frame (portrait, screenshots), zooms its `img`/`video` on hover |
| `.v2-marquee` / `.v2-marquee-track` | scrolling ticker strip; pauses on hover |
| `.v2-badge` | status badge (e.g. "PRODUCTION") |
| `.v2-kbd` | keyboard key rendering |
| `.v2-orb` | decorative background blob — themes often `display:none` this |
| `.v2-noise` | grain/texture overlay — themes may swap or hide |

### Motion

| Class | Use |
|---|---|
| `.v2-reveal` / `.v2-reveal.v2-in` | scroll-reveal base/entered states, driven by `Reveal.tsx` |

### Structural IDs

Used by `transitions.css` to target specific page regions during a theme swap. Must exist exactly as named wherever referenced: `#v2-shell` (wraps all page content, set in `app/(main)/layout.tsx`), `#v2-hero`, `#v2-signal`, `#v2-writing`, `#v2-radar`, `#v2-contact`, `#v2-hud`.

`#v2-hero`, `#v2-signal`, `#v2-writing`, `#v2-radar` and `#v2-contact` render on the home page, and all five are targeted by the "shatter" transition. `#v2-work` no longer exists: the work timeline was removed from the home page (it lives on `/about`), so `Work.tsx` was deleted and the shatter rule that pointed at it now points at `#v2-radar`, which had been missing from the choreography. Recover the old component from git history if it is ever wanted back.

## 4. Theme file rules

Path: `public/v2/themes/<slug>.css`. Target size 2–5 KB. Structure, in order:

```css
/* NAME — one-line description of the vibe */
@import url('...google font...');           /* only if the theme needs a new face */

:root {
  --v2-bg: ...;                              /* re-set the tokens you want to change */
  ...
  --v2-backdrop: grid;                       /* see §5 — always declare all three */
  --v2-cursor: square;
  --v2-enter: shatter;
}

/* Only what variables cannot express — use !important, target the vocabulary */
.v2-card { border-radius: 0 !important; border: 2px solid var(--v2-line-2) !important; }
.v2-btn  { ... }
```

Hard rules:

- Only ever target classes/IDs from §3. Never a bespoke class, never an element selector except `body`/`html`.
- Never set `position`, `display: flex/grid`, `width`, `margin`, or `padding` on layout containers — that breaks the layout. Restyle **skin**, not **structure**. (`display: none` on `.v2-orb` / `.v2-noise` is allowed and expected — most themes hide at least one.)
- Always use `!important` on rules outside `:root` — theme sheets load after the base, so without it the base wins.
- Keep body text at 4.5:1 contrast or better against the background. Not optional.
- Always declare `--v2-backdrop`, `--v2-cursor`, and `--v2-enter` — they're read by JS via `getComputedStyle`, and a missing value silently falls back to a default rather than erroring.

`public/v2/themes/terminal.css` is a good short example: it re-sets ~25 tokens, then adds text-shadow, zeroes every radius, and hides `.v2-orb`/`.v2-noise` — all in under 70 lines.

## 5. Backdrop, cursor, and transitions

**Backdrop** (`app/(main)/_components/Backdrop.tsx`) — a `<canvas>` fixed behind the page content, reading `--v2-backdrop` and repainting at ~30fps (throttled deliberately; 60fps visibly competed with scroll compositing). One of:
`none` | `grid` | `dots` | `rain` | `stars` | `embed` | `scan` | `waves`

It reads `--v2-accent`, `--v2-accent-2`, `--v2-accent-3`, `--v2-line`, and `--v2-bg` from the active theme to colour whichever mode is running, re-applies on every `data-v2-dimension` attribute change, and stops rendering entirely when the tab is hidden, the canvas scrolls out of view, or the viewport is under 640px wide.

**Cursor** (`app/(main)/_components/Cursor.tsx`) — replaces the native cursor with a custom one, reading `--v2-cursor`. One of:
`default` | `ring` | `square` | `block` | `crosshair`

Disabled outright on touch devices, under `prefers-reduced-motion`, and below a 900px viewport. `default` renders nothing (native cursor stays).

**Transitions** (`app/(main)/_lib/dimensions.ts` + `app/(main)/transitions.css`) — the ~640ms animation played on `#v2-shell` (or specific section IDs, for `shatter`) when switching themes, chosen by the *target* theme's `--v2-enter`. One of:
`tear` | `shatter` | `scanline` | `pixelate` | `iris` | `rewind` | `collapse`

Mechanically: `dimensions.ts` fetches the target theme's CSS as text, regexes out its `--v2-enter` value, adds the matching `v2-fx-<name>` class to `<body>`, waits 45% of the 640ms duration (the point every transition's keyframes hit peak distortion), swaps the `<link href>` at that instant, then removes the class once the animation completes. The stylesheet swap itself is hidden inside the visual noise of the transition. Under `prefers-reduced-motion: reduce`, this whole choreography is skipped in favour of a plain 200ms opacity crossfade.

Keyboard shortcuts (handled globally by `dimensions.ts`, ignored while focus is in an input/textarea/contenteditable): `[` and `]` step to the previous/next theme in `DIMENSIONS` order, `\` jumps to a random one.

## 6. The `<style>` hydration trap

**Never render CSS as a text child of `<style>`:**

```tsx
<style>{`  .thing { content: ''; }  `}</style>   // ← BREAKS
```

React escapes `"` to `&quot;` and `'` to `&#x27;` inside a `<style>` text child on the server, but not on the client. Any quote anywhere in the string — an attribute selector like `[data-tags*="|AI|"]`, `content: ''`, even a code comment — makes the server and client renders differ, and React discards the entire server-rendered tree with *"Text content does not match server-rendered HTML."* It's silent apart from a console warning, so it ships easily.

This has already broken `/articles` and `/about`. Always write:

```tsx
<style dangerouslySetInnerHTML={{ __html: `...` }} />
```

This isn't "dangerous" here — the CSS is a literal string you wrote, not user input. `app/(main)/_components/RadarView.tsx` and `app/(main)/_components/Nav.tsx` both use inline `<style>` blocks for page-scoped rules; check them for the pattern before adding a new one.

## 7. The specificity repair

`app/(main)/v2.css`'s reset uses `.v2-root button { ... }`, which has specificity `(0,1,1)` — one class plus one element. That outranks a single-class control selector like `.v2-btn { color: ... }`, which is only `(0,1,0)`. Left alone, any control rendered as a `<button>` (which is most of them) would inherit the page's default text colour instead of its own — turning `.v2-btn` into accent-on-accent, i.e. invisible, in any theme where `--v2-text` equals `--v2-accent`.

The fix, in `v2.css` immediately after the reset:

```css
.v2-root .v2-btn { color: var(--v2-on-accent); }
.v2-root .v2-btn-ghost,
.v2-root .v2-link,
.v2-root .v2-icon-btn { color: var(--v2-text); }
.v2-root .v2-btn-quiet,
.v2-root .v2-chip { color: var(--v2-muted); }
.v2-root .v2-chip-on { color: var(--v2-accent); }
```

`.v2-root .v2-btn` is `(0,2,0)` — enough to beat `.v2-root button`'s `(0,1,1)` while still losing to any theme rule, which always carries `!important`. If you add a new control class rendered as a native `<button>`, check whether it needs an entry here too.

## 8. The 30 dimensions

Defined in `app/(main)/_lib/dimensions.ts` (`DIMENSIONS`), which is the source of truth for slug, name, one-line blurb, and tier (`core` shows before "More realities…"; `more` is behind it). Stylesheets live at `public/v2/themes/<slug>.css`.

| slug | name | tier |
|---|---|---|
| `ember` | Ember | core — **default** |
| `terminal` | Phosphor Terminal | core |
| `blueprint` | Blueprint | more |
| `swiss` | Swiss | more |
| `brutalist` | Neo-Brutalism | core |
| `cyberpunk` | Cyberpunk | core |
| `synthwave` | Synthwave | core |
| `paper` | Letterpress | more |
| `glass` | Glassmorphism | core |
| `neontokyo` | Neon Tokyo | more |
| `matrix` | Matrix | more |
| `vaporwave` | Vaporwave | more |
| `nord` | Nord | more |
| `solarized` | Solarized | more |
| `clay` | Claymorphism | more |
| `neumorph` | Neumorphism | more |
| `eink` | E-Ink | more |
| `oscillo` | Oscilloscope | more |
| `latent` | Latent Space | core |
| `gold` | Gilded | more |
| `ascii` | ASCII | more |
| `bauhaus` | Bauhaus | more |
| `attention` | Attention Heads | core |
| `thermal` | Thermal | more |
| `riso` | Risograph | more |
| `blackbox` | Black Box | more |
| `monsoon` | Monsoon | more |
| `descent` | Gradient Descent | more |
| `xerox` | Xerox | more |
| `chalk` | Chalk | more |

That's 30 dimensions, 8 of them `core`: `ember`, `terminal`, `brutalist`, `cyberpunk`, `synthwave`, `glass`, `latent`, `attention`.

## 9. Data access

```ts
import { siteConfig } from '@/lib/config'      // name, tagline, bio, email, social, work[], education[], skills[]
import { projects } from '@/lib/projects'      // Project[]
import { getAllArticles } from '@/lib/articles' // SERVER ONLY (uses fs)
import { getAllRadarPosts, getAllRadarPicks } from '@/lib/radar' // SERVER ONLY (uses fs)
```

Client components must receive article/radar/project data as props from a server page — never call `getAllArticles()` or `getAllRadarPosts()` inside a `'use client'` file, since they read the filesystem. `siteConfig` and `projects` hold no `fs` calls and are safe to import from either.

## 10. Code rules

- TypeScript strict. Next.js 14 App Router. React 18.
- `'use client'` only where state, effects, or DOM events are actually needed.
- No new npm dependencies for anything under `app/(main)` — the whole system is hand-rolled.
- Respect `@media (prefers-reduced-motion: reduce)` — kill transforms and glitch effects.
- Every interactive element needs a real `:focus-visible` state and an accessible name.
- Mobile down to 360px must work.
