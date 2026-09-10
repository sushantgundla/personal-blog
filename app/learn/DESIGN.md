# Design — the learn section

<!-- Scope: everything under app/learn/ and content/learn/. The rest of the
     site (app/(main)/, app/atlas/) keeps its own world; nothing here leaks. -->

## Direction contract

<!-- The index and the pages under it are one publication in three sheets.
     The index is FIG. 1, the general arrangement. A course page is FIG. 2, a
     detail of one part of it at larger scale. A lesson keeps the signalling
     diagram, because a lesson really does have a position on a line. All
     three contracts are below. -->

**THESIS.** The index teaches you the shape of the system before it offers you
anything. It is one drawing of one request — a prompt in, cut into tokens, a
query out to a corpus, retrieved passages joined at the context window, the
model, a loop out to a tool and back, an answer out, a gauge on it — and the
courses are not filed beside that drawing, they are the parts of it. It refuses
the two pages this category always ships: the contents page, a list of courses
with blurbs and a rule between them, and the marketing hero. A course page
carries the same argument one level down: it is FIG. 2, that course's own part
of the machine blown up to fill the sheet, its parts drawn as the bays of the
detail and its lessons scheduled underneath. A lesson is still a stop on a
line. Both surfaces go on refusing the docs shell with its sidebar tree and
the course product with its progress ring, badge and percentage.

**OWN-WORLD.** A draughting plate. A cold blue-graphite sheet laid on the
section's warm near-black hall, bordered twice with the content inset to the
inner frame so that no rule ever crosses it, and ruled into four bands: a title
strip, a gridded drawing field, a legend and a notes band. The drawing is
hand-authored SVG in one graphite, with three line weights that each mean
something. The five course inks are almost absent: five inked callout rings at
rest, and one stage at a time while a reader holds it. Archivo Narrow letters
the whole sheet; Inter is confined to the reading column and the owner's two
note paragraphs; JetBrains Mono to figures and code. A course page is the same
plate at a larger scale: same frame, same bands, same three weights, with a key
plan in the title strip saying where on FIG. 1 the reader is standing. A lesson
keeps the printed signalling diagram: strokes at 90° and 45° only, uniform tick
pitch, a bone-white you-are-here ring, solid capsule termini. No cards, no
shadows, no glass, no gradient, no rounded containers, on any of the three.

**STORY.** Most readers land mid-lesson from a search result; the position
strip tells them the line, the zone and the stops either side before they
decide to stay, they read one column of prose, then retrieve five answers from
memory. The ones who land on the index — peers, recruiters, and anyone
arriving from `sushantgundla.com` — are shown how an LLM application is put
together before they are shown a course. Somebody who reads nothing else
leaves having learned something, which is the argument for reading the rest.

**FIRST VIEWPORT.** The sheet, and nothing else. The title strip runs across
the top: the h1 at the left, `FIG. 1 — ONE REQUEST, END TO END` and the key to
the three line weights in the middle, the quantities hung at the foot of the
right-hand cell. FIG. 1 fills the field beneath it, edge to edge. The legend is
five cells across the foot of the drawing, numbered to the callouts. No hero,
no card grid, no marketing copy anywhere.

**FORM.** Draughting plate / signal-flow diagram, for the index and for a
course. Transit / signalling diagram, for a lesson — candidate 5 of 7 on the
grounded list, seed key `b9727618`.

## The three line weights

Every stroke on FIG. 1 is one of five, and three of them carry meaning. The
title strip states all three, drawn with the same pens, so the notation is
read rather than guessed.

| Class | Weight | Means |
|---|---|---|
| `.flow` | 2.5, solid | The request travels here |
| `.cond` | 2.5, `stroke-dasharray: 10 8` | Only happens if the model calls a tool |
| `.obs` | 2, round caps, `stroke-dasharray: 0.5 7` | Watching. Carries nothing |
| `.thin` | 1.5, solid | Detail: a comb tooth, a query, a converge |
| `.hair` | 0.75 at `--pl-faint` | Texture: the attention chords inside a layer |

