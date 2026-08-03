# Adding a Dimension

How to add a 31st visual theme ("dimension") to the site. Dimensions are the site's
signature feature: the whole homepage repaints from one CSS file swap, no page reload.
Full rules live in `docs/architecture/design-system.md` (the original build contract) —
this guide is the practical walkthrough. Read that doc too before you start; it is the
source of truth if this guide and the code ever disagree.

## How it works, in short

The homepage links to exactly one theme stylesheet:

```js
document.getElementById('v2-theme-link').href = `/v2/themes/${slug}.css`
```

The base stylesheet, `app/(main)/v2.css`, defines every color, radius, shadow, and font as
a CSS variable (a `--v2-*` custom property) and every visual element as a class from a
fixed vocabulary (`.v2-card`, `.v2-btn`, `.v2-chip`, …). A theme file does two things:
re-set the variables, and override the handful of things variables can't carry (radius
shape, borders, shadow style) with `!important` rules targeting that same vocabulary.
That discipline is what makes a same-page, no-reload repaint possible.

## Steps

1. **Create the theme file**: `public/v2/themes/<slug>.css`. Target 2–5 KB.
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

All declared under `:root` in `app/(main)/v2.css`; a theme overrides whichever it needs.
Full table is in `docs/architecture/design-system.md` §1 — the categories are: colour (`--v2-bg`, `--v2-surface`,
`--v2-text`, `--v2-accent`, etc.), shape & depth (`--v2-radius`, `--v2-shadow`, …), type
(`--v2-font-display`, `--v2-font-body`, `--v2-display-weight`, …), and motion
(`--v2-ease`, `--v2-dur`). Do **not** touch the layout tokens (`--v2-max`, `--v2-gutter`,
`--v2-section-y`) — those are structural and themes never override them.

### The three JS-read tokens

These three are read by JavaScript, not just CSS, so they must always be declared and must
use one of the listed values exactly — a typo silently falls back to a default.

| Token | Read by | Valid values |
|---|---|---|
| `--v2-backdrop` | background effect behind the page | `none`, `grid`, `dots`, `rain`, `stars`, `embed`, `scan`, `waves` |
| `--v2-cursor` | custom cursor style | `default`, `ring`, `square`, `block`, `crosshair` |
| `--v2-enter` | transition played when switching *into* this theme | `tear`, `shatter`, `scanline`, `pixelate`, `iris`, `rewind`, `collapse` |

`dimensions.ts` fetches the theme CSS and regex-matches `--v2-enter: <value>` to choose the
switch-in animation before the stylesheet swap — so `--v2-enter` has to be a real property
in your file's `:root`, not just implied.

## The rule: skin, not structure

- Only target classes/IDs from the fixed vocabulary in `docs/architecture/design-system.md` §2
  (`.v2-card`, `.v2-btn`, `.v2-chip`, `.v2-title`, etc.). Never invent a bespoke class.
  Never target a bare element selector except `body` or `html`.
- Never set `position`, `display: flex/grid`, `width`, `margin`, or `padding` on layout
  containers. That breaks the page for every other theme sharing the same markup.
  `display: none` on `.v2-orb` or `.v2-noise` (decorative-only elements) is fine.
- **Every rule outside `:root` needs `!important`.** Theme sheets load after the base
  sheet, so without `!important` the base styles win and your theme silently does nothing.
- No Tailwind classes anywhere in `/v2`. Hand-written CSS only.
- No new npm dependencies. A Google Fonts `@import` at the top of the file is fine if the
  theme needs a face not already loaded.

## Contrast requirement

Aim for **4.5:1 contrast** between `--v2-text` and `--v2-bg` (and any text-on-fill
combination you introduce). This is not optional — it's the one hard accessibility bar
every theme must clear. Check with any contrast checker before shipping; don't eyeball it.

## Minimal working template

```css
/* YOURSLUG — one-line description of the vibe */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap');

:root {
  --v2-bg: #0b0b0f;
  --v2-bg-2: #101018;
  --v2-surface: #14141c;
  --v2-surface-2: #1c1c26;
  --v2-surface-3: #26262f;
  --v2-text: #f2f2f5;
  --v2-muted: rgba(242, 242, 245, 0.6);
  --v2-faint: rgba(242, 242, 245, 0.32);
  --v2-line: rgba(242, 242, 245, 0.12);
  --v2-line-2: rgba(242, 242, 245, 0.24);
  --v2-accent: #5b8cff;
  --v2-accent-2: #8a5bff;
  --v2-accent-3: #5bffd9;
  --v2-accent-soft: rgba(91, 140, 255, 0.1);
  --v2-on-accent: #0b0b0f;

  --v2-radius: 10px;
  --v2-radius-sm: 6px;
  --v2-radius-lg: 18px;
  --v2-radius-pill: 999px;
  --v2-border-w: 1px;
  --v2-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  --v2-shadow-lg: 0 24px 60px -20px rgba(0, 0, 0, 0.7);
  --v2-glow: 0 0 24px rgba(91, 140, 255, 0.3);

  --v2-font-display: 'Space Grotesk', system-ui, sans-serif;
  --v2-font-head: 'Space Grotesk', system-ui, sans-serif;
  --v2-font-body: system-ui, sans-serif;
  --v2-font-mono: ui-monospace, monospace;
  --v2-display-weight: 700;
  --v2-display-tracking: -0.02em;
  --v2-head-transform: uppercase;
  --v2-head-tracking: 0.14em;

  --v2-ease: cubic-bezier(0.16, 1, 0.3, 1);
  --v2-dur: 0.5s;
  --v2-dur-fast: 0.2s;

  --v2-backdrop: dots;
  --v2-cursor: ring;
  --v2-enter: iris;
}

.v2-orb { display: none !important; }

.v2-card {
  border-radius: var(--v2-radius) !important;
  border: 1px solid var(--v2-line) !important;
}
.v2-btn {
  border-radius: var(--v2-radius-pill) !important;
  background: var(--v2-accent) !important;
  color: var(--v2-on-accent) !important;
}
```

Register it (step 2):

```ts
{ slug: 'yourslug', name: 'Your Theme Name', blurb: 'One short line of vibe.', tier: 'more' },
```

## Checklist before shipping

- [ ] File is at `public/v2/themes/<slug>.css`, 2–5 KB.
- [ ] Added to `DIMENSIONS` in `app/(main)/_lib/dimensions.ts` with matching `slug`.
- [ ] All three JS-read tokens declared: `--v2-backdrop`, `--v2-cursor`, `--v2-enter` —
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
