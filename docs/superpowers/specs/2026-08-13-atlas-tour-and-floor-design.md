# The Atlas — a clickable training-floor heading, a fun-first game order, and a first-visit tour

Date: 2026-08-13
Status: approved

## Why

Three problems the owner hit on `/atlas`:

1. **The training floor's headline does not look clickable.** It is a real
   `<Link>` and it does work — verified live at
   `https://sushantgundla.com/atlas` on 2026-08-13 by clicking it and landing
   on `/atlas/learn`. But it is set as a headline, in the plate's title face,
   with no underline and no cursor change, so it reads as decoration. The
   owner never tried clicking it. That is a design failure, not a routing bug:
   an affordance problem, fixed with affordance.

2. **The five games are ordered by nothing in particular.** Today's order is
   `forgery, higher-lower, flags, guess-country, where-in-the-world` — the
   order they happened to be built in. The owner has now played all five and
   ranked them by how fun they actually are. The floor should lead with the
   best one.

3. **A first-time visitor does not know what the page can do.** The plate has
   a map you can hover, drag and zoom; a search box; a dial that repaints the
   world by indicator; a standings rail; compare and rankings routes; and a
   whole training floor behind one band. None of that announces itself. The
   owner wants the pattern new products use: dim the page, spotlight one
   thing at a time, let people step through it or skip the lot.

## 1 — The heading

**File:** `app/atlas/_components/FloorBand.tsx`, `app/atlas/_components/plate.module.css`

The `<Link>` currently wraps only the words "The training floor" and the
arrow. The caption below it — "Five games. A grade to climb. A wall of your
runs." — is a plain `<p>` outside the link.

Change: the link wraps the whole left block. `.floorBandHead` becomes the
anchor; headline, arrow and caption all live inside it. That roughly triples
the click target and, more importantly, means the caption lights up on hover
too, so the whole cluster behaves as one thing.

Affordance, in `plate.module.css`:

- `cursor: pointer` on the link (a `<Link>` gets this by default, but the
  block form makes it worth being explicit).
- The headline words gain an underline on `:hover` and `:focus-visible` —
  `text-decoration: underline`, `text-underline-offset: 0.14em`,
  `text-decoration-thickness: 1px`, in `--note-ember`. Only the words, not the
  caption; the caption just shifts to `--note-intaglio` so the block reads as
  one hover state.
- The arrow's existing 4px slide stays.
- `:focus-visible` keeps its current 2px `--note-ember` outline, now drawn
  around the whole block.
- The existing `prefers-reduced-motion` block at the bottom of the file
  already lists `.floorBandLead` and `.floorBandArrow`; leave it as is.

Accessibility: the caption moves inside an `<a>`, so it must stop being a
`<p>` (block inside an inline anchor is legal in HTML5 but the anchor is
already `display: inline-flex`; make the anchor `display: flex;
flex-direction: column` and the caption a `<span>` with
`display: block`). The link's accessible name becomes headline + caption,
which reads correctly: "The training floor → Five games. A grade to climb. A
wall of your runs."

## 2 — Game order

New order, best first, as ranked by the owner:

| # | Game | id |
|---|---|---|
| 1 | Guess the country | `guess-country` |
| 2 | Guess the flag | `flags` |
| 3 | Where in the world | `where-in-the-world` |
| 4 | Spot the forgery | `forgery` |
| 5 | Higher or lower | `higher-lower` |

Three lists must change together:

- `lib/atlas/learn/progress.ts` — `GAME_IDS`. Drives the floor band's row of
  five links and the wall.
- `lib/atlas/learn/questions/index.ts` — a second `GAME_IDS` with the same
  five ids. It exists so the questions module has its own door; it must not
  drift from the first.
- `app/atlas/learn/page.tsx` — the `GAMES` array with the titles and
  one-liners.

Safety: `Progress.games` is a `Record<GameId, GameStat>` and `RunRecord`
stores a `game` id, so saved progress is keyed by name, never by index.
Reordering moves nothing anyone has earned. Confirm no code indexes
`GAME_IDS` by number before shipping.

## 3 — The tour

### Shape

A single client component mounted once for the whole Atlas section. It renders
nothing until it decides to run.