A fourth meaning may not be added. Three weights is what a reader will hold,
and each new one devalues the three that are there — the dotted line reads
precisely because there is almost none of it on the sheet.

Two consequences already paid for. A discarded retrieval candidate is drawn at
`--pl-weak` and struck through, **never dashed**, because dashed is already
spoken for. And two true things about a request are stated in words rather
than drawn, because there was no room to draw them without crowding the parts
they are about: that everything joined at the context window is counted in
tokens, and that evals measure retrieval as well as the final answer. Both are
in the legend's role lines, the notes band and the screen-reader description.

## The reveal

The drawing rests in graphite and holds no course colour at all. Hover or
focus either half of a pair — the legend cell, or the part of the machine —
and that stage alone takes its course's ink, the other stages fall to 0.16,
the spine and the other four callouts to 0.5, and the held cell's ink swatch
runs the full width of its cell, rule to rule.

**Why no colour at rest.** On this sheet colour is the answer to a question,
and at rest there is no question. Five inks standing at rest is the network
diagram the index used to be, where the colour was chosen for looks and meant
nothing; here the ink means "this part of the machine is that course", and it
only means that at the moment somebody asks.

**Why the callout rings are inked anyway.** On a touch screen the reveal never
fires, and `PRODUCT.md` says readers are frequently on a phone — so without
the rings, the whole argument of the page is invisible to them. A
`@media (hover: none)` guard cannot fix it: an iPad with a keyboard and a
touchscreen laptop both report `hover: hover`, which is exactly where it would
need to be right. Rings only. The numeral inside each ring stays at
`--pl-line`, because the ink is measured for a 1.25px stroke and not for
14px type.

**How the two halves are correlated.** Both carry the same `data-line` value,
which is also what `learn.css` reads to resolve `--ln-line`; the whole reveal
is one `:has()` rule per course. One attribute does three jobs, and the index
ships no JavaScript of its own.

**One stage, two objects.** Stage 1 is the only stage that is not one thing.
Prompt Engineering owns the inlet manifold *and* the outlet manifold, at
opposite ends of the sheet, so holding it lights both while the machine
between them goes dark. That is deliberate and it is the point: the two
manifolds are the same shape reflected, and making them one course is the
drawing saying **you write this end and you specify that end**.

The output is not the model's. Four of that course's twelve lessons are about
what comes back — `06-output-contracts`, `07-validating-what-comes-back`,
`08-retries-and-fallbacks`, `12-sampling-and-voting` — while the LLMs course
owns only how a token gets chosen, which is generation, and the stack of
layers already carries that. So the shape of the answer is hung on the course
that teaches it.

The arrowheads at both ends stay on the spine, not on stage 1. The spine's job
is the request travelling; a stage owns the object the request travels to.
Stage 1's second object carries no callout ring, because there is one ring per
stage and the ring belongs where the stage starts.

**What is never dimmed.** The legend's reading matter. Fading four blocks of
real prose to light a fifth is hostile, and at the opacity the stages take,
`.role` and `.sub` would fail 4.5:1 in both themes. Only the ink swatch fades
and the ring steps back to `--pl-faint` — the two marks whose whole job is to
point at the drawing.

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
| `--ln-evals` | `#00AAE0` | `#0080AA` | The Evals and Observability line |
| `--ln-mark` | `#F2EFE9` | `#12100E` | You-are-here ring, terminus fill |
| `--ln-ground` | `#12100E` | `#F7F5F1` | Page ground |
| `--ln-ink` | `#EDE9E2` | `#191714` | Body text |
| `--ln-ink-quiet` | `#9A948B` | `#6B655C` | Labels, meta, secondary |
| `--ln-rule` | `#2A2725` | `#DDD8D0` | Hairlines, zone divisions |

Strategy: **full palette, five named roles.** Course colour is structural,
never decorative. It appears in exactly four places: the callout rings on
FIG. 1 and one held stage, the ink swatch and numeral ring in a legend cell,
the callout rings and one held bay on FIG. 2 with its schedule swatch, and the
position strip plus the one rule under a lesson title. It never colours body text, never fills a background region, and
never appears in the reading column.

