# v2 "DIMENSION" — Build Contract

> **This file is law.** Every agent building any part of `/v2` must follow it exactly.
> If you need something not in here, invent it *inside your own files only* and prefix it `v2-`.

---

## 0. The Big Idea

`/v2` is one page whose entire visual identity can be swapped by replacing **one `<link>` tag**.

```js
document.getElementById('v2-theme-link').href = `/v2/themes/${name}.css`
```

That works only if the base stylesheet is written with total discipline:

1. **Every colour, radius, shadow, font and border in the base is a CSS variable.**
2. **Every visual element uses a class from the fixed vocabulary below.**
3. A theme file is then just: re-set the variables + ~30 lines of `!important` for the
   things variables cannot carry (radius shape, shadow style, clip-path, borders).

**RULE ZERO: `/v2` uses ZERO Tailwind classes.** No `flex`, no `mt-4`, no `text-lg`.
Tailwind utilities would win the specificity war against theme files and break everything.
All styling is hand-written CSS in `app/v2/v2.css` (base) or `public/v2/themes/*.css` (themes).
The only exception: `app/v2/layout.tsx` root div may use `className="v2-root"` — nothing else.

---

## 1. Design Tokens — the full contract

Declared in `app/v2/v2.css` under `:root`. A theme file overrides any of these.
**These names never change. Nothing else may be invented.**

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
| `--v2-faint` | tertiary text / watermarks | `rgba(245,240,234,0.30)` |
| `--v2-line` | primary border colour | `rgba(245,240,234,0.12)` |
| `--v2-line-2` | strong border / rule | `rgba(245,240,234,0.24)` |
| `--v2-accent` | primary accent | `#ff6b35` |
| `--v2-accent-2` | secondary accent | `#ffb03a` |
| `--v2-accent-3` | tertiary / rare accent | `#7c3aed` |
| `--v2-accent-soft` | accent at low alpha, for fills | `rgba(255,107,53,0.10)` |
| `--v2-on-accent` | text placed ON the accent colour | `#0a0908` |

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
| `--v2-head-transform` | `none` / `uppercase` for `.v2-eyebrow` | `uppercase` |
| `--v2-head-tracking` | `.v2-eyebrow` letter-spacing | `0.18em` |

### Motion
| Token | Meaning | Ember default |
|---|---|---|
| `--v2-ease` | standard easing | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--v2-dur` | standard duration | `0.5s` |
| `--v2-dur-fast` | micro-interactions | `0.2s` |

### Layout (never overridden by themes — structural)
| Token | Value |
|---|---|
| `--v2-max` | `1180px` |
| `--v2-gutter` | `clamp(20px, 5vw, 56px)` |
| `--v2-section-y` | `clamp(80px, 12vh, 160px)` |

---

## 2. Class Vocabulary — the ONLY classes a theme may target

Every agent building a section **must** build it out of these. If a theme file targets
`.v2-card`, it must restyle every card on the page. That is the whole trick.

### Containers
| Class | Use |
|---|---|
| `.v2-section` | a top-level `<section>`; owns vertical padding |
| `.v2-wrap` | centred max-width container (`max-width: var(--v2-max)`) |
| `.v2-band` | full-bleed alternate-background band (uses `--v2-bg-2`) |
| `.v2-card` | **the workhorse.** Any card, tile, panel, box. |
| `.v2-card-lift` | modifier on `.v2-card` — adds hover lift |
| `.v2-panel` | large bordered region (bigger than a card) |
| `.v2-grid` | generic responsive grid (theme may change gap) |

### Type
| Class | Use |
|---|---|
| `.v2-title` | display headline, uses `--v2-font-display` |
| `.v2-title-xl` | modifier — hero-scale size |
| `.v2-head` | section heading (h2 scale) |
| `.v2-sub` | sub-heading (h3 scale) |
| `.v2-eyebrow` | tiny uppercase label above a heading |
| `.v2-body` | paragraph text |
| `.v2-muted` | muted text colour utility |
| `.v2-mono` | monospace utility |
| `.v2-num` | large tabular number (stats) |

### Controls
| Class | Use |
|---|---|
| `.v2-btn` | primary button (filled with accent) |
| `.v2-btn-ghost` | secondary button (outlined) |
| `.v2-btn-quiet` | tertiary / text-only button |
| `.v2-chip` | tag / pill / skill token |
| `.v2-chip-on` | modifier — active/selected chip |
| `.v2-link` | inline text link with underline treatment |
| `.v2-icon-btn` | square icon-only button |

### Ornament
| Class | Use |
|---|---|
| `.v2-rule` | horizontal divider line |
| `.v2-dot` | small accent dot / bullet marker |
| `.v2-frame` | image frame (portrait, screenshots) |
| `.v2-marquee` | scrolling ticker strip |
| `.v2-badge` | status badge (e.g. "PRODUCTION") |
| `.v2-kbd` | keyboard key rendering |
| `.v2-orb` | decorative background blob — themes often `display:none` this |
| `.v2-noise` | grain/texture overlay — themes may swap or hide |

### Structure IDs (used by transition CSS — must exist, exactly these)
`#v2-shell` (wraps ALL page content), `#v2-hero`, `#v2-signal`, `#v2-work`,
`#v2-writing`, `#v2-contact`, `#v2-hud`.

