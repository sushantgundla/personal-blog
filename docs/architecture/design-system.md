# The `/v2` design system ("DIMENSION")

This covers the design system behind the live site (`app/(main)/*`, served at `/`). Its defining feature: the whole site can repaint into 36 completely different visual designs by swapping one `<link>` tag. This file documents the tokens, the class vocabulary, the theme file contract, and the engine that drives it. For where this fits in the wider repo, see [overview.md](./overview.md). For which routes use it, see [routing.md](./routing.md).

This file was formerly `app/(main)/CONTRACT.md`, an instruction set written for AI agents building the system. It has been rewritten here as reference documentation for a maintainer; every token and class name below has been checked against `app/(main)/prism.css`.

## 1. The core trick

One `<link id="prism-theme-link">` tag's `href` is swapped between 36 stylesheets:

```js
document.getElementById('prism-theme-link').href = `/prism/themes/${slug}.css`
```

That one swap is enough to repaint the entire page — colours, fonts, radii, shadows, cursor, background animation, even the transition style used for the *next* swap — because of a discipline enforced across the base stylesheet:

1. **Every colour, radius, shadow, font, and border in the base is a CSS variable** (a `--prism-*` custom property), declared under `:root` in `app/(main)/prism.css`. A theme file only ever re-sets these variables plus a small amount of `!important` skin for what variables can't carry (border style, clip-path, text-shadow).
2. **Every visual element on the page is built from a fixed class vocabulary** (`.prism-card`, `.prism-btn`, `.prism-title`, …). A theme file targets these classes — never a bespoke one — so restyling `.prism-card` once restyles every card on the page, everywhere.
3. **`/v2` uses zero Tailwind classes.** No `flex`, no `mt-4`, no `text-lg`, anywhere under `app/(main)`. Tailwind's utility classes carry higher specificity than the hand-written rules below and would win against theme files, breaking the swap. All styling under `app/(main)` is hand-written CSS in `app/(main)/prism.css` (base) or `public/prism/themes/*.css` (themes). The one exception: the root `<div className="prism-root">` in `app/(main)/layout.tsx` — nothing else may carry a Tailwind class.

If you need something the vocabulary doesn't cover, invent it inside your own component file and prefix the class `prism-` (page-scoped classes like `.prism-radar-entry` in `RadarView.tsx` are the pattern — see §6).

## 2. Design tokens

Declared under `:root` in `app/(main)/prism.css`. A theme file may override any token in the first four groups; the Layout group is structural and is never touched by a theme. Values below are Ember's (the default theme's) values, verified against `app/(main)/prism.css`.

### Colour

| Token | Meaning | Ember default |
|---|---|---|
| `--prism-bg` | page background | `#0a0908` |
| `--prism-bg-2` | alternate band background | `#100e0c` |
| `--prism-surface` | card / panel fill | `#141110` |
| `--prism-surface-2` | raised or hovered fill | `#1c1917` |
| `--prism-surface-3` | inset / track fill | `#252220` |
| `--prism-text` | primary text | `#f5f0ea` |
| `--prism-muted` | secondary text | `rgba(245,240,234,0.58)` |
| `--prism-faint` | tertiary text / watermarks | `rgba(245,240,234,0.45)` |
| `--prism-line` | primary border colour | `rgba(245,240,234,0.12)` |
| `--prism-line-2` | strong border / rule | `rgba(245,240,234,0.24)` |
| `--prism-accent` | primary accent | `#ff6b35` |
| `--prism-accent-2` | secondary accent | `#ffb03a` |
| `--prism-accent-3` | tertiary / rare accent | `#7c3aed` |
| `--prism-accent-soft` | accent at low alpha, for fills | `rgba(255,107,53,0.10)` |
| `--prism-on-accent` | text placed ON the accent colour | `#0a0908` |

`--prism-faint` was raised from `0.30` to `0.45` alpha after measurement showed it as low as 1.9:1 contrast where it landed on real text (the marquee ticker, mono labels) — nine theme files had already patched around the old value. Every theme must keep body text at 4.5:1 contrast or better; this is enforced by convention, not by tooling.

### Shape & depth