**The plate's own surface.** The index sheet does not use `--ln-ground`; it is
a separate material laid on it, and its tokens live in
`app/learn/_plate/plate.module.css` rather than in `learn.css`, because
nothing else in the section is a plate.

| Role | Dark | Light | Use |
|---|---|---|---|
| `--pl-sheet` | `#0D1013` | `#E6EAEC` | The sheet. Cold, because the hall is warm |
| `--pl-line` | `#D8DDE1` | `#171A1D` | The drawing, the h1, the reading matter |
| `--pl-quiet` | `#8B959D` | `#4F585F` | Annotation on the drawing, subtitles, figures |
| `--pl-weak` | `#6F7A82` | `#79848B` | A retrieval candidate the reranker dropped |
| `--pl-faint` | `#4E585F` | `#97A1A8` | Attention chords, a stepped-back numeral ring |
| `--pl-frame` | `#1B2126` | `#C3CCD1` | The cut edge |
| `--pl-rule` | `#232A30` | `#C9D2D6` | The inner frame and every band rule |
| `--pl-grid` | 3.5% of `--pl-line` | 5% of `--pl-line` | The field's ruled paper |
| `--pl-spark` | `#FF6B2B` | `#C2410C` | The travelling request. See Motion |

Dark is a blueprint negative and light is a whiteprint — the same cold
drawing, positive instead of negative. Light is deliberately not cream paper.

Measured on that ground, not on `--ln-ground`: `--pl-line` is 13.9:1 dark and
14.7:1 light; `--pl-quiet` 6.2:1 and 5.9:1; `--pl-weak` 4.3:1 and 3.2:1. All
five course inks were re-measured against `--pl-sheet` in both themes and all
five clear the 3:1 a graphic object needs. The worst is `--ln-agents` at
`#AB6F06` on the light sheet, 3.41:1 — fine for a 1.25px ring or a 2.5px
stroke, short of the 4.5:1 a 14px numeral needs. **That is the reason the ink
never letters anything on this sheet**: a held stage takes the ink in its
strokes and steps its annotation up to `--pl-line`, and a callout numeral
stays `--pl-line` inside an inked ring. Making an exception for one ink would
mean re-measuring all five for type, which is a different bar from the one the
sweep below was run at.

**Adding a new ink.** A new line colour has to clear three bars, measured, not
argued:

1. **Family.** Chroma inside the range the existing inks already occupy (C\* 32
   to 67 in CIELAB). Lightness is free — a saturated yellow is simply lighter
   than a deep red, and forcing it dark makes mud.
2. **Ground.** At least 3:1 against `--ln-ground` in **both** themes. It carries
   no text — it is a 6px stroke and a 3px `.rule-line` — so 4.5:1 is not the bar,
   but a stroke a reader has to hunt for is a failed line.
3. **Colour blindness.** Simulate protanopia and deuteranopia (Machado,
   Oliveira & Fitzgibbon 2009, full severity), then measure ΔE00 against every
   existing ink, in the *same* theme, under both simulations. The floor is the
   worst pair already shipped: deep red against forest, light theme, protanopia,
   which sits at 9.2. Anything that scores below that is not a new colour, it is
   a new name for one already on the map.

Amber cleared all three at ΔE00 ≥ 12.7 in the worst case (deuteranopia, against
deep red, light theme), and the note here used to say the palette was close to
exhausted. That was a guess, not a measurement. When Evals and Observability and
Data Pipelines needed lines of their own, the hue wheel got swept properly —
every 5°, both themes, both simulations, gamut-mapped in CIELAB rather than
picked by eye — and the guess was wrong in both directions.

**What the sweep found.** One near-miss worth naming, and two real inks:

- **Hue 190°–240° (true cyan through sky-blue) looked closed and isn't — it's
  the wrong register.** At the lightness a first pass tries (dark theme up to
  L 65, light theme up to L 48, matching where the other five inks live), no
  hue in that band reaches C\* 32. Stretching the search further, it does clear
  all three bars: at L 75 dark / L 58 light it reaches C\* 40–45 with ΔE00 in
  the low-to-mid twenties against every existing ink — the best numbers of any
  hue tested. But L 75 on a 6px stroke is not a printed ink at that saturation,
  it's a screen neon, the exact register this section's OWN-WORLD rule exists
  to keep out, and the light value's contrast sits at a bare 3.0–3.1:1, thinner
  than anything shipped. Rejected on register, not on the numbers — a case
  where the three bars are necessary but not sufficient.
