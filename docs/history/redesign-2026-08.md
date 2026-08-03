# The August 2026 redesign

How the site went from a single fixed-theme blog to a home page with thirty swappable visual
identities, and the round of fixes that followed shipping it.

## Before

The site was a conventional Next.js blog: one `app/layout.tsx`, one look, dark mode via
`next-themes`. Pages lived at the App Router root — `app/page.tsx`, `app/about/page.tsx`,
`app/articles/page.tsx`, `app/projects/page.tsx`, `app/radar/page.tsx` — each rendering inside
the shared `Header` / `Footer` chrome from `components/SiteFrame.tsx`.

## The 30-dimension idea

The idea, and the name "dimension" for each visual identity, came from the owner (Sushant
Gundla) — build one page whose entire visual identity can be swapped at runtime by changing a
single stylesheet `<link>`. That only works if the base markup is disciplined: every colour,
radius, shadow, font and border has to live in a CSS variable, and every element has to be
built from a fixed, small class vocabulary. A theme file then only needs to re-set the
variables plus a short block of `!important` overrides for what variables cannot carry (radius
shape, borders, shadows, clip-paths, fonts).

Commit `cbf6339` ("feat: ship the 30-dimension redesign as the home page") shipped the
mechanism:

- `app/(main)/prism.css` — the base stylesheet, ~40 CSS custom properties (`--prism-*`) and a fixed
  ~30-class vocabulary (`.prism-card`, `.prism-btn`, `.prism-eyebrow`, etc). Full rules in
  [`docs/architecture/design-system.md`](../architecture/design-system.md).
- `public/prism/themes/*.css` — 30 theme files, averaging ~3.5 KB each. Eight are original
  designs; the rest are takes on existing aesthetics (Nord, Solarized, Swiss, synthwave,
  vaporwave, terminal, xerox, riso, and more).
- Seven transition treatments (tear, shatter, scanline, pixelate, iris, rewind, collapse), each
  a 640ms three-beat sequence. The stylesheet swap lands at peak distortion so the repaint is
  never visible.
- One canvas backdrop with eight modes, driven by a `--prism-backdrop` variable each theme sets —
  one canvas, thirty different looks. Throttled to 30fps and GPU-promoted.
- `color-scheme` tracks the active theme's background luminance so light dimensions do not get
  a dark browser scrollbar.
- All 30 themes were verified for contrast (WCAG 4.5:1 body text, 3:1 large text) and for zero
  horizontal overflow at 390px and 1440px.

`app/(main)` is a Next.js route group, so it serves `/` without adding a path segment.

**The old home page moved to `/old`**, marked `noindex` with a canonical pointing at `/`, so it
would not compete with the new one in search results. At this point the redesign covered only
the home page — `/old`, `/articles`, `/projects`, `/about` and `/radar` still ran the original
`Header`/`Footer` chrome.

## Moving the whole site onto the redesign

Commit `aecf7f4` ("feat: move the whole site onto the redesign") brought every other route into
`app/(main)/`, so all thirty dimensions repaint the entire site, not just one screen:

- A new themed nav bar, built only from the shared class vocabulary — hides on scroll down,
  returns on scroll up, highlights the active section. It sits outside `#prism-shell` so it stays
  still while the shell distorts during a transition.
- `/articles`: full index, a featured post, and a pure-CSS tag filter using `:has()` — no
  client JS needed.
- `/articles/[slug]`: reader view with `prose.css`, every colour/font/border (including the
  `rehype-highlight` code block palette) driven by `--prism-*` tokens.
- `/projects`: a status filter that dims rather than unmounts non-matching cards.
- `/about` and `/radar`: ported into the new shell.
- `SiteFrame`'s default inverted — routes render bare by default, and only `/old` keeps the
  original `Header`/`Footer`.

This commit also hit the first `<style>`-in-JSX hydration bug (see
[`docs/history/decisions.md`](decisions.md)) on `/articles`.

## Fixing what the port dropped

Porting pages into the new shell had quietly rewritten or dropped real content. Two follow-up
commits corrected this:

**`f320c8e`** ("fix: restore copy and layout the redesign dropped from /about and /radar"):
- `/about`'s headline "Architecting the Latent Space." (the port had swapped it for a generic
  "Hi, I'm Sushant Gundla."), the "Technical Lead, AI/ML · PDI Technologies" eyebrow, the
  numbered section labels, the Download Resume / View Projects actions, and the four original
  skill groups (AI & Machine Learning, Frameworks & Tools, Data & Retrieval, Infrastructure)
  in place of an invented taxonomy.
- Fixed the `/about` portrait, which had collapsed to 2x3px: `.prism-frame` was sized with
  `width: 100%`, but the containing element sizes to content as a flex item, so the percentage
  resolved against zero.
- `/radar` returned to two side-by-side columns (01 / PULSES, 02 / PICKS) instead of tabs that
  hid half the page. Dropping the tabs also removed a client component — the route fell from
  1.9 kB to 545 B and went back to server-rendering.
- `/articles` and `/projects` headlines restored to the owner's own wording, and the
  "Enterprise / Confidential" status label restored from a truncated "Confidential".

**`3b3537a`** ("fix: drop the employer and product name from the home page intro"): the hero
had named "PDI Technologies" and "MyPDI" directly. The home page is a personal capability page,
so the positioning line was rewritten to not name an employer or product — while `/about` still
opens with the "Technical Lead, AI/ML · PDI Technologies" eyebrow and full work history, which
is where employment belongs. Project cards further down the page still name real projects like
"MyPDI AI Agent Framework" — only the personal intro line changed.

