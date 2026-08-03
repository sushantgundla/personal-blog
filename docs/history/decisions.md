# Decisions and traps

Durable engineering decisions from building the redesign (see
[`docs/history/redesign-2026-08.md`](redesign-2026-08.md) for the full story), and the mistakes
that produced each rule. Mined from commit messages, which are unusually detailed for this
project — read the referenced commit for the full reasoning.

## Zero Tailwind inside `app/(main)`

**Decision:** no Tailwind utility classes anywhere under `app/(main)/` (the redesign route
group). All styling is hand-written CSS in `app/(main)/prism.css` (base) or
`public/prism/themes/*.css` (themes). The only exception is the root div using
`className="prism-root"`.

**Why:** Tailwind utilities carry higher specificity than the theme files. A `flex` or `mt-4`
class would beat a theme's `!important` overrides, breaking the "swap one stylesheet, repaint
the whole page" mechanism the redesign depends on.

**If you break it:** a theme change silently fails to restyle whatever element carries the
Tailwind class — it looks fine in the default theme and wrong in every other one.

## The layout is fully fluid, not fixed-width

**Decision:** `--prism-max: 100%` (see `app/(main)/prism.css:112`), not a fixed pixel cap like the
original `1180px` value documented early in the contract.

**Why:** a fixed pixel max-width left bare page background down both sides on wide displays.
Line length for readability is capped separately, per text block, via a `--prism-measure` token —
that is a typography concern, not a page-layout one, and the two should not be conflated.

**If you break it:** wide viewports (1440px+) show dead space at the edges that reads as a
layout bug, not a design choice.

## `<style>` text children break hydration

**Decision:** any inline `<style>` block rendered from JSX must use
`dangerouslySetInnerHTML`, never a plain text child.

**Why:** React escapes quote characters (`"` → `&quot;`) inside a `<style>` text child during
server rendering, but does not escape them during client rendering. Any CSS containing a quote
— a `:has()` selector with a double-quoted attribute value, or even a single apostrophe in a
comment — produces a server/client HTML mismatch. React throws away the entire server-rendered
page and re-renders from scratch on the client.

**If you break it:** this bug shipped three separate times before it was written down —
`/articles` (`aecf7f4`), `/about` (`88a7468`), and it is the same class of bug the design-button
rotation logic (`44407ad`) was deliberately written to avoid. Symptom: a page that flashes or
re-layouts right after load, or fails a hydration check in the console.

## `.prism-root button { color: inherit }` outranks `.prism-btn`

**Decision:** button color rules for `.prism-btn`, `.prism-btn-ghost`, `.prism-link` and `.prism-btn-quiet`
are re-asserted at `.prism-root .prism-btn` specificity (see `app/(main)/prism.css:190-199`), not left to
the single-class selector alone.

**Why:** the base reset's `.prism-root button { color: inherit }` rule has specificity (0,1,1),
which outranks a plain `.prism-btn { color: ... }` rule at (0,1,0). Left alone, any control
rendered as a `<button>` inherits the page's text colour instead of its own — which makes the
primary button accent-on-accent, i.e. invisible, in any theme where `--prism-text` equals
`--prism-accent`.

**If you break it:** the primary button vanishes in specific themes only, not all of them,
which makes it easy to miss in a quick check of the default theme.

## Everything is built from the shared class vocabulary, or themes cannot restyle it

**Decision:** every element must be built from the fixed ~30-class vocabulary in
`app/(main)/prism.css` (`.prism-card`, `.prism-btn`, `.prism-eyebrow`, etc — full list in
[`docs/architecture/design-system.md`](../architecture/design-system.md)). No bespoke classes
for one-off page elements.

**Why:** theme files only target the shared vocabulary. A bespoke class gets none of a theme's
per-theme treatment.

**If you break it:** `/radar` did exactly this — its entries used `.prism-radar-entry` instead of
`.prism-card`, so it was the one page with no per-theme card styling at all (no slanted texture,
no notch, no offset shadow, depending on the theme). Fixed in `fc91778`.

## Copy belongs to the owner

**Decision:** when porting or redesigning a page, preserve the owner's actual wording — do not
rewrite headlines, bios, or section copy as part of a visual redesign.

**Why:** a redesign pass quietly replaced real copy with generic placeholder-sounding text —
`/about`'s headline "Architecting the Latent Space." became "Hi, I'm Sushant Gundla.", and the
skills taxonomy was replaced with an invented one. Fixed in `f320c8e`.

**If you break it:** the site stops sounding like the person it belongs to, and the fix is a
manual diff against the previous version to recover what was lost.

## Content describing an employer's internal architecture does not belong on a personal site

**Decision:** capability descriptions (the stack diagram, project cards) describe what a
capability is, not how a specific employer's platform implements it. No internal identifiers.

**Why:** an earlier version of the home page's stack diagram and card copy read as
documentation of one employer's platform, down to identifiers like `chat.mypdi` and
`mcp://gateway` that looked like real internal endpoints. Fixed in `800601f`. Separately,
`3b3537a` removed the employer/product name from the home page's personal positioning line —
`/about`'s "Technical Lead, AI/ML · PDI Technologies" eyebrow and work history remain the right
place for that information, since employment history is expected there.

**If you break it:** the site leaks what should be internal-only details about an employer's
systems, and reads as advertising a specific company's product rather than the owner's own
capabilities.

## `NEXT_DIST_DIR` exists so a build cannot wipe a running dev server's chunks

**Decision:** `next.config.js` reads `distDir` from `process.env.NEXT_DIST_DIR`, falling back
to `.next`. Run a production build with `NEXT_DIST_DIR=.next-dev npm run dev` (or similar) when
a dev server is running against `.next` at the same time.

**Why:** `next build` clears its dist directory before writing. If a build and a running dev
server point at the same `.next`, the build can wipe chunks the dev server has already served
to the browser, breaking the live session.

**If you break it:** a dev server that was working fine suddenly 404s on chunk requests after
an unrelated `npm run build` elsewhere.