- **Azure (`--ln-evals`)** sits at 245°, just past that band, at lightnesses in
  line with the other five (dark L 65, light L 50): dark `#00AAE0` (C\* 41.2,
  contrast 7.1:1), light `#0080AA` (C\* 33.6, contrast 4.1:1). Its worst ΔE00 is
  14.3 (deuteranopia, against navy, light theme) — 39° of hue from navy, the
  nearest existing line. The light value's chroma margin above the floor (1.6)
  is thinner than the other five, but no thinner than rag's own light value
  already is (C\* 32.2, a 0.2 margin) — a precedent already shipped, not a new
  risk.
- **Rose (`--ln-pipelines`)** sits at 347°, in the 110° gap between navy and
  red: dark `#C02985` (C\* 66.8, contrast 3.5:1), light `#820056` (C\* 55.0,
  contrast 9.3:1). Worst ΔE00 is 11.6 (protanopia, against navy, light theme),
  47° of hue from red, the nearest existing line. Its dark contrast, 3.5:1, is
  the same margin deep red's own dark value already carries (3.6:1).
- The two new inks read apart from each other too: worst ΔE00 between them is
  20.0 (deuteranopia, dark theme) — over double the floor.
- The apparent hole between navy and red (280°–360°, blue-violet through
  magenta) is mostly not a hole: most of it clears all three bars. It is
  excluded anyway wherever the candidate hue sits within about 35° of navy or
  red's own hue, even when a lightness gap alone pushes its ΔE00 over the
  floor — a paler or darker version of an existing line is a shade of that
  line, not a new one, whatever the number says.
- Rose was measured, shipped as `--ln-pipelines`, and withdrawn when the Data
  Pipelines course it coloured was pulled — not because it failed any bar
  above. The measurement stands; there is simply no line using it now. Redo
  the sweep before reusing 347° for a new course rather than assuming the
  numbers above still describe an empty slot.

Six is not a wall either. The sweep found the 250°–320° run and the 335°–360°
run both clear all three bars almost end to end — azure and rose used one hue
apiece out of each, not the whole run — and the 190°–240° band is a register
choice away from opening too. But the next ink still needs its own sweep, not
an inherited guess about what's left.

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
| Plate | Archivo Narrow 400/500/700 | The whole index sheet: the h1, every label on FIG. 1, the legend's reading matter. Loaded by `app/learn/_plate/font.ts`. |

Archivo replaces JetBrains Mono as the display face. Mono-as-display is the
costume this redesign exists to remove.

**Archivo Narrow, and why the index does not use Inter.** A drawing is
annotated, not typeset: a label has to sit inside a leader callout or between
two parts forty units apart, and it must not push the drawing around to fit.
Draughting lettering has always been a condensed single-stroke gothic for that
reason. Archivo Narrow is the narrow cut of the section's own signage face, so
the plate reads as the same publication's drawing office rather than as a
different site. It letters everything on the sheet, including the legend's
role lines and subtitles — everything inside a drawing office is lettered by
the drawing office. Inter appears on the index in exactly one place: the two
note paragraphs at the foot, which are the owner's prose and not the sheet's
own writing. Being condensed, Archivo Narrow runs one size up from where Inter
would sit for the same reading weight.

Line names and zone names are signage caps; **station names are sentence case**,
because that is what the diagrams this is drawn from do — Oxford Circus, never
OXFORD CIRCUS. It is also the only way a long name fits: caps are wider, and a
browser will not hyphenate uppercased text, so a caps station name in a narrow
column has to break mid-word.

## The plate's vocabulary — the index

Seven parts, and nothing else may be invented. They live in
`app/learn/_plate/`.

