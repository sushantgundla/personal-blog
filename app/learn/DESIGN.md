# Design — the learn section

<!-- Scope: everything under app/learn/ and content/learn/. The rest of the
     site (app/(main)/, app/atlas/) keeps its own world; nothing here leaks. -->

## Direction contract

**THESIS.** A course is a line; a lesson is a stop. This surface navigates by
network diagram and refuses both category defaults: the docs shell with its
sidebar tree and breadcrumb, and the course product with its progress ring,
badge and percentage.

**OWN-WORLD.** A printed signalling diagram on near-black. Strokes at 90° and
45° only, never a curve. Uniform tick pitch along a line. Hollow bone-white
interchange rings, solid capsule termini. Four transit inks — deep red, navy,
forest, amber — one per course, at printed-ink saturation rather than screen
neon.
Archivo in signage caps for every label and heading; Inter for the reading
column alone; JetBrains Mono confined to code and tabular numerals. No cards, no
shadows, no glass, no gradient, no rounded containers.

**STORY.** A stranger lands mid-line from a search result. The position strip
tells them the line, the zone and the stops either side before they decide to
stay. They read one column of prose, then retrieve five answers from memory.

**FIRST VIEWPORT.** The index is the network: every course a line drawn full-bleed, each
tick a real lesson, each line labelled with its course name at the left terminus.
No hero, no card grid, no marketing copy above it. The diagram is the page.

**FORM.** Transit / signalling diagram. Candidate 5 of 7 on the grounded list.
Seed key `b9727618`.

## Colour

Scoped under `.learn-root`. Every value below is a local token defined in
`app/learn/learn.css`; the section does **not** inherit `--primary` from
`app/globals.css`, because it is its own publication.

| Role | Dark | Light | Use |
|---|---|---|---|
| `--ln-llms` | `#C4372F` | `#A82E27` | The LLMs line |
| `--ln-prompt` | `#4A72C4` | `#2B4C8C` | The Prompt Engineering line |
| `--ln-rag` | `#3E8C5E` | `#2E6B47` | The RAG line |
| `--ln-agents` | `#CB881D` | `#AB6F06` | The Agents and Tool Use line |
| `--ln-mark` | `#F2EFE9` | `#12100E` | You-are-here ring, terminus fill |
| `--ln-ground` | `#12100E` | `#F7F5F1` | Page ground |
| `--ln-ink` | `#EDE9E2` | `#191714` | Body text |
| `--ln-ink-quiet` | `#9A948B` | `#6B655C` | Labels, meta, secondary |
| `--ln-rule` | `#2A2725` | `#DDD8D0` | Hairlines, zone divisions |

Strategy: **full palette, four named roles.** Line colour is structural, never
decorative — it appears in the diagram layer, in the lesson's position strip, and
in the one rule under the lesson title. It never colours body text, never fills a
background region, and never appears in the reading column.

**Adding a fifth ink.** A new line colour has to clear three bars, measured, not
argued:

1. **Family.** Chroma inside the range the existing inks already occupy (C\* 32
   to 67 in CIELAB). Lightness is free — a saturated yellow is simply lighter
   than a deep red, and forcing it dark makes mud.
2. **Ground.** At least 3:1 against `--ln-ground` in **both** themes. It carries
   no text — it is a 6px stroke and a 3px `.rule-line` — so 4.5:1 is not the bar,
   but a stroke a reader has to hunt for is a failed line.
3. **Colour blindness.** Simulate protanopia and deuteranopia, then measure ΔE00
   against every existing ink in both themes. The floor is the worst pair already
   shipped: deep red against forest, which sits at 9.2. Anything that scores
   below that is not a fourth colour, it is a fifth name for one of the first
   three. Blue-violet fails this — it collapses into `--ln-prompt`.

Amber cleared all three at ΔE00 ≥ 12.7 in the worst case (deuteranopia, against
deep red, light theme). It is also why the palette will not stretch much further:
the hues that survive a red/green/blue/amber set are close to exhausted, and the
next course may have to earn its identity from the diagram's shape rather than a
new ink.

Dark is the default. The scene decided it: an engineer at a laptop with an editor
open beside this, often at night, and a signalling diagram lives on a dark panel.
Light is a real, tested mode, not a fallback.

## Type

| Role | Face | Notes |
|---|---|---|
| Signage | Archivo 600/700, caps, `letter-spacing: 0.04em` | Every label, heading, line name, zone name. Already loaded in `app/layout.tsx`. |
| Station | Archivo 600, sentence case, `letter-spacing: 0.04em` | The stop names on a diagram, in both variants. |
| Reading | Inter 400/600 | The lesson column only. `65–75ch` measure. |
| Numeric | JetBrains Mono, `font-variant-numeric: tabular-nums` | Stop numbers, minutes, quiz counts, code. Never as texture. |

Archivo replaces JetBrains Mono as the display face. Mono-as-display is the
costume this redesign exists to remove.

