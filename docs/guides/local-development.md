# Local Development

How to get the site running on your machine, plus the one gotcha that has bitten before.

## Setup

```bash
npm install
npm run dev      # starts the dev server at http://localhost:3000
```

Other commands, from `package.json`:

```bash
npm run build    # production build
npm run start    # run the production build (after npm run build)
npm run lint      # ESLint
```

## Running two Next processes at once — use `NEXT_DIST_DIR`

Next writes its build output to `.next` by default. **If a `next dev` server is already
running and you (or another session) run `next build` in the same repo, the build wipes
the `.next` chunks out from under the running dev server — every request the dev server
serves starts 404ing.** This has happened before.

It mainly comes up when two people, or two Claude Code sessions, are working in this repo
at the same time — one running `npm run dev`, another running `npm run build` to check
the build is clean.

Fix: point the second process at its own build directory with `NEXT_DIST_DIR`
(`next.config.js` reads it into `distDir`):

```bash
NEXT_DIST_DIR=.next-dev npm run dev
```

Use this for whichever process is the "extra" one — e.g. keep your long-running `npm run
dev` on the default `.next`, and run a one-off `npm run build` with a scratch dir instead:

```bash
NEXT_DIST_DIR=.next-build-check npm run build
```

Normal solo `npm run dev` / `npm run build` don't need this — it defaults to `.next` and
behaves exactly as before. Only reach for it when a second Next process needs to coexist
with a running dev server.

## Previewing a dimension

The site ships with 30 visual themes ("dimensions") — see
`docs/guides/adding-a-dimension.md` for how to add one. Ways to preview one locally:

- **The picker**: click the small "Design curious?" button in the bottom-left of the page
  (`DimensionHUD.tsx`). It opens a gallery of all 30, grouped into a core row and a
  "More realities…" section.
- **URL param**: append `?dimension=<slug>` to any page, e.g.
  `http://localhost:3000/?dimension=terminal`.
- **Keyboard shortcuts** (registered in `app/(main)/_lib/dimensions.ts`, active anywhere
  you're not typing into an input/textarea):
  | Key | Action |
  |---|---|
  | `[` | previous dimension in the list |
  | `]` | next dimension in the list |
  | `\` | jump to one random other dimension |

The chosen dimension persists in `localStorage` (`v2-dimension`) so it survives a reload.