- **The sheet** — a cut edge (`--pl-frame`), an inner frame (`--pl-rule`) at
  `--pl-inset`, and the content padded by exactly that same inset so every
  band rule terminates on the inner frame. **Nothing crosses a drawing
  border.** That one rule is why the inset is a token rather than a number.
- **The title strip** — three ruled cells: the h1 and one line saying what the
  drawing is; the figure number and the key to the three line weights; the
  quantities, hung at the foot of the cell because in a title block the
  numbers are the second largest thing on the sheet.
- **The field** — the drawing on ruled paper. The grid is a CSS
  `repeating-linear-gradient` on `.drawing` at 3.5%, a texture and never a
  layout; nothing snaps to it.
- **The line weights** — the five above. Three carry meaning, two are drawing.
- **The callout** — a ring in the course ink, a leader, a dot on the part it
  names, and a numeral in `--pl-line`. One per stage, and the same number
  heads that stage's legend cell. A callout with no course is not a callout.
- **The legend cell** — an ink swatch flush to the rule at its left, a numeral
  ring, the part's name, one line saying what that part does, the course as a
  link, its subtitle, and its figures at the foot. No fill, no radius, no box:
  five cells split by the sheet's own hairline, not five cards.
- **The notes band** — a label and the prose, under a rule at the foot, where
  a sheet carries its notes.

What may not be invented, on top of the fourth line weight already ruled out:
a shape whose meaning is not a real part of a real request; a figure nobody
summed from `content/learn/`; and a legend cell that claims to be a stage
without a number on the drawing.

**The drawing is authored twice.** A wide machine does not reflow, so
`MachineWide.tsx` (1600 × 680, the request running left to right) and
`MachineNarrow.tsx` (360 × 1060, running top to bottom) are two hand-authored
drawings, not one scaled. The narrow one drops every fine annotation and keeps
the five callouts, because at 360px the words crowd the parts they point at.
Both are `aria-hidden`; the ordered description in `page.tsx` is what carries
the structure instead.

## The detail sheet — a course page

FIG. 2. The same plate as the index, at a larger scale, showing one part of
the machine. It lives in `app/learn/_sheet/`.

- **The bay** — the objects on the drawing belonging to one part of the
  course, carrying `data-zone` with that part's own number off disk. FIG. 1's
  stages are five courses; a detail's bays are one course's parts, so the same
  `:has()` reveal works one level down. Hold a bay or its schedule column and
  that part alone takes the course ink.
- **The callout** — one numbered ring per bay, inked at rest for the same
  touch-screen reason FIG. 1's are, and the same numeral heads that part's
  schedule column. A callout with no part behind it is not drawn.
- **The schedule** — one column per part, ruled at the head with the ink
  swatch sitting on that rule like a tab, and one row per lesson: a read mark,
  the stop number, the title, the minutes, the subtitle in full. This is the
  answer to a long course. Seventeen callouts on one drawing is a mess; four
  callouts with a schedule under each is a drawing, and the parts bound the
  column height for free, because a part is never the whole course.
- **The key plan** — FIG. 1 reduced to its bones at `--pl-faint` with this
  course's own part boxed in its ink, in the title strip, linking back. A real
  detail sheet carries one so the reader can see where they are standing. It
  is a reduction and not a copy: the annotation, the lattice and the sparks do
  not survive at 320 units, and what has to survive is the order of the parts.

**More of the subject, not the same amount bigger.** That is what a detail at
larger scale means on a real plate. FIG. 1 carries fifteen labelled features
across the whole machine; each detail carries fourteen to twenty across one
part of it, and every one is chosen by reading that course's lesson titles and
subtitles in `content/learn/<slug>/` — a reader who has taken the course
should recognise its contents in the drawing.

**What may not be invented here**, on top of everything FIG. 1 already rules
out: a feature the course does not teach; a fourth line weight; a schedule
column that claims a bay it has no ring on. A course whose parts have outrun
the drawing gets a column with no ring and the words `Not on the detail`, and
a course with no detail drawn at all gets the schedule alone and says so —
the same visible failure `buildStages()` uses on the index.