Line names and zone names are signage caps; **station names are sentence case**,
because that is what the diagrams this is drawn from do — Oxford Circus, never
OXFORD CIRCUS. It is also the only way a long name fits: caps are wider, and a
browser will not hyphenate uppercased text, so a caps station name in a narrow
column has to break mid-word.

## Diagram primitives

Four shapes, and nothing else may be invented:

- **Line** — a stroke of `--ln-w` (`6px` desktop, `4px` narrow) in the course ink.
- **Tick** — a perpendicular stroke crossing the line at uniform pitch; one per
  lesson. Solid when read, hollow when not.
- **Interchange** — a hollow `--ln-mark` ring where two lines cross. Drawn only
  where a lesson genuinely cross-references another course. Never decorative.
- **Terminus** — a solid capsule cap at each end of a line.

Elbows turn at 45°. Zone divisions are hairline `--ln-rule` verticals with a
signage-caps label, and they belong to one line, not the whole page.

## Layout

- **Never a fixed pixel max-width.** The reading column is
  `min(var(--ln-measure), 100% - 2 * var(--ln-gutter))` with `--ln-gutter:
  clamp(1rem, 5vw, 6rem)`. The diagram runs edge to edge.
- **The reader picks the measure.** `--ln-measure` is `70ch` by default and
  `104ch` when `<html>` carries `data-ln-width="wide"`. Both are character
  counts, so the rule above still holds and a phone still gets the whole
  window either way. The switch is in the rail, the choice is kept in
  `localStorage` under `learn:width:v1`, and a blocking script in the learn
  layout applies it before first paint so the narrow column never flashes.
- **A band is the way out of the column.** Full width, a hairline top and
  bottom spanning the window, and a `.measure` inside so its left edge is
  the h1's to the pixel — never `.bleed`, which adds a gutter of its own and
  insets a nested `.measure` twice. Two exist: the position strip at the head
  of a lesson and the recall quiz. A band has no fill and no tint.
- **The diagram rotates, it does not shrink.** Labels are always horizontal. No
  rotated text at any breakpoint. Which way a line runs depends on which of the
  two diagram surfaces it is on:
  - **The network, on the index.** Horizontal lines with labels below on wide
    screens; below `52rem` the whole network turns vertical — lines running down,
    labels to the right — which is how a platform sign works anyway. Horizontal
    lines stacked, one per course, is the shape that shows the whole system at
    once, and the labels there are titles only. The stack takes however many
    courses exist; nothing in it is sized for a fixed count.
  - **One course's line, on its own page. Vertical at every width.** A syllabus
    is a list, and each stop's label carries a whole sentence of subtitle. Across
    the page those sentences had to be truncated to keep the row level, and a
    subtitle cut to a third is worse than none. Down the page each stop owns a
    row, every sentence is shown in full, and the label column stops at `60ch`
    so the line length stays readable on a wide screen.

## Motion

One authored moment, and it is not an entrance animation: the you-are-here ring
draws itself once on load, `stroke-dashoffset` over 600ms, exponential ease-out.
Nothing else moves except hover and focus, which are instant colour and weight
changes. `prefers-reduced-motion` removes the ring draw entirely and renders the
final state.

No scroll reveals. The previous build staggered every card in on scroll; that is
removed, and `Reveal` is not used in this section.

## Progress

Read lessons are stops behind you on the line — a solid tick instead of a hollow
one, and a count in tabular numerals. There is no percentage, no bar, no ring,
no badge, no streak, no celebration. Stored in `localStorage` under
`learn:progress:v1`; it never leaves the browser.

## Components

`app/learn/_components/` owns the section's vocabulary. Any new element is built
from the four primitives above. A stock card, a shadowed panel or an icon tile
inside this world is a lapse, not a shortcut.

Two additions worth naming:

- **Segmented pair** (`ViewWidth`) — two buttons in the signage voice split by
  one hairline, the setting in force at full `--ln-ink` and the other at
  `--ln-ink-quiet`. No fill, no pill, no radius, no border round the group. It
  is the same read/unread distinction the ticks on a line use.
- **Checkpoint header** — a band's header row: the label on the left, a count in
  tabular numerals on the right (`02 / 05 ANSWERED`), live as it changes.

The line can be walked from either end of a lesson. The stops either side are
real links in the position strip as well as in `PrevNext` at the foot; the two
navs carry distinct `aria-label`s (`Nearby stops`, `Lesson navigation`) so the
same pair of titles is never announced as one undifferentiated list.

## Accessibility

Body and label text meets 4.5:1 in both themes. Line identity is never carried by
colour alone — every line also carries its name in signage caps, and read/unread
ticks differ in fill, not hue. The quiz options are real buttons, operable by
keyboard, with the result in an `aria-live` region and right/wrong marked by a
glyph as well as colour. The diagram is decorative-plus-navigational: its links
carry real text; the SVG itself is `aria-hidden` where a text list beside it
already conveys the same structure.