---

## 3. Theme file rules

Path: `public/v2/themes/<slug>.css`. Target size 2–5 KB. Structure, in order:

```css
/* NAME — one-line description of the vibe */
@import url('...google font...');           /* only if the theme needs a new face */

:root {
  --v2-bg: ...;                              /* re-set the tokens you want to change */
  ...
  --v2-backdrop: grid;                       /* see §4 */
  --v2-cursor: square;                       /* see §4 */
  --v2-enter: shatter;                       /* see §5 */
}

/* Only what variables cannot express — use !important, target the vocabulary */
.v2-card { border-radius: 0 !important; border: 2px solid var(--v2-line-2) !important; }
.v2-btn  { ... }
...
```

**Hard rules for theme files:**
- Only ever target classes/IDs from §2. Never a bespoke class. Never an element selector
  except `body`, `html`.
- Never set `position`, `display:flex/grid`, `width`, `margin`, `padding` on layout
  containers — you will break the layout. Restyle **skin**, not **structure**.
  (`display:none` on `.v2-orb` / `.v2-noise` is allowed and expected.)
- Always `!important` on rules outside `:root` — theme sheets load after the base.
- Every theme must keep text readable: aim for 4.5:1 body contrast. This is not optional.
- `--v2-backdrop`, `--v2-cursor`, `--v2-enter` are **read by JS** via
  `getComputedStyle(document.documentElement).getPropertyValue('--v2-backdrop')`.
  Always declare all three.

---

## 4. Backdrop & cursor modes

`--v2-backdrop` — one of: `none` | `grid` | `dots` | `rain` | `stars` | `embed` | `scan` | `waves`
`--v2-cursor`   — one of: `default` | `ring` | `square` | `block` | `crosshair`

## 5. Transitions

`--v2-enter` — the transition played when *entering* this dimension. One of:
`tear` | `shatter` | `scanline` | `pixelate` | `iris` | `rewind` | `collapse`

---

## 6. The 22 dimensions

