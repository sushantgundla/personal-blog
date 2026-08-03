# Adding a Dimension

How to add a 31st visual theme ("dimension") to the site. Dimensions are the site's
signature feature: the whole homepage repaints from one CSS file swap, no page reload.
Full rules live in `docs/architecture/design-system.md` (the original build contract) —
this guide is the practical walkthrough. Read that doc too before you start; it is the
source of truth if this guide and the code ever disagree.

## How it works, in short

The homepage links to exactly one theme stylesheet:

```js
document.getElementById('prism-theme-link').href = `/prism/themes/${slug}.css`
```

The base stylesheet, `app/(main)/prism.css`, defines every color, radius, shadow, and font as
a CSS variable (a `--prism-*` custom property) and every visual element as a class from a
fixed vocabulary (`.prism-card`, `.prism-btn`, `.prism-chip`, …). A theme file does two things:
re-set the variables, and override the handful of things variables can't carry (radius
shape, borders, shadow style) with `!important` rules targeting that same vocabulary.
That discipline is what makes a same-page, no-reload repaint possible.

## Steps

1. **Create the theme file**: `public/prism/themes/<slug>.css`. Target 2–5 KB.
2. **Register it**: add an entry to the `DIMENSIONS` array in
   `app/(main)/_lib/dimensions.ts`. Each entry is:
   ```ts
   { slug: 'yourslug', name: 'Display Name', blurb: 'One short line of vibe.', tier: 'core' | 'more' }
   ```
   `tier: 'core'` shows in the always-visible row; `tier: 'more'` sits behind "More
   realities…". Pick `more` unless you have a reason to promote it — the core row is
   deliberately short (currently 8 of 30 dimensions).
3. **Write the tokens** — see **Tokens to re-set** below.
4. **Add the theme-only rules** — the `!important` overrides for what tokens can't express.
5. **Verify** against the checklist at the end before shipping.

No other file needs to change. The picker UI (`DimensionHUD.tsx`, the "Design curious?"
button in the bottom-left) reads `DIMENSIONS` directly.

## Tokens to re-set

All declared under `:root` in `app/(main)/prism.css`; a theme overrides whichever it needs.
Full table is in `docs/architecture/design-system.md` §1 — the categories are: colour (`--prism-bg`, `--prism-surface`,
`--prism-text`, `--prism-accent`, etc.), shape & depth (`--prism-radius`, `--prism-shadow`, …), type
(`--prism-font-display`, `--prism-font-body`, `--prism-display-weight`, …), and motion
(`--prism-ease`, `--prism-dur`). Do **not** touch the layout tokens (`--prism-max`, `--prism-gutter`,
`--prism-section-y`) — those are structural and themes never override them.

### The three JS-read tokens

These three are read by JavaScript, not just CSS, so they must always be declared and must
use one of the listed values exactly — a typo silently falls back to a default.

| Token | Read by | Valid values |
|---|---|---|
| `--prism-backdrop` | background effect behind the page | `none`, `grid`, `dots`, `rain`, `stars`, `embed`, `scan`, `waves` |
| `--prism-cursor` | custom cursor style | `default`, `ring`, `square`, `block`, `crosshair` |
| `--prism-enter` | transition played when switching *into* this theme | `tear`, `shatter`, `scanline`, `pixelate`, `iris`, `rewind`, `collapse` |

`dimensions.ts` fetches the theme CSS and regex-matches `--prism-enter: <value>` to choose the
switch-in animation before the stylesheet swap — so `--prism-enter` has to be a real property
in your file's `:root`, not just implied.

## The rule: skin, not structure

- Only target classes/IDs from the fixed vocabulary in `docs/architecture/design-system.md` §2
  (`.prism-card`, `.prism-btn`, `.prism-chip`, `.prism-title`, etc.). Never invent a bespoke class.
  Never target a bare element selector except `body` or `html`.
- Never set `position`, `display: flex/grid`, `width`, `margin`, or `padding` on layout
  containers. That breaks the page for every other theme sharing the same markup.
  `display: none` on `.prism-orb` or `.prism-noise` (decorative-only elements) is fine.