## Trim, tactile /about, and the design picker

**`88a7468`** ("feat: trim the home page, make /about tactile, add a design picker"):
- Removed the three home-page stat tiles (7+ years, 60% faster resolution, 300M+ documents) —
  those numbers belong to a specific project, not to the person, and overstated as headline
  personal stats. The 60% figure stayed on the Agentic Ticket Resolution project card, where it
  is earned.
- Removed the home-page work timeline (duplicated on `/about`).
- `/about` portrait grew to 500px and became the priority element; the headline scale had to
  drop to `clamp(2.5rem, 6vw, 6rem)` with an overflow-wrap guard so "Architecting" would not
  clip.
- Experience entries became real links to LinkedIn with a persistent "View on LinkedIn →"
  affordance (so it still works on touch, where hover does not exist).
- Added a design picker: a gallery of all thirty designs with a text filter and a colour
  swatch read from each theme's own stylesheet, so visitors can choose a dimension instead of
  only shuffling.
- Site-wide hover/focus states added to the shared class vocabulary, gated behind
  `@media (hover: hover)`.
- This commit also hit the `<style>` hydration bug a second time, on `/about`, and is where the
  trap first got written down (originally in `app/(main)/CONTRACT.md`, now
  [`docs/architecture/design-system.md`](../architecture/design-system.md)).

## Rebuilding the stack diagram and removing internal detail

**`800601f`** ("feat: rebuild the stack diagram, enlarge the portrait, enrich tags"): the home
page's stack diagram and its card copy had been written as documentation of one employer's
platform, down to identifiers like `chat.mypdi` and `mcp://gateway` that read as real internal
endpoints. That is not appropriate for a personal site (see
[`docs/history/decisions.md`](decisions.md)), so the diagram and its cards were rewritten to
describe capabilities rather than a specific company's implementation. The diagram itself was
restructured: substrate (LLM Gateway, MCP Gateway, Knowledge Base) → agent framework → what you
build with agents (Chatbot, Automation Workflows). `/about`'s portrait grew again, to 620px, and
skills expanded from 29 to 43.

**`f97a8bf`** ("feat: add the foundation layer, retune the skill set") restored a fourth
diagram row the restructure had dropped — Model Providers, Infrastructure, Data & Ingestion —
in the shape the owner asked for, and introduced a `parallel3` connector for it. Skills were
retuned to the owner's stated scope (AI/ML, statistics, Python/backend, application
development): Next.js, TypeScript and Data Visualization came out; AI coding-agent skills
(Cursor, Copilot, Codex, Claude Agent SDK, MCP) and backend/provider skills (Bedrock, OpenAI
API, Anthropic API) went in. 55 skills total, every one filed into an existing group.

**`d87c567`** ("fix: foundation as a spanning band, unbreak project badges, wake up /radar")
reworked that fourth row again: three cards under three cards implied a one-to-one mapping
that does not exist (infra does not sit under the MCP gateway specifically — it carries the
whole platform), so it became a single "Runs on" band, with a `support` bracket connector
instead of `parallel3`. Also moved the project status badge above the title (it had been
overflowing the card in a `nowrap` row), and gave `/radar` its motion and hover states — the
page had been inert until this commit.

## The vocabulary violation, and fixing it

**`fc91778`** ("fix: radar entries use .prism-card, foundation becomes three plain blocks"):
`/radar` looked different from every other page because its entries used a bespoke
`.prism-radar-entry` class instead of `.prism-card`. Since theme files only style `.prism-card`, radar
was the one page getting no per-theme card treatment at all. This was a violation of the
design-system contract's rule to build only from the shared vocabulary (see
[`docs/history/decisions.md`](decisions.md)). Fixed by switching radar entries to
`.prism-card .prism-card-lift`. The foundation band from `d87c567` also went back to three plain
cards — the "Runs on" band and label were dropped, since the `support` connector alone already
carries that meaning.

## Final polish

- **`bcc603f`** ("fix: tidy the closing footer, drop the back-link and shortcut hint") —
  restructured the footer credit line (name, role, location, year were running together) and
  removed the "← previous site" link and the "⌘K" shortcut hint. `/old` still exists, it is
  just no longer advertised.
- **`44407ad`** ("feat: rotate the design button through fifteen labels") — the "Design
  curious?" button now cycles through fifteen short phrases every 4.2s (and on every press).
  Index 0 renders identically on server and first client paint, with rotation starting only
  after mount, to avoid the same server/client mismatch class of bug the `<style>` issue
  belongs to. The pill's `min-width` is pinned (in `em`) to the widest label so it does not
  jitter as the text changes length.

## What was fixed after shipping

This was not a clean, one-pass ship. Worth recording honestly: several rounds after `cbf6339`
and `aecf7f4` corrected real regressions the port introduced — dropped copy and layout on
`/about` and `/radar` (`f320c8e`), an employer/product name that should not have been on the
home page (`3b3537a`), internal-sounding platform details in the stack diagram (`800601f`), an
inert `/radar` page (`d87c567`), and a shared-vocabulary violation that left `/radar` untheme-
able (`fc91778`). The `<style>` hydration bug (see
[`docs/history/decisions.md`](decisions.md)) was hit and fixed twice, on two different pages,
before it was written down as a documented trap.

## See also

- [`docs/history/decisions.md`](decisions.md) — the durable rules that came out of this work.
- [`docs/architecture/design-system.md`](../architecture/design-system.md) — the full design
  token and class vocabulary contract.
- [`docs/architecture/overview.md`](../architecture/overview.md) — how the redesign fits into
  the app's overall structure.