| slug | name | vibe |
|---|---|---|
| `ember` | Ember | **DEFAULT.** Dark warm charcoal, orange ember accent, editorial serif. |
| `terminal` | Phosphor Terminal | Black + P1 green, monospace everything, scanlines, box borders. |
| `blueprint` | Blueprint | Navy paper, cyan technical linework, grid, drafting labels. |
| `swiss` | Swiss | White, black Helvetica-scale type, one red accent, hard grid, no radius. |
| `brutalist` | Neo-Brutalism | Off-white, 3px black borders, hard offset shadows, hot yellow. |
| `cyberpunk` | Cyberpunk | Near-black, acid yellow + cyan, notched clip-paths, glow. |
| `synthwave` | Synthwave | Deep purple, magenta/cyan, horizon grid, chrome text. |
| `paper` | Letterpress | Warm cream, deep ink serif, subtle inset shadows, print feel. |
| `glass` | Glassmorphism | Blurred translucent cards over an aurora wash. |
| `neontokyo` | Neon Tokyo | Wet black, hot pink + electric blue, heavy glow, rain. |
| `matrix` | Matrix | Pure black, cascading green, mono, no radius. |
| `vaporwave` | Vaporwave | Pastel pink/cyan, chrome gradients, oversized type. |
| `nord` | Nord | Arctic blue-grey, calm, muted, soft radius. Quiet and pretty. |
| `solarized` | Solarized | The classic editor palette, warm base, six-hue accents. |
| `clay` | Claymorphism | Pastel lilac, fat radius, soft double shadows, 3D toy feel. |
| `neumorph` | Neumorphism | Monochrome, no borders, inset/outset soft shadows only. |
| `eink` | E-Ink | Pure greyscale, zero shadow, hairline rules, reading-first. |
| `oscillo` | Oscilloscope | Black, thin phosphor-cyan strokes, waveform backdrop. |
| `latent` | Latent Space | Deep indigo→violet, scattered embedding dots, soft glow. |
| `gold` | Gilded | Black + antique gold, thin serif, luxury restraint. |
| `ascii` | ASCII | Everything monospace, box-drawing borders, two colours only. |
| `bauhaus` | Bauhaus | Ecru, primary red/blue/yellow, circles and hard geometry. |

### Original dimensions (invented for this site — push these furthest)

| slug | name | vibe |
|---|---|---|
| `attention` | Attention Heads | Transformer attention map. Heatmap ramp blue→violet→amber. |
| `thermal` | Thermal | Ironbow heat imaging. No borders — edges are glow. |
| `riso` | Risograph | Two fluorescent inks overprinting on newsprint, misregistered. |
| `blackbox` | Black Box | Flight recorder. Safety orange, warning stripes, cockpit panel. |
| `monsoon` | Monsoon | Rain-washed Bengaluru. Wet slate, warm window light. |
| `descent` | Gradient Descent | Loss-landscape contours, cool→warm as loss drops. |
| `xerox` | Xerox | Fifth-generation photocopy. Dithered, punk zine. |
| `chalk` | Chalk | Dark green slate, chalk dust, lecture hall. |

**30 dimensions total.** Core tier (shown before "More realities…") is eight:
`ember`, `terminal`, `brutalist`, `cyberpunk`, `synthwave`, `glass`, `latent`, `attention`.

---

## 7. Data — import, never invent

```ts
import { siteConfig } from '@/lib/config'      // name, tagline, bio, email, social, work[], education[], skills[]
import { projects } from '@/lib/projects'      // Project[]
import { getAllArticles } from '@/lib/articles' // SERVER ONLY (uses fs)
```

`siteConfig.work[]` → `{ company, role, period, location, highlights[] }`
`projects[]` → `{ slug, title, organization, period, description, impact?, tags[], status, link? }`
Article → `{ slug, title, date, description, tags[], readingTime }`

**Client components must receive data as props from the server page.** Never call
`getAllArticles()` inside a `'use client'` file.

---

## 8. Code rules

- TypeScript strict. Next.js 14 App Router. React 18.
- `'use client'` only where you need state/effects/events.
- No new npm dependencies. None. Everything hand-rolled.
- Respect `@media (prefers-reduced-motion: reduce)` — kill transforms and glitch effects.
- Every interactive element needs a real `:focus-visible` state and an accessible name.
- Mobile down to 360px must work. Test your section mentally at that width.