**The layout is a stack, and that is load-bearing.** The drawing runs the full
width at the top of the field and the schedule's columns hang beneath it. An
earlier build split the field into two columns above 100rem, drawing left and
schedule right; on RAG's seventeen lessons the schedule made the row tall, the
drawing's column stretched to match it, and the drawing sat centred with the
top of the field showing nothing but bare grid. Grid rows size to their
content, so a stack cannot do that at any lesson count. The drawing's height
is capped so the whole of it stays above the fold at 1440 x 800, and every
drawing is authored between 2.5:1 and 2.9:1 so the margin of bare grid either
side of a capped drawing stays narrower than the drawing it frames.

**One column per part, and never a written number.** The schedule is
`repeat(auto-fit, minmax(min(13rem, 100%), 1fr))`, so three parts give three
columns and five give five wherever there is room for five. `repeat(var(--n),
…)` is not valid CSS — `repeat()` takes an integer, and a custom property in
that slot makes the whole declaration invalid.

## Diagram primitives — a lesson

Four shapes, and nothing else may be invented. They live in
`app/learn/_components/Position.tsx`.

- **Line** — a stroke of `--ln-w` (`6px` desktop, `4px` narrow) in the course ink.
- **Tick** — a perpendicular stroke crossing the line at uniform pitch; one per
  lesson. Solid when read, hollow when not.
- **You-are-here ring** — a hollow `--ln-mark` ring on the tick for the lesson
  being read. The one mark on the strip that is not uniform.
- **Terminus** — a solid capsule cap at each end of a line.

Elbows turn at 45°. Zone divisions are hairline `--ln-rule` verticals with a
signage-caps label, and they belong to one line, not the whole page.

## Layout

- **Never a fixed pixel max-width.** The reading column is
  `min(var(--ln-measure), 100% - 2 * var(--ln-gutter))` with `--ln-gutter:
  clamp(1rem, 5vw, 6rem)`. The index and course sheets take that same gutter
  as padding and run the full window inside it. Grey bars either side of the
  content are a defect in this project, on every surface.
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
- **The index has no reading column.** The plate runs the full window with the
  same `--ln-gutter`, and the reader's NARROW/WIDE switch in the rail has no
  effect there. That is correct rather than a gap: the switch governs a column
  of prose, and the index has none. It still governs a lesson.
- **The drawing rotates, it does not shrink.** Labels are always horizontal;
  no rotated text at any breakpoint. Which drawing is shown, and how far it is
  allowed to grow:
  - **FIG. 1, on the index.** `MachineWide` above `62rem`, `MachineNarrow`
    below `61.9375rem` — the two queries must not both match at `992px`, or
    the strip goes multi-column while the wide drawing is already hidden. The
    wide plate is height-capped at `clamp(24rem, 72vh, 44rem)` so a 2500px
    window does not turn it into a metre of diagram with the legend off
    screen; the narrow one is width-capped at `26rem` and centred, because
    100% of a 991px window renders a 360 × 1060 drawing at about 852 × 2509.
    Both caps are on the drawing. **Neither is ever on the sheet**, which runs
    the full window at every size.
  - **FIG. 2, on a course page.** The sheet runs the full window; only the
    drawing has a ceiling, `clamp(15rem, 45vh, 32rem)`, which is what keeps
    the whole of it above the fold at 1440 x 800 under the rail, the page's
    own top padding and the title strip. Below `62rem` the drawing is not
    shown at all — a 1200-unit detail rendered into a 320px column letters its
    annotation at about five pixels, and a detail whose annotation cannot be
    read is a smudge rather than a detail. The phone gets the key plan, which
    is one shape and survives the reduction, and the drawing's own content in
    words in its place. The schedule falls to one column and every lesson
    keeps its subtitle in full.

## Motion

One authored moment per surface, and neither is an entrance animation.

**The index: one request runs the machine, once.** Three sparks in
`--pl-spark` travel three paths on load — the axis, the retrieval feed and the
tool loop — timed against each other so the retrieved passages reach the
context window as the request does and the tool result comes back after the
model has run, and the gauge needle settles on its reading as the last beat of
the same event. Then it is over and nothing moves again. Each path carries
`pathLength="1"`, so the dash arithmetic is in fractions of the path and two
keyframes drive paths of very different lengths; the gap is longer than the
path, so exactly one spark is ever on a line and the resting offset leaves
none.