| Token | Meaning | Ember default |
|---|---|---|
| `--prism-radius` | standard radius (cards, inputs) | `14px` |
| `--prism-radius-sm` | chips, small controls | `8px` |
| `--prism-radius-lg` | large panels, hero media | `24px` |
| `--prism-radius-pill` | fully round controls | `999px` |
| `--prism-border-w` | standard border width | `1px` |
| `--prism-shadow` | resting elevation | `0 1px 2px rgba(0,0,0,0.4)` |
| `--prism-shadow-lg` | hovered / floating elevation | `0 24px 60px -20px rgba(0,0,0,0.7)` |
| `--prism-glow` | accent glow, used on hover | `0 0 0 rgba(0,0,0,0)` |

### Type

| Token | Meaning | Ember default |
|---|---|---|
| `--prism-font-display` | huge headline face | `'Fraunces', Georgia, serif` |
| `--prism-font-head` | section headings, UI labels | `'Space Grotesk', system-ui, sans-serif` |
| `--prism-font-body` | paragraphs | `'Inter', system-ui, sans-serif` |
| `--prism-font-mono` | code, numbers, HUD | `'JetBrains Mono', ui-monospace, monospace` |
| `--prism-display-weight` | weight for `.prism-title` | `800` |
| `--prism-display-tracking` | letter-spacing for `.prism-title` | `-0.04em` |
| `--prism-head-transform` | `none` / `uppercase` for `.prism-eyebrow` and `.prism-badge` | `uppercase` |
| `--prism-head-tracking` | `.prism-eyebrow` / `.prism-badge` letter-spacing | `0.18em` |

### Motion

| Token | Meaning | Ember default |
|---|---|---|
| `--prism-ease` | standard easing | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--prism-dur` | standard duration | `0.5s` |
| `--prism-dur-fast` | micro-interactions | `0.2s` |

### Motion identity

The entrance is part of the design language, not a global default. Before these existed all
thirty dimensions rose 24px on the same curve, so a hard-edged press aesthetic and a soft
glass one arrived on screen identically. Each theme now authors **one** gesture — travel, or
scale, or blur — chosen to match its material.

| Token | Meaning | Base default |
|---|---|---|
| `--prism-reveal-y` | vertical travel; negative enters from above | `24px` |
| `--prism-reveal-x` | lateral travel | `0px` |
| `--prism-reveal-scale` | start scale | `1` |
| `--prism-reveal-blur` | start blur | `0px` |
| `--prism-reveal-dur` | entrance duration | `0.8s` |
| `--prism-reveal-ease` | entrance easing | `var(--prism-ease)` |
| `--prism-lift` / `--prism-lift-x` | card hover travel; **positive presses in** | `-6px` / `0px` |
| `--prism-lift-sm` / `--prism-lift-sm-x` | control hover travel | `-2px` / `0px` |
| `--prism-marquee-dur` | one full pass of the skills ticker; higher is slower | `58s` |

Range in use: `0.16s` (Terminal, a hard redraw) to `1.4s` (Sonar, a return surfacing).
Matrix is the only dimension with a negative `--prism-reveal-y`. Brutalist and Xerox are the
only ones with a positive `--prism-lift` — they press into their own hard shadow.

`.prism-reveal` applies `filter: blur()`, which establishes a containing block for
`position: fixed` descendants. That is safe only because every fixed element on the page
(Backdrop, Nav, `.prism-noise`, the HUD, Cursor) renders **outside** `#prism-shell`, so no
revealed element can contain one. Keep it that way.

### Material

Page grain and card fill used to be reachable only by overriding `.prism-noise` and
`.prism-orb` with `!important`, which 27 of 30 theme files did. Those overrides have all been
retired in favour of tokens. **Do not re-add them** — an `!important` rule in a theme file
beats the variable the base reads, and the token silently stops working.

| Token | Meaning | Base default |
|---|---|---|
| `--prism-texture` | page grain image | fractal-noise SVG |
| `--prism-texture-size` | grain tile size | `auto` |
| `--prism-texture-opacity` | grain strength | `0.045` |
| `--prism-texture-blend` | grain blend mode | `overlay` |
| `--prism-surface-texture` | card/panel fill image | `none` |
| `--prism-surface-texture-size` | fill tile size | `auto` |
| `--prism-surface-texture-blend` | fill blend mode | `normal` |
| `--prism-orb-opacity` | orb strength (`0` replaces `display: none`) | `0.28` |
| `--prism-orb-blur` | orb blur radius | `80px` |
| `--prism-orb-saturate` | orb saturation | `100%` |
| `--prism-orb-blend` | orb blend mode | `normal` |