**New directory:** `app/atlas/_components/tour/`

| File | What |
|---|---|
| `AtlasTour.tsx` | The overlay, the card, the step machine. Client component. |
| `TourReplayLink.tsx` | "Take the tour →". Client component. Starts the tour for the current route. |
| `tour-steps.ts` | The two step lists, plus the storage keys. Plain data. |
| `tour-storage.ts` | Read/write/clear the localStorage flags, guarded in try/catch. |
| `tour.module.css` | Overlay, cut-out, card, arrow. |

Mounted in `app/atlas/layout.tsx` so it covers `/atlas` and `/atlas/learn`
from one place. It reads `usePathname()` and picks its step list:

- exactly `/atlas` → the plate steps
- exactly `/atlas/learn` → the floor steps
- anything else (a dossier, compare, rankings, a game) → renders `null`

### The steps

Each step is `{ id, target, title, body, allowTargetClick }`.

**`/atlas` — six stops**

| # | target | Says |
|---|---|---|
| 1 | `map` | The world, engraved. Hover a country to see its name, drag to move, scroll to zoom. Click any country to open its note. |
| 2 | `search` | Know the country already? Type its name here. |
| 3 | `dial` | Paint the world by one measure — population, income, life expectancy. The map recolours. |
| 4 | `rail` | The standings. Every country ranked by whatever the dial is showing. Click a row to open it. |
| 5 | `ways-in` | Two more ways in: put countries side by side, or read a full ranked table. |
| 6 | `floor` | And the training floor — five games built from this same data, with a grade to climb. |

**`/atlas/learn` — four stops**

| # | target | Says |
|---|---|---|
| 1 | `grade` | Your grade. It climbs as you answer correctly, across every game. |
| 2 | `cotd` | One country picked out every day. Worth a look before you start. |
| 3 | `games` | The five games, best first. Ten questions a run. |
| 4 | `wall` | Every run you finish hangs here. |

`allowTargetClick` is `true` only for `search` and `dial` — the two targets
where a real click changes nothing you cannot undo. Everywhere else the hole
is inert and only **Next** moves you on. That is a deliberate softening of
"they must click the target": clicking the map or the floor band navigates
away and would end the tour mid-way.

### Finding targets

Steps name a target by a `data-tour` attribute already on the page. The
component does `document.querySelector('[data-tour="map"]')`.

Attributes to add:

| File | Element | Attribute |
|---|---|---|
| `app/atlas/_components/Plate.tsx` | the map wrapper div (`mapWrapRef`) | `data-tour="map"` |
| `app/atlas/_components/Plate.tsx` | the `styles.cornerCluster` div holding `AtlasSearch` | `data-tour="search"` |
| `app/atlas/_components/Plate.tsx` | the `styles.furnitureRow` div holding `MetricDial` | `data-tour="dial"` |
| `app/atlas/_components/Plate.tsx` | the `styles.rail` aside | `data-tour="rail"` |
| `app/atlas/page.tsx` | the `styles.introLinks` nav | `data-tour="ways-in"` |
| `app/atlas/_components/FloorBand.tsx` | the outer `styles.floorBand` div | `data-tour="floor"` |
| `app/atlas/learn/page.tsx` | a wrapper around `<GradeSeal />` | `data-tour="grade"` |
| `app/atlas/learn/page.tsx` | a wrapper around `<CountryOfDayCard />` | `data-tour="cotd"` |
| `app/atlas/learn/page.tsx` | the `styles.grid` div | `data-tour="games"` |
| `app/atlas/learn/page.tsx` | a wrapper around `<ResultsWall />` | `data-tour="wall"` |

A step whose target is not in the DOM is dropped before the tour starts, and
the counter ("2 of 6") is computed from the surviving list. Country of the day
can legitimately be absent on a rare day, so this is a real case, not
defensive padding.

### The overlay

One `position: fixed` layer at `inset: 0`, `z-index` above everything on the
page (the plate's own furniture tops out well below; use `z-index: 200` and
`210` for the card).