`--pl-spark` is the sheet's only warm value, and it is fair to ask what
question it answers when the rule is that colour answers a question. It
answers "which of these lines is the request, right now" — the one question a
still drawing cannot. It is deliberately off the ink ramp: it is `--primary`
from `app/globals.css`, the site's own accent, chosen partly so a travelling
spark can never be mistaken for `--ln-agents` amber lighting up.

**A course: one request runs the detail, once.** The same event FIG. 1 opens
with, at the scale of one part: a single spark in `--pl-spark` travels the path
through that course's own machinery on load, a dial settles as the last beat
where the drawing has one, and then nothing moves again.

**A lesson: the you-are-here ring** draws itself once on load,
`stroke-dashoffset` over 600ms, exponential ease-out.

Everything else is hover and focus. On the index those are 200ms fades on
opacity, `stroke`, `fill` and `border-color`, so the ink and the dimming
arrive together; elsewhere they are instant colour and weight changes.

`prefers-reduced-motion` removes the sparks with `display: none` rather than
shortening them — the section-wide block in `learn.css` sets every animation
to `0.01ms`, which would fire a spark as a one-frame flash — puts the needle
at its reading, drops every transition, and renders the ring fully drawn.

No scroll reveals. The previous build staggered every card in on scroll; that is
removed, and `Reveal` is not used in this section.

## Progress

Read lessons are stops behind you on the line — a solid tick instead of a hollow
one, and a count in tabular numerals. There is no percentage, no bar, no ring,
no badge, no streak, no celebration. Stored in `localStorage` under
`learn:progress:v1`; it never leaves the browser.

## Components

Two folders, because there are two surfaces.

- `app/learn/_plate/` owns the index and nothing else: `MachineWide.tsx`,
  `MachineNarrow.tsx`, `stages.ts`, `font.ts`, and one `plate.module.css` that
  all three import. The stylesheet is single because the reveal is a `:has()`
  rule that has to name a class on the page shell and a class inside the SVG
  in the same selector; split across two modules those would be two different
  hashed names.
- `app/learn/_sheet/` owns a course page and nothing else: `details.tsx` with
  the five drawings, `KeyPlan.tsx`, `Schedule.tsx`, `parts.ts`, and one
  `sheet.module.css` they all import — single for the same reason
  `plate.module.css` is. It restates the plate's five weights rather than
  importing them, so a change to a course page can never reach into the index
  by accident.
- `app/learn/_components/` owns a lesson. Any new element there is built from
  the four primitives above. A stock card, a shadowed panel or an icon tile
  inside this world is a lapse, not a shortcut.

**A sixth course must not vanish.** `stages.ts` maps five course slugs to the
five parts of FIG. 1; this site has added a course twice this year and
`app/learn/research/` holds more proposals. `buildStages()` appends any course
the drawing does not cover as an entry with no number, the legend renders it
with no callout and the words `Not on the drawing`, and the strip's count of
parts is derived from the mapped stages rather than written — so nothing on
the page can say five parts while showing six courses. That is a visible
prompt to redraw FIG. 1, which is the correct failure.

**Nothing on either surface writes a number.** Every figure — lesson counts,
minutes, the per-lesson range, the totals — is summed or measured from the
lessons' own frontmatter at build time.

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

Body and label text meets 4.5:1 in both themes, on both grounds; the measured
values are in Colour. Course identity is never carried by colour alone — a
line carries its name in signage caps, a stage on FIG. 1 carries a numbered
callout that the legend repeats, and read/unread ticks differ in fill, not
hue. The quiz options are real buttons, operable by keyboard, with the result
in an `aria-live` region and right/wrong marked by a glyph as well as colour.

On the index:

- Both drawings are `aria-hidden`. The equivalent is an ordered description in
  `page.tsx`, off screen but never `display: none`, and it has to carry
  everything the drawing carries **in the same order** — including the two
  facts the drawing states in words rather than lines. When FIG. 1 changes,
  that list changes with it.