Because `--prism-surface-texture` is a background *image*, `.prism-card` and `.prism-panel`
set `background-color` and `background-image` separately. A theme that writes the
`background` shorthand on either resets the image and wipes its own texture.

### Letterform

| Token | Meaning | Base default |
|---|---|---|
| `--prism-title-transform` | `.prism-title` case | `none` |
| `--prism-title-leading` | `.prism-title` line-height | `0.98` |
| `--prism-title-leading-xl` | `.prism-title-xl` line-height | `0.88` |
| `--prism-title-style` | `normal` / `italic` | `normal` |
| `--prism-title-variation` | `font-variation-settings` (Fraunces ships `SOFT`, `WONK`) | `normal` |
| `--prism-title-shadow` | display text-shadow | `none` |
| `--prism-title-stroke` / `--prism-title-stroke-color` | outline display type | `0` / `transparent` |
| `--prism-body-leading` | `.prism-body` line-height | `1.65` |

### Edge

| Token | Meaning | Base default |
|---|---|---|
| `--prism-border-style` | border style on every container at once | `solid` |
| `--prism-card-clip` | `clip-path` on cards and panels | `none` |
| `--prism-btn-clip` | `clip-path` on buttons | `none` |

### JS-read mode tokens

These three carry no CSS effect of their own — they are read out of `getComputedStyle` by JavaScript, so a theme file must always declare all three even though they look inert in the CSS.

| Token | Meaning | Ember default |
|---|---|---|
| `--prism-backdrop` | which canvas animation `Backdrop.tsx` runs | `dots` |
| `--prism-cursor` | which custom cursor `Cursor.tsx` renders | `ring` |
| `--prism-enter` | which transition plays on entering this theme | `tear` |

### Layout (structural — never overridden by themes)

| Token | Value | Note |
|---|---|---|
| `--prism-max` | `100%` | The page is full-bleed by design — no fixed max-width. A flat pixel cap left bare background down the sides on any display wider than the cap. |
| `--prism-gutter` | `clamp(16px, 3.5vw, 72px)` | Side padding for `.prism-wrap`. |
| `--prism-measure` | `68ch` | Max line length for long-form text only (`.prism-body`), not for layout — a paragraph running the full width of an ultrawide display is unreadable even though the page itself has no width cap. |
| `--prism-section-y` | `calc(clamp(80px, 12vh, 160px) * var(--prism-density))` | Vertical padding for `.prism-section`. |
| `--prism-density` | `1` | **The one layout token a theme may set.** Multiplies the section rhythm. Broadsheet runs `0.6` (newsprint is dense), Sonar `1.2`. Keep inside roughly `0.6`–`1.3`. |

## 3. Class vocabulary

The only classes a theme file may target. Build every section out of these — a theme that restyles `.prism-card` restyles every card on the page at once; that's the whole trick.

### Layout primitives

| Class | Use |
|---|---|
| `.prism-wrap` | centred container, `max-width: var(--prism-max)`, side gutters |
| `.prism-section` | top-level `<section>`; owns vertical rhythm padding |
| `.prism-band` | full-bleed alternate-background band (uses `--prism-bg-2`) |
| `.prism-grid` | responsive auto-fit grid; `data-cols="2\|3\|4"` hints column count |
| `.prism-row` | flex row, centred, wraps, token-driven gap |
| `.prism-col` | flex column, token-driven gap |
| `.prism-stack` | vertical rhythm via `> * + * { margin-top }` |

### Containers

| Class | Use |
|---|---|
| `.prism-card` | **the workhorse.** Any card, tile, panel, box. |
| `.prism-card-lift` | modifier on `.prism-card` — adds hover/focus lift + border/shadow change |
| `.prism-panel` | large bordered region (bigger than a card, larger radius) |

### Type

| Class | Use |
|---|---|
| `.prism-title` | display headline, `--prism-font-display`, fluid `clamp(2rem, 5vw, 3.5rem)` |
| `.prism-title-xl` | modifier on `.prism-title` — hero scale, `clamp(3rem, 11vw, 9rem)` |
| `.prism-head` | section heading (h2 scale) |
| `.prism-sub` | sub-heading (h3 scale) |
| `.prism-eyebrow` | tiny uppercase mono label above a heading |
| `.prism-body` | paragraph text, capped at `--prism-measure` |
| `.prism-muted` | muted text colour utility |
| `.prism-mono` | monospace utility |
| `.prism-num` | large tabular number (stats); brightens to accent on hover |