The hole is drawn with a giant `box-shadow` on a transparent, absolutely
positioned box sized to the target's `getBoundingClientRect()`:
`box-shadow: 0 0 0 9999px rgba(--note-void, 0.72)`. Padding of 8px around the
rect, `border-radius: 4px`, plus a 1px `--note-ember` ring so the target reads
as chosen rather than merely uncovered.

Click blocking:

- The overlay layer has `pointer-events: auto` and swallows every click.
- The hole box has `pointer-events: none` so clicks pass through to the real
  element beneath — but only when `allowTargetClick` is true. When false the
  hole box takes `pointer-events: auto` and swallows them too.

Because the overlay swallows clicks rather than the page disabling itself, no
existing component needs to know the tour exists.

### The card

Positioned beside the hole: below it if there is room, otherwise above; nudged
horizontally to stay 16px inside the viewport. A small triangle points at the
hole. On screens under 640px the card pins to the bottom of the viewport
instead of chasing the hole.

Contents:

- "2 of 6", mono, dim.
- A short title.
- One or two plain sentences.
- **Skip the tour** (quiet, left) and **Next** / **Done** (ember, right).

The card is a `role="dialog"` with `aria-modal="true"`, labelled by its title.
Focus moves to it when a step opens and is trapped inside it (Tab cycles Skip
→ Next → Skip). `Escape` skips the whole tour. Arrow-right / arrow-left step
forward and back.

### Scroll and resize

Before a step shows, its target is scrolled into view with
`scrollIntoView({ block: 'center', behavior: prefers-reduced-motion ? 'auto'
: 'smooth' })`. The rect is then measured on the next animation frame, and
re-measured on `scroll` and `resize` (both passive, both throttled with
`requestAnimationFrame`) so the hole tracks the target if the page moves.

Body scroll is **not** locked — the tour scrolls the page itself, and locking
would fight that.

### Memory

`localStorage`, one key per tour:

- `atlas.tour.plate.v1`
- `atlas.tour.floor.v1`

Value is `"done"`. Written when the tour is finished **or** skipped — skipping
means "not now and not again", which is what people expect. Both reads and
writes are wrapped in try/catch; a browser with storage blocked simply gets
the tour every time, which is harmless.

The `v1` suffix is there so a future change to the steps can re-run the tour
for everybody by bumping to `v2`.

### Hydration

The component returns `null` on the server and on the first client render. A
`useEffect` sets `mounted`, reads storage, and only then decides to run. This
is the same pattern `app/atlas/_components/FloorGradeChip.tsx` already uses
for localStorage-backed content, and it is why there can be no server/client
mismatch.

A short delay (400ms after mount) before the first step appears, so the page
has settled and the tour does not slam into a still-painting map.

### Replaying it

`<TourReplayLink />` renders "Take the tour →" in the same style as the other
`.introLink` items and sits in the `styles.introLinks` nav on `app/atlas/page.tsx`,
after "Full rankings". Clicking it clears the key for the current route and
starts the tour immediately. The two components talk through a
`window.dispatchEvent(new CustomEvent('atlas:tour:start'))` that `AtlasTour`
listens for — no shared React context needed, and it keeps the link usable
from anywhere later.

On `/atlas/learn` the same link goes in the `styles.toolbar` row next to
"← Back to the plate".

### Reduced motion

Under `prefers-reduced-motion: reduce`: no fade on the overlay, no transition
on the hole as it moves between steps, and `scrollIntoView` uses `auto`. The
tour still runs; it just stops sliding.

## Out of scope

- No tour on the dossier, compare or rankings pages.
- No progress persisted per step. Leave mid-way and you get the whole tour
  again next time — the flag is only written at the end or on skip.
- No analytics.

## Verification

1. `npm run build` exits 0.
2. On `/atlas` with storage cleared: the tour appears, six stops, the hole
   lands on the right thing each time, Skip works, Esc works.
3. Reload: the tour does not reappear. "Take the tour" brings it back.
4. `/atlas/learn` with storage cleared: four stops.
5. The training-floor heading underlines on hover and the whole block is
   clickable.
6. The games read in the new order on both `/atlas` and `/atlas/learn`.
7. Keyboard only: Tab reaches the heading link; inside the tour, focus stays
   in the card.
8. Checked on the live site after deploy, not on localhost.