- The reveal fires from the keyboard as well as the pointer: the `:has()`
  rules match `:is(:hover, :focus-visible)`, so tabbing the legend walks the
  machine.
- The whole legend cell is the target, via `::after { position: absolute;
  inset: 0 }` on the link. **The drawing itself is not clickable** — an SVG
  `<a>` would bypass the router and reload the page — so the hover highlight
  on a part of the machine is a highlight and nothing more, and every way into
  a course is a cell-sized target in the legend.
- The legend is `role="list"` with a visually hidden `<h2>`, because
  `list-style: none` costs the list its semantics in Safari and there was no
  heading between the h1 and the notes.

On a course page FIG. 2 is `aria-hidden`, and the equivalent is an ordered
description of the drawing — off screen where the drawing is shown, and shown
in the drawing's place below `62rem`. One node with two treatments, rather than
two copies that can drift. Every way into a lesson is a row-sized link in the
schedule, with the minutes and the read state in its accessible name, because
the mark and the numeral beside the title are `aria-hidden`. Read and unread
differ in fill, not hue.

On a lesson the diagram is decorative-plus-navigational: its links carry real
text; the SVG itself is `aria-hidden` where a text list beside it already
conveys the same structure.

## Arguments already had

Recorded so nobody re-derives them. Each of these was proposed, argued and
lost on a reason, not on taste.

- **Move the tokeniser comb after the junction**, so that retrieved text and
  tool results are visibly counted in tokens. Killed on arithmetic: the
  junction-to-model run is 96 units wide and the comb is 182, and moving it
  would empty the run the reader's eye starts on. The fact is in the notes
  band instead.
- **Draw a bracket around the context window** to show that it has a size and
  that the output is counted inside it. Withdrawn by its own author; the fact
  is in the notes band and the screen-reader list.
- **A second dotted tap, on the tool loop.** Rejected: the dotted weight reads
  precisely because there is almost none of it.
- **A third dotted tap, from the retrieval line down to the dial**, so that
  evals visibly measure retrieval and not only the final answer. Traced and
  declined: every route either crosses the reranker fan, passes through a
  callout, or costs about 840 units of dotted line across the foot of the
  sheet — five times the dotted ink now on it. Carried by stage 5's role line,
  the notes band and the screen-reader list.
- **Rebuild the field's grid inside the SVG** so it lines up with the drawing.
  Killed on wide-window behaviour: the SVG grid stops at the drawing's edge
  and leaves the field around it visibly ungridded, which is worse than a CSS
  grid that does not align with anything. The grid stays on `.drawing`.
- **Ink the whole machine at rest on a touch device.** Rejected: five inks at
  rest is the network diagram this drawing replaced. Rings only.
- **Relabel `Top-k` and `Trace` in plain English.** Rejected: they are the
  exact names the reader will meet in someone else's code and in
  `content/learn/rag/12-reranking.mdx` and
  `content/learn/evals/10-tracing-a-run.mdx`, and "watching" is already the
  key's word for the dotted weight. The gloss lives in the legend's role lines
  instead, where there is room for a sentence.
- **Weight the legend columns** so the bigger courses get more room. Rejected:
  five equal columns; weighting would claim a ranking the page does not have.

- **Every lesson as a callout on FIG. 2.** The literal reading of the detail
  ideology, and it does not survive contact with RAG: seventeen numbered rings
  on one drawing is a cluttered mess, and shrinking the type to fit is not a
  solution. The parts are the lever — bays and callouts for the parts, a
  schedule for the lessons.
- **Dashing the retry, the second search, and the re-test after a model swap.**
  All three are conditional, and dashed is the obvious pen. Rejected: dashed
  already means "only if the model calls a tool", and a fourth meaning may not
  be added. They are drawn at the detail weight and named in words, which is
  the same trade the struck-out retrieval candidate already pays.

`Line.tsx`, `Line.module.css` and `line-data.ts` are gone. They drew the old
course page, nothing else imported them, and the `variant="network"` branch
that had been kept alive inside them went with the file.