### Controls

| Class | Use |
|---|---|
| `.prism-btn` | primary button, filled with accent |
| `.prism-btn-ghost` | secondary button, outlined |
| `.prism-btn-quiet` | tertiary / text-only button, underline on hover |
| `.prism-chip` | tag / pill / skill token |
| `.prism-chip-on` | modifier — active/selected chip |
| `.prism-link` | inline text link, underline-wipe treatment |
| `.prism-icon-btn` | square icon-only button |

### Ornament

| Class | Use |
|---|---|
| `.prism-rule` | horizontal divider line |
| `.prism-dot` | small accent dot / bullet marker |
| `.prism-frame` | image/media frame (portrait, screenshots), zooms its `img`/`video` on hover |
| `.prism-marquee` / `.prism-marquee-track` | scrolling ticker strip; pauses on hover |
| `.prism-badge` | status badge (e.g. "PRODUCTION") |
| `.prism-kbd` | keyboard key rendering |
| `.prism-orb` | decorative background blob — themes often `display:none` this |
| `.prism-noise` | grain/texture overlay — themes may swap or hide |

### Motion

| Class | Use |
|---|---|
| `.prism-reveal` / `.prism-reveal.prism-in` | scroll-reveal base/entered states, driven by `Reveal.tsx` |

### Structural IDs

Used by `transitions.css` to target specific page regions during a theme swap. Must exist exactly as named wherever referenced: `#prism-shell` (wraps all page content, set in `app/(main)/layout.tsx`), `#prism-hero`, `#prism-signal`, `#prism-writing`, `#prism-radar`, `#prism-contact`, `#prism-hud`.

`#prism-hero`, `#prism-signal`, `#prism-writing`, `#prism-radar` and `#prism-contact` render on the home page, and all five are targeted by the "shatter" transition. `#prism-work` no longer exists: the work timeline was removed from the home page (it lives on `/about`), so `Work.tsx` was deleted and the shatter rule that pointed at it now points at `#prism-radar`, which had been missing from the choreography. Recover the old component from git history if it is ever wanted back.

## 4. Theme file rules

Path: `public/prism/themes/<slug>.css`. Target size 2–5 KB. Structure, in order:

```css
/* NAME — one-line description of the vibe */
@import url('...google font...');           /* only if the theme needs a new face */

:root {
  --prism-bg: ...;                              /* re-set the tokens you want to change */
  ...
  --prism-backdrop: grid;                       /* see §5 — always declare all three */
  --prism-cursor: square;
  --prism-enter: shatter;
}

/* Only what variables cannot express — use !important, target the vocabulary */
.prism-card { border-radius: 0 !important; border: 2px solid var(--prism-line-2) !important; }
.prism-btn  { ... }
```

Hard rules:

- Only ever target classes/IDs from §3. Never a bespoke class, never an element selector except `body`/`html`.
- Never set `position`, `display: flex/grid`, `width`, `margin`, or `padding` on layout containers — that breaks the layout. Restyle **skin**, not **structure**. (`display: none` on `.prism-orb` / `.prism-noise` is allowed and expected — most themes hide at least one.)
- Always use `!important` on rules outside `:root` — theme sheets load after the base, so without it the base wins.
- Keep body text at 4.5:1 contrast or better against the background. Not optional.
- Always declare `--prism-backdrop`, `--prism-cursor`, and `--prism-enter` — they're read by JS via `getComputedStyle`, and a missing value silently falls back to a default rather than erroring.

`public/prism/themes/terminal.css` is a good short example: it re-sets ~25 tokens, then adds text-shadow, zeroes every radius, and hides `.prism-orb`/`.prism-noise` — all in under 70 lines.

## 5. Backdrop, cursor, and transitions

**Backdrop** (`app/(main)/_components/Backdrop.tsx`) — a `<canvas>` fixed behind the page content, reading `--prism-backdrop` and repainting at ~30fps (throttled deliberately; 60fps visibly competed with scroll compositing). One of:
`none` | `grid` | `dots` | `rain` | `stars` | `embed` | `scan` | `waves` | `sonar` | `flow` | `halftone` | `sun` | `weave`