- **Every rule outside `:root` needs `!important`.** Theme sheets load after the base
  sheet, so without `!important` the base styles win and your theme silently does nothing.
- No Tailwind classes anywhere in `/v2`. Hand-written CSS only.
- No new npm dependencies. A Google Fonts `@import` at the top of the file is fine if the
  theme needs a face not already loaded.

## Contrast requirement

Aim for **4.5:1 contrast** between `--prism-text` and `--prism-bg` (and any text-on-fill
combination you introduce). This is not optional — it's the one hard accessibility bar
every theme must clear. Check with any contrast checker before shipping; don't eyeball it.

## Minimal working template

```css
/* YOURSLUG — one-line description of the vibe */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap');

:root {
  --prism-bg: #0b0b0f;
  --prism-bg-2: #101018;
  --prism-surface: #14141c;
  --prism-surface-2: #1c1c26;
  --prism-surface-3: #26262f;
  --prism-text: #f2f2f5;
  --prism-muted: rgba(242, 242, 245, 0.6);
  --prism-faint: rgba(242, 242, 245, 0.32);
  --prism-line: rgba(242, 242, 245, 0.12);
  --prism-line-2: rgba(242, 242, 245, 0.24);
  --prism-accent: #5b8cff;
  --prism-accent-2: #8a5bff;
  --prism-accent-3: #5bffd9;
  --prism-accent-soft: rgba(91, 140, 255, 0.1);
  --prism-on-accent: #0b0b0f;

  --prism-radius: 10px;
  --prism-radius-sm: 6px;
  --prism-radius-lg: 18px;
  --prism-radius-pill: 999px;
  --prism-border-w: 1px;
  --prism-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  --prism-shadow-lg: 0 24px 60px -20px rgba(0, 0, 0, 0.7);
  --prism-glow: 0 0 24px rgba(91, 140, 255, 0.3);

  --prism-font-display: 'Space Grotesk', system-ui, sans-serif;
  --prism-font-head: 'Space Grotesk', system-ui, sans-serif;
  --prism-font-body: system-ui, sans-serif;
  --prism-font-mono: ui-monospace, monospace;
  --prism-display-weight: 700;
  --prism-display-tracking: -0.02em;
  --prism-head-transform: uppercase;
  --prism-head-tracking: 0.14em;

  --prism-ease: cubic-bezier(0.16, 1, 0.3, 1);
  --prism-dur: 0.5s;
  --prism-dur-fast: 0.2s;

  --prism-backdrop: dots;
  --prism-cursor: ring;
  --prism-enter: iris;
}

.prism-orb { display: none !important; }

.prism-card {
  border-radius: var(--prism-radius) !important;
  border: 1px solid var(--prism-line) !important;
}
.prism-btn {
  border-radius: var(--prism-radius-pill) !important;
  background: var(--prism-accent) !important;
  color: var(--prism-on-accent) !important;
}
```

Register it (step 2):

```ts
{ slug: 'yourslug', name: 'Your Theme Name', blurb: 'One short line of vibe.', tier: 'more' },
```

## Checklist before shipping

- [ ] File is at `public/prism/themes/<slug>.css`, 2–5 KB.
- [ ] Added to `DIMENSIONS` in `app/(main)/_lib/dimensions.ts` with matching `slug`.
- [ ] All three JS-read tokens declared: `--prism-backdrop`, `--prism-cursor`, `--prism-enter` —
      each one of the exact listed values.
- [ ] Only vocabulary classes/IDs targeted (`docs/architecture/design-system.md` §2). No bespoke classes, no bare
      element selectors besides `body`/`html`.
- [ ] No `position`, `display: flex/grid`, `width`, `margin`, or `padding` on layout
      containers — skin only.
- [ ] Every rule outside `:root` has `!important`.
- [ ] Body text vs background hits 4.5:1 contrast.
- [ ] No Tailwind classes, no new npm dependencies.
- [ ] Verified in the browser: open the site, use the picker in the bottom-left ("Design
      curious?") or visit `/?dimension=<slug>`, confirm it renders and the switch-in
      transition plays.

See `docs/guides/local-development.md` for how to preview a dimension (URL param, picker,
and the `[` `]` `\` keyboard shortcuts).