The five added modes: `sonar` sweeps a bearing over range rings and lights fixed contacts;
`flow` drifts soft additive masses; `halftone` rides a print lattice's dot gain on a slow
wave; `sun` casts leaning light shafts with dust rising through them; `weave` draws a kolam
progressively, holds, and starts again. `sun` blends the accent most of the way to white
before painting — light has to be lighter than the page it falls on, and the raw accent at
low alpha on a cream ground reads as a smudge.

It reads `--prism-accent`, `--prism-accent-2`, `--prism-accent-3`, `--prism-line`, and `--prism-bg` from the active theme to colour whichever mode is running, re-applies on every `data-prism-dimension` attribute change, and stops rendering entirely when the tab is hidden, the canvas scrolls out of view, or the viewport is under 640px wide.

**Cursor** (`app/(main)/_components/Cursor.tsx`) — replaces the native cursor with a custom one, reading `--prism-cursor`. One of:
`default` | `ring` | `square` | `block` | `crosshair`

Disabled outright on touch devices, under `prefers-reduced-motion`, and below a 900px viewport. `default` renders nothing (native cursor stays).

**Transitions** (`app/(main)/_lib/dimensions.ts` + `app/(main)/transitions.css`) — the ~640ms animation played on `#prism-shell` (or specific section IDs, for `shatter`) when switching themes, chosen by the *target* theme's `--prism-enter`. One of:
`tear` | `shatter` | `scanline` | `pixelate` | `iris` | `rewind` | `collapse`

Mechanically: `dimensions.ts` fetches the target theme's CSS as text, regexes out its `--prism-enter` value, adds the matching `prism-fx-<name>` class to `<body>`, waits 45% of the 640ms duration (the point every transition's keyframes hit peak distortion), swaps the `<link href>` at that instant, then removes the class once the animation completes. The stylesheet swap itself is hidden inside the visual noise of the transition. Under `prefers-reduced-motion: reduce`, this whole choreography is skipped in favour of a plain 200ms opacity crossfade.

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

`app/(main)/prism.css`'s reset uses `.prism-root button { ... }`, which has specificity `(0,1,1)` — one class plus one element. That outranks a single-class control selector like `.prism-btn { color: ... }`, which is only `(0,1,0)`. Left alone, any control rendered as a `<button>` (which is most of them) would inherit the page's default text colour instead of its own — turning `.prism-btn` into accent-on-accent, i.e. invisible, in any theme where `--prism-text` equals `--prism-accent`.

The fix, in `prism.css` immediately after the reset:

```css
.prism-root .prism-btn { color: var(--prism-on-accent); }
.prism-root .prism-btn-ghost,
.prism-root .prism-link,
.prism-root .prism-icon-btn { color: var(--prism-text); }
.prism-root .prism-btn-quiet,
.prism-root .prism-chip { color: var(--prism-muted); }
.prism-root .prism-chip-on { color: var(--prism-accent); }
```

`.prism-root .prism-btn` is `(0,2,0)` — enough to beat `.prism-root button`'s `(0,1,1)` while still losing to any theme rule, which always carries `!important`. If you add a new control class rendered as a native `<button>`, check whether it needs an entry here too.

## 8. The 36 dimensions

Defined in `app/(main)/_lib/dimensions.ts` (`DIMENSIONS`), which is the source of truth for slug, name, one-line blurb, and tier (`core` shows before "More realities…"; `more` is behind it). Stylesheets live at `public/prism/themes/<slug>.css`.

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
| `daylight` | Daylight | core |
| `ferro` | Ferrofluid | core |
| `kolam` | Kolam | core |
| `broadsheet` | Broadsheet | more |
| `sonar` | Sonar | more |
| `marginalia` | Marginalia | more |

That's 36 dimensions, 11 of them `core`: `ember`, `terminal`, `brutalist`, `cyberpunk`, `synthwave`, `glass`, `latent`, `attention`, `daylight`, `ferro`, `kolam`.

The six most recent fill gaps the original thirty left open. `daylight` is the only one with
a light *source* rather than flat stock. `ferro` is the only organic material. `broadsheet`
is the only dense one. `sonar` is slow where the other dark instrument dimensions are fast.
`marginalia` routes `--prism-font-mono` to a handwriting face, so every small label becomes a
margin note. `kolam` is a craft with rules rather than a mood, and its `weave` backdrop is the
only one that draws something rather than just moving.

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
