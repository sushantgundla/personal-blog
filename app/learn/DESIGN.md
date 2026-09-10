# Design — the learn section

<!-- Scope: everything under app/learn/ and content/learn/. The rest of the
     site (app/(main)/, app/atlas/) keeps its own world; nothing here leaks. -->

## Direction contract

<!-- The index and the pages under it are one publication. The index is
     FIG. 1, the general arrangement. A course page is FIG. 2, a detail of
     one part of it at larger scale. A lesson carries no drawing at all —
     it is a printed spread, set on the plate's own sheet. All three
     contracts are below. -->

**THESIS.** The index teaches you the shape of the system before it offers you
anything. It is one drawing of one request — a prompt in, cut into tokens, a
query out to a corpus, retrieved passages joined at the context window, the
model, a loop out to a tool and back, an answer out, a gauge on it — and the
courses are not filed beside that drawing, they are the parts of it. It refuses
the two pages this category always ships: the contents page, a list of courses
with blurbs and a rule between them, and the marketing hero. A course page
carries the same argument one level down: it is FIG. 2, that course's own part
of the machine blown up to fill the sheet, its parts drawn as the bays of the
detail and its lessons scheduled underneath. A lesson draws nothing: the
drawings belong where they can be read at size, and a lesson states in a
kicker and two figures what a diagram of it would have said. It is a magazine
feature rather than a documentation page — one spread, a display serif, real
air — printed on the same sheet the index is drawn on. Both surfaces go on
refusing the docs shell with its sidebar tree and the course product with its
progress ring, badge and percentage.

**OWN-WORLD.** A draughting plate. A cold blue-graphite sheet laid on the
section's warm near-black hall, bordered twice with the content inset to the
inner frame so that no rule ever crosses it, and ruled into four bands: a title
strip, a gridded drawing field, a legend and a notes band. The drawing is
hand-authored SVG in one graphite, with three line weights that each mean
something. The five course inks are almost absent: five inked callout rings at
rest, and one stage at a time while a reader holds it. Archivo Narrow letters
the whole sheet; the owner's two note paragraphs are Inter; JetBrains Mono is
for figures and code. A course page is the same plate at a larger scale: same
frame, same bands, same three weights, with a key plan in the title strip
saying where on FIG. 1 the reader is standing. A lesson is the same sheet with
no drawing on it and its own lettering: Bodoni Moda over Newsreader, one
spread, hairline rules, and the course's ink drawn heavy in four bands and
nowhere else. No cards, no shadows, no glass, no gradient, no rounded
containers, on any of the three.

**STORY.** Most readers land mid-lesson from a search result; the title block
tells them the course, the part, how far through and how long before they
decide to stay, they read one column of prose, then retrieve five answers
from memory. The ones who land on the index — peers, recruiters, and anyone
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
course. For a lesson: a printed spread on the plate's sheet — display serif,
hairline rules, one column of reading with tables and code running wider than
it.

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
and at rest there is no question. Five inks standing at rest is the flat colour chart
the index used to be, where the colour was chosen for looks and meant
nothing; here the ink means "this part of the machine is that course", and it
only means that at the moment somebody asks.

**Why the callout rings are inked anyway.** On a touch screen the reveal never
fires — the hover rules are scoped to `(hover: hover) and (pointer: fine)`,
see below — and `PRODUCT.md` says readers are frequently on a phone, so
without the rings the whole argument of the page is invisible to them. The
same media query cannot be used the other way round, to ink the rings only
where there is no reveal: an iPad with a keyboard and a touchscreen laptop
both report `hover: hover`, and neither says whether the reader is using the
pointer or the glass right now. It is safe for deciding whether a hover style
applies; it is not safe for deciding what a reader has already been shown.
Rings only, everywhere. The numeral inside each ring stays at `--pl-line`,
because the ink is measured for a 1.25px stroke and not for 14px type.

**Hover is scoped, focus is not.** Every hover-driven rule on both sheets sits
inside `@media (hover: hover) and (pointer: fine)`, and every focus-driven one
is unconditional. They are written out twice rather than paired in one
`:is(:hover, :focus-visible)` list, and they may not be folded back together:
a touch browser synthesises hover on the first tap, so an unscoped reveal
spends that tap lighting the part instead of opening the course, and the
reader has to tap twice. The two conditions are also not the same set of
devices — a phone with a Bluetooth keyboard has focus and no fine pointer.
That covers the plate, the detail sheet's own reveal, and every `:hover` that
sits on a link.

**How the two halves are correlated.** Both carry the same `data-course` value,
which is also what `learn.css` reads to resolve `--ln-course`; the whole reveal
is one `:has()` rule per course. One attribute does three jobs, and the index
ships no JavaScript of its own.

**Focus, and the ring it draws.** Every part of the machine is a link into
its course, so a keyboard reaches the drawing and not only the legend. The
anchor carries the same `data-course` as the group it is in — a `:has()` rule
matches the element that has focus, and that is the anchor — so tabbing onto
a part lights it exactly as hovering it does. The focus ring is that part's
own hit rect, stroked graphite at 1.5: a box ruled round a detail, which is
what a drawing office does. Not a `outline` (WebKit does not paint one on an
SVG element at all) and not a rounded glow. 1.5 is the thin weight already on
the sheet; a focus ring may not introduce a fourth.

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
is the request running; a stage owns the object the request runs to.
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
| `--ln-llms` | `#C4372F` | `#A82E27` | The LLMs course |
| `--ln-prompt` | `#4A72C4` | `#2B4C8C` | The Prompt Engineering course |
| `--ln-rag` | `#3E8C5E` | `#2E6B47` | The RAG course |
| `--ln-agents` | `#CB881D` | `#AB6F06` | The Agents and Tool Use course |
| `--ln-evals` | `#00AAE0` | `#0080AA` | The Evals and Observability course |
| `--ln-mark` | `#F2EFE9` | `#12100E` | Focus rings, read marks, the brightest ink |
| `--ln-ground` | `#12100E` | `#F7F5F1` | Page ground |
| `--ln-ink` | `#EDE9E2` | `#191714` | Body text |
| `--ln-ink-quiet` | `#9A948B` | `#6B655C` | Labels, meta, secondary |
| `--ln-rule` | `#2A2725` | `#DDD8D0` | Hairlines, band and column divisions |

Strategy: **full palette, five named roles.** Course colour is structural,
never decorative. It appears in exactly four places: the callout rings on
FIG. 1 and one held stage, the ink swatch and numeral ring in a legend cell,
the callout rings and one held bay on FIG. 2 with its schedule swatch, and the
four heavy rules that band a lesson. It never colours body text, never fills a
background region, and never appears in the reading column.

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
| `--pl-spark` | `#FF6B2B` | `#C2410C` | The request on the move. See Motion |

Dark is a blueprint negative and light is a whiteprint — the same cold
drawing, positive instead of negative. Light is deliberately not cream paper.

**A lesson is on that sheet too, not on the hall floor.** This is the whole
reason a lesson looks like it belongs to the index. It does not use the
`--ln-*` grounds: `app/learn/_lesson/lesson.module.css` copies the plate's
palette value for value — `--pl-sheet` becomes `--lm-sheet`, `--pl-line`
becomes `--lm-line`, `--pl-quiet`, `--pl-weak`, `--pl-faint`, `--pl-rule` and
`--pl-spark` all follow, in both themes. No hex on a lesson is invented, and
walking index → course → lesson never changes worlds. What a lesson still
takes from `learn.css` is the six things that make it the same publication:
`--ln-course`, `--ln-measure`, `--ln-stroke`, `--ln-num`, `--ln-ease` and
`--ln-mark`.

**Two accents on a lesson, one job each.**

- **`--ln-course` names the course and letters nothing.** It is drawn at
  `--ln-stroke` and at no other weight, in four bands and no fifth: across the
  top of the sheet, closing the title block, opening every numbered section of
  the body, and opening the recall band. It never touches text, never fills
  anything, and never appears in the reading column. Measured on `--pl-sheet`
  the five inks run 3.46:1 to 7.11:1 across both themes — above the 3:1 a
  graphic object needs, below the 4.5:1 type would need, which is the same
  reason they letter nothing on the index.
- **`--pl-spark` marks the way through.** It is the numeral on a section head
  and the underline under a link, and nothing else on a lesson is warm. It is
  deliberately kept off every small numeral: 4.28:1 on the light sheet is a
  3:1 mark, not a body-size one. A section numeral is large text and an
  underline is a graphic mark, so both sit above their bar.

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

**Adding a new ink.** A new course colour has to clear three bars, measured,
not argued:

1. **Family.** Chroma inside the range the existing inks already occupy (C\* 32
   to 67 in CIELAB). Lightness is free — a saturated yellow is simply lighter
   than a deep red, and forcing it dark makes mud.
2. **Ground.** At least 3:1 against `--ln-ground` in **both** themes, and
   against `--pl-sheet` too, since that is the ground a lesson and both
   drawings actually sit on. It carries no text — the widest it is ever set is
   the 6px `--ln-stroke` band on a lesson, and on a drawing it is a 2.5-unit
   stroke or a 1.25-unit callout ring — so 4.5:1 is not the bar, but a stroke a
   reader has to hunt for is a failed ink.
3. **Colour blindness.** Simulate protanopia and deuteranopia (Machado,
   Oliveira & Fitzgibbon 2009, full severity), then measure ΔE00 against every
   existing ink, in the *same* theme, under both simulations. The floor is the
   worst pair already shipped: deep red against forest, light theme, protanopia,
   which sits at 9.2. Anything that scores below that is not a new colour, it is
   a new name for one already in the set.

Amber cleared all three at ΔE00 ≥ 12.7 in the worst case (deuteranopia, against
deep red, light theme), and the note here used to say the palette was close to
exhausted. That was a guess, not a measurement. When Evals and Observability and
Data Pipelines needed inks of their own, the hue wheel got swept properly —
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
  nearest existing ink. The light value's chroma margin above the floor (1.6)
  is thinner than the other five, but no thinner than rag's own light value
  already is (C\* 32.2, a 0.2 margin) — a precedent already shipped, not a new
  risk.
- **Rose (`--ln-pipelines`)** sits at 347°, in the 110° gap between navy and
  red: dark `#C02985` (C\* 66.8, contrast 3.5:1), light `#820056` (C\* 55.0,
  contrast 9.3:1). Worst ΔE00 is 11.6 (protanopia, against navy, light theme),
  47° of hue from red, the nearest existing ink. Its dark contrast, 3.5:1, is
  the same margin deep red's own dark value already carries (3.6:1).
- The two new inks read apart from each other too: worst ΔE00 between them is
  20.0 (deuteranopia, dark theme) — over double the floor.
- The apparent hole between navy and red (280°–360°, blue-violet through
  magenta) is mostly not a hole: most of it clears all three bars. It is
  excluded anyway wherever the candidate hue sits within about 35° of navy or
  red's own hue, even when a lightness gap alone pushes its ΔE00 over the
  floor — a paler or darker version of an existing ink is a shade of that
  ink, not a new one, whatever the number says.
- Rose was measured, shipped as `--ln-pipelines`, and withdrawn when the Data
  Pipelines course it coloured was pulled — not because it failed any bar
  above. The measurement stands; there is simply no course using it now. Redo
  the sweep before reusing 347° for a new course rather than assuming the
  numbers above still describe an empty slot.

Five is not a wall either — and five is what `learn.css` defines today:
`--ln-llms`, `--ln-prompt`, `--ln-rag`, `--ln-agents`, `--ln-evals`. The sweep
found the 250°–320° run and the 335°–360° run both clear all three bars almost
end to end — azure took one hue out of the first and rose, since withdrawn,
one out of the second, neither of them the whole run — and the 190°–240° band
is a register choice away from opening too. But the next ink still needs its
own sweep, not an inherited guess about what's left.

Dark is the default. The scene decided it: an engineer at a laptop with an editor
open beside this, often at night, and a blueprint negative is what a drawing looks
like on a dark screen. Light is a real, tested mode, not a fallback.

## Type

Five faces, and each one belongs to a surface. The index and a course sheet
are lettered by the drawing office; a lesson is typeset.

| Role | Face | Where |
|---|---|---|
| Plate | Archivo Narrow 400/500/700 | The index and every course sheet, whole: the h1, every label on FIG. 1 and FIG. 2, the legend, the key plan, the schedule. Loaded by `app/learn/_plate/font.ts`. |
| Signage | Archivo 600/700, caps, `letter-spacing: 0.04em` | The section's chrome and its 404 — `.sign`, `.sign-quiet`, `.learn-h1` in `learn.css`. Loaded in `app/layout.tsx`. |
| Lesson display | Bodoni Moda 400/500, `opsz` axis, roman and italic | A lesson only: the h1, the standfirst, the section heads and their numerals, a takeaway lifted as a pull quote, a neighbour's title in the pager. Loaded by `app/learn/_lesson/font.ts` as `--lm-display`. |
| Lesson reading | Newsreader 400/600, `opsz` axis, roman and italic | A lesson's reading column and everything set as a sentence on it. Same file, as `--lm-reading`. |
| Numeric | JetBrains Mono, `font-variant-numeric: tabular-nums` | Every figure in the section, on all three surfaces — lesson numbers, minutes, quantities, hosts, code. Never as texture. |

Inter is still the section's fallback reading face, in `--ln-read`, but nothing
sets a paragraph in it any more except the owner's two note paragraphs at the
foot of the index. Archivo replaced JetBrains Mono as the display face for the
chrome and the sheets; mono-as-display was the costume this redesign existed
to remove, and a lesson removes it a second way, by setting its headline in a
face drawn for headlines.

**Why a lesson is not lettered like a drawing.** Archivo Narrow annotates. It
is condensed, single-stroke and built to sit inside a leader callout without
pushing the drawing around — which is exactly wrong for eight hundred words of
prose. A lesson is the one surface in the section that is read rather than
looked at, so it gets a real display face and a real text face: Bodoni Moda,
a modern with the thick-to-thin contrast turned all the way up, so a headline
at 96px looks set rather than scaled; Newsreader under it, low contrast, open
counters, a large x-height. Both carry an optical-size axis, so a section head
gets a sturdier cut than a 96px title and a 20px paragraph gets the cut drawn
for 20px — the same thing a foundry did with separate display and text sizes. That axis matters more on a dark ground than it did on paper: a hairline
reversed out of near-black optically thins further, and the smaller optical
sizes are the correction. Both faces are loaded with real italics, because the
pull quote and the section numeral need them and a browser-synthesised oblique
is the exact tell this page cannot afford.

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

Course names and part names are signage caps; **lesson titles are sentence
case** everywhere — as a label on a schedule row, and as the h1 on the lesson
itself, where the display serif sets them. Caps are for the short fixed words
of the furniture, and a lesson title is a sentence. It
is also the only way a long title fits: caps are wider, and a browser will not
hyphenate uppercased text, so a title in caps in a narrow column has to break
mid-word.

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
Every mark on both is `aria-hidden` and the ordered description in `page.tsx`
carries the structure instead; the only things in either plate a screen reader
meets are its five stage links.

**Every part of the machine is a door.** The five stages are links into the
five courses: `Stage.tsx` wraps each part's geometry in a `next/link` and
carries its accessible name, so the wrapper and the label are written once and
both plates stay the same object. The link wraps the whole part rather than
only the invisible hit rects — a reader clicking the corpus or a layer is
clicking the part, and it would be a strange machine whose gaps were the doors
and whose lines were not. The geometry stays hand-authored in the two
drawings; the href and the name are read off `content/learn/` like every other
figure on this sheet, and the href is always `/learn/<slug>` because
`middleware.ts` is what knows which host the page is being read on. A part
whose course has gone is drawn and not clickable — `buildStages()` has already
dropped it, so the lookup misses.

## The detail sheet — a course page

FIG. 2. The same plate as the index, at a larger scale, showing one part of
the machine. It lives in `app/learn/_sheet/`.

- **The bay** — the objects on the drawing belonging to one part of the
  course, carrying `data-part` with that part's own number off disk. FIG. 1's
  stages are five courses; a detail's bays are one course's parts, so the same
  `:has()` reveal works one level down. Hold a bay or its schedule column and
  that part alone takes the course ink.
- **The door** — every bay is also a link, into the first lesson of the part
  it draws, exactly as every part of FIG. 1 is a link into its course. A bay
  is a part and a part is several lessons, so there is no one lesson a bay
  *is*; the first in reading order is where a reader who clicked that part was
  going to start anyway. `Bay` in `details.tsx` owns the link, the hit rects
  and the accessible name for all five drawings, and `partDoor()` in
  `parts.ts` is the one place either the href or the name is written — the
  five details are pictures, and nothing in them knows an address. At rest the
  door paints nothing: the cursor and the focus box are the whole of it.
- **The callout** — one numbered ring per bay, inked at rest for the same
  touch-screen reason FIG. 1's are, and the same numeral heads that part's
  schedule column. A callout with no part behind it is not drawn.
- **The schedule** — one column per part, ruled at the head with the ink
  swatch sitting on that rule like a tab, and one row per lesson: a read mark,
  the lesson number, the title, the minutes, the subtitle in full. This is the
  answer to a long course. Seventeen callouts on one drawing is a mess; four
  callouts with a schedule under each is a drawing, and the parts bound the
  column height for free, because a part is never the whole course.
- **The key plan** — FIG. 1 reduced to its bones at `--pl-faint` with this
  course's own part boxed in its ink, in the title strip, linking back. A real
  detail sheet carries one so the reader can see where they are standing. It
  is a reduction and not a copy: the annotation, the lattice and the sparks do
  not survive at 320 units, and what has to survive is the order of the parts.

**More of the subject, not the same amount bigger.** That is what a detail at
larger scale means on a real plate. FIG. 1 spends its labels on the whole
machine; each detail spends a comparable budget of them on one part of it —
the densest of the five carries about twice what the sparsest does, and no
count is written down here because counting them is `grep -c 's.lab'` on the
drawing. Every one is chosen by reading that course's lesson titles and
subtitles in `content/learn/<slug>/` — a reader who has taken the course
should recognise its contents in the drawing.

**What may not be invented here**, on top of everything FIG. 1 already rules
out: a feature the course does not teach; a fourth line weight; a schedule
column that claims a bay it has no ring on; a door that leads nowhere. A
course whose parts have outrun the drawing gets a column with no ring and the
words `Not on the detail`; a named part with no lessons filed under it yet
keeps its bay, drawn and unclickable, because a link that goes nowhere is
worse than no link; a course with no detail drawn at all gets the schedule
alone and says so — the same visible failure `buildStages()` uses on the
index.

**The layout is a stack, and that is load-bearing.** The drawing runs the full
width at the top of the field and the schedule's columns hang beneath it. An
earlier build split the field into two columns above 100rem, drawing left and
schedule right; on RAG's seventeen lessons the schedule made the row tall, the
drawing's column stretched to match it, and the drawing sat centred with the
top of the field showing nothing but bare grid. Grid rows size to their
content, so a stack cannot do that at any lesson count. The drawing is capped
on its width, so the bare grid either side of it on a wide window is a sheet
margin and always narrower than the drawing it frames.

**One column per part, and never a written number.** The schedule is
`repeat(auto-fit, minmax(min(13rem, 100%), 1fr))`, so three parts give three
columns and five give five wherever there is room for five. `repeat(var(--n),
…)` is not valid CSS — `repeat()` takes an integer, and a custom property in
that slot makes the whole declaration invalid.

## The spread — a lesson

**A lesson carries no drawing.** Nothing on it is an SVG, and nothing on it
may become one. It is a printed spread, and it lives in `app/learn/_lesson/`.

**Two widths, and every block is one of them.**

- **The spread** — `min(var(--lm-spread), 100% - var(--lm-gut) * 2)`, centred,
  where `--lm-spread` is `calc(var(--lm-measure) + 28vw)` and `--lm-gut` is
  `clamp(1.25rem, 4.5vw, 5rem)`. It has no ceiling. A wide screen gets a wider
  table and a bigger right margin, never a column marooned in the middle of
  one.
- **The measure** — `min(var(--lm-measure), 100%)`, left-aligned inside the
  spread, where `--lm-measure` is the reader's own `--ln-measure`: `70ch`, or
  `104ch` with the rail's WIDE switch on. Both terms of both widths are
  character counts and viewport units. **There is no pixel width anywhere on
  the page**, and the percentage resolves against the block's own container,
  so a phone gets the whole window back and never bars at the sides.

**The margin is what the spread is for.** Direct children of the prose sit on
the measure; four things do not, and take the whole spread instead: a section
head, a table, a code block and a pull quote. They grow to the right, into the
air the measure leaves. Squeezing a six-column comparison table into 70
characters is how these end up unreadable, and it is the one structural idea
in the layout. The `WHY THIS, FOR YOU` label uses the same margin from `60rem`
up — the paragraph holds the measure and its label goes out beside it; below
that width there is no margin to put it in, so it sits above the text.

**The four course bands.** `--ln-course` is drawn at `--ln-stroke` and nowhere
else on the page: across the top of the sheet, closing the title block under
the byline, opening every numbered section of the body, and opening the recall
band. Four kinds, so a three-section lesson draws six. Everything else that
divides the page is a hairline, in one of three strengths — `--lm-line` ends a
block, `--lm-firm` is an object's edge, `--lm-rule` is a row inside one.

**The order down the page.** Kicker (course as a link, then the part), h1,
standfirst, byline row with `LESSON 05 / 17` and `~9 MIN` — that row and the
kicker are the whole of the page's position, stated in words. Then the opening
paragraph with the raised initial, the prose, `WHAT YOU TAKE AWAY` with the
lead takeaway lifted as a pull quote, the recall band, `GO DEEPER`, and the
pager: the lessons either side, named, as two ruled links.

Why not draw any of it. A course's shape is drawn on the course page, at a
size where the parts can be named and read. Repeating it on every lesson at
strip height gives a reader a picture too small to learn anything from, in
place of a line of type they can read at a glance. The drawing that used to
sit here was removed at the owner's instruction; see "Arguments already had".

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
- **A band is the way out of the column.** One exists, the recall band on a
  lesson: a heavy course rule above it and a hairline below, both spanning the
  spread, with the questions back on the measure inside so their left edge is
  the h1's to the pixel. A band has no fill and no tint. `.bleed` is gone —
  it added a gutter of its own and inset a nested `.measure` twice, and
  nothing needed it once a lesson brought its own widths.
- **The index has no reading column.** The plate runs the full window with the
  same `--ln-gutter`, and the reader's NARROW/WIDE switch in the rail has no
  effect there. That is correct rather than a gap: the switch governs a column
  of prose, and the index has none. It still governs a lesson, whose whole
  layout is built from `--ln-measure`.
- **The drawing rotates, it does not shrink.** Labels are always horizontal;
  no rotated text at any breakpoint. Which drawing is shown, and how far it is
  allowed to grow:
  - **FIG. 1, on the index.** `MachineWide` above `62rem`, `MachineNarrow`
    below `61.9375rem` — the two queries must not both match at `992px`, or
    the strip goes multi-column while the wide drawing is already hidden. The
    wide plate is **width**-capped at `min(100%, 100rem)` and centred, so a
    2500px window does not turn it into a metre of diagram with the legend off
    screen; the narrow one is width-capped at `26rem` and centred, because
    100% of a 991px window renders a 360 × 1060 drawing at about 852 × 2509.
    Both caps are on the drawing. **Neither is ever on the sheet**, which runs
    the full window at every size. **And neither is ever on a height** — see
    FIG. 2 below for why, which is the same reason and was learnt twice: a
    `max-height: clamp(24rem, 72vh, 44rem)` sat on `.wide` and letterboxed it
    at 2560, rendering a 2276px field as a 1656px drawing with 310px of bare
    grid either side and cutting `.lab` from 21.3px to 15.5px. 100rem is
    1600px and the viewBox is 1600 units wide, so at the cap one unit is one
    pixel and a 15-unit label letters at exactly 15px — a hair off FIG. 2's
    15.2px, so the two sheets letter alike.
  - **FIG. 2, on a course page.** The sheet runs the full window; only the
    drawing has a ceiling, and it is on the **width**, `min(100%, 76rem)`,
    never on the height. Every drawing's viewBox is 1200 units wide and
    every label on it is 15 units, so a label's rendered size is the box
    width over 1200: fix the width and all five letter identically, cap the
    height instead and the SVG letterboxes, scaling the drawing — and its
    lettering — down by whatever the height was cut by. Measured, not
    argued: under a height cap the same label came out 12.6px on
    prompt-engineering and 9.6px on llms; under the width cap it is 15.2px
    on both. The cost is the fold, and it is **open**, so here is the
    arithmetic rather than an impression. On a 1440 × 800 laptop the things
    above the drawing come to 381px — the rail 45, `.learn-main`'s top
    padding 80, the sheet inset 15, the title strip 226 and `.figure` 14 —
    leaving 419px for a drawing rendered 1216px wide. So a viewBox fits whole
    only at 2.90:1 or flatter, which is 1200 × 414, and **all five overrun**:
    `llms` (1200 × 560) by 149px, `evals` (533) by 121px, `rag` (520) by
    108px, `agents` (460) by 47px, `prompt-engineering` (428) by 15px. The
    fix is a flatter viewBox — a redraw, not a ceiling, and not this pass.
    Below `62rem` the drawing is not
    shown at all — a 1200-unit detail rendered into a 320px column letters its
    annotation at about five pixels, and a detail whose annotation cannot be
    read is a smudge rather than a detail. The phone gets the key plan, which
    is one shape and survives the reduction, and the drawing's own content in
    words in its place. The schedule falls to one column and every lesson
    keeps its subtitle in full.

## Motion

One authored moment per drawing, and neither is an entrance animation. **A
lesson has one, and it is a reply, not an entrance:** an answered question's
explanation rises 0.4rem as it arrives, 420ms on `--ln-ease`, and nothing else
on the page ever moves. It had a different one once — a ring drawing itself in
on the position strip — and that went with the drawing it belonged to. A page
of type still does not need an entrance.

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
from `app/globals.css`, the site's own accent, chosen partly so a moving
spark can never be mistaken for `--ln-agents` amber lighting up.

**A course: one request runs the detail, once.** The same event FIG. 1 opens
with, at the scale of one part: a single spark in `--pl-spark` travels the path
through that course's own machinery on load, a dial settles as the last beat
where the drawing has one, and then nothing moves again.

Everything else is hover and focus. On the index those are 200ms fades on
opacity, `stroke`, `fill` and `border-color`, so the ink and the dimming
arrive together; elsewhere they are instant colour and weight changes.

`prefers-reduced-motion` removes the sparks with `display: none` rather than
shortening them — the section-wide block in `learn.css` sets every animation
to `0.01ms`, which would fire a spark as a one-frame flash — puts the needle
at its reading, and drops every transition. On a lesson the same block leaves
an explanation simply already there.

No scroll reveals. The previous build staggered every card in on scroll; that is
removed, and `Reveal` is not used in this section.

## Progress

A read lesson carries a filled mark in its schedule row instead of a hollow
one, and the schedule's header carries the count in tabular numerals. There is
no percentage, no bar, no ring, no badge, no streak, no celebration. Stored in `localStorage` under
`learn:progress:v1`; it never leaves the browser.

## Components

Three folders, because there are three surfaces.

- `app/learn/_plate/` owns the index and nothing else: `MachineWide.tsx`,
  `MachineNarrow.tsx`, `Stage.tsx` — the group, the link and the accessible
  name that both drawings hang their five parts inside — `stages.ts`,
  `font.ts`, and one `plate.module.css` that they all import. The stylesheet is single because the reveal is a `:has()`
  rule that has to name a class on the page shell and a class inside the SVG
  in the same selector; split across two modules those would be two different
  hashed names.
- `app/learn/_sheet/` owns a course page and nothing else: `details.tsx` with
  the five drawings, `KeyPlan.tsx`, `Schedule.tsx`, `parts.ts`, and one
  `sheet.module.css` they all import — single for the same reason
  `plate.module.css` is. It restates the plate's five weights rather than
  importing them, so a change to a course page can never reach into the index
  by accident.
- `app/learn/_lesson/` owns a lesson and owns no drawing: `Lesson.tsx` (the
  spread, and everything on it that is not the body or the quiz), `Recall.tsx`
  (the checkpoint, the one client component on the page), `mdx.tsx` (the four
  elements of a lesson body that are design rather than markdown), `font.ts`
  and one `lesson.module.css` they all import. `app/learn/[course]/[lesson]/
  page.tsx` owns everything above the design — the params, the metadata, the
  neighbours and the MDX pipeline — and hands the rendered body down as
  children. A stock card, a shadowed panel, an icon tile or a new diagram
  inside this world is a lapse, not a shortcut.
- `app/learn/_components/` is what all three share, and it is two files:
  `ViewWidth.tsx`, the rail's reading-width switch, and `useProgress.ts`, the
  `localStorage` store the recall band writes and a course page's schedule
  reads.

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
  is the same read/unread distinction the schedule's read marks use.
- **Checkpoint head** — `RECALL` at heading size with `NO SCROLLING BACK`
  beside it a step down, over a heavy course rule. The instruction is what
  makes retrieval practice work, so it is set as an instruction and not as
  part of the label. **There is no counter and no score.** A count of
  questions answered, a tally of correct ones, a percentage or a closing
  congratulation are all the course product this section refuses; the only
  thing finishing records is that the lesson was read.

A course is walked from the foot of a lesson: the pager, one `<nav>` with
`aria-label="Lesson navigation"` and two links, each always going somewhere —
the first and last lesson of a course point their spare half back at the
course rather than leaving a dead end.

## Accessibility

Body and label text meets 4.5:1 in both themes, on both grounds; the measured
values are in Colour. Course identity is never carried by colour alone — a
course carries its name in signage caps, a stage on FIG. 1 carries a numbered
callout that the legend repeats, and read/unread marks differ in fill, not
hue. The recall options are real buttons, operable by keyboard, with the
explanation in an `aria-live` region that is **in the DOM from the first
render**, empty — a region added at the same moment as its text is not
announced by most screen readers, and it is collapsed rather than
`display: none`, which would take it back out of the accessibility tree. The
verdict leads that announcement off screen, because no explanation in
`content/learn/` says in words whether the reader was right. An answered
option carries `aria-disabled`, never the real `disabled` attribute: that
removes the button from the tab order in the frame it was activated, focus
falls to `<body>`, and the next Tab starts again at the top of the page. Each
question's options are a `role="group"` labelled by the question's own text.

**Right and wrong are carried in a printed word**, and in a change of weight
and of rule. A lesson has no red and no green anywhere, and there is no glyph:
a mark that is `aria-hidden` leaves a reader who is not looking at it with
colour alone, so the marking is `Correct` and `Not this`, set in type, on
every option that was marked.

On the index:

- Every mark on both drawings is `aria-hidden` and each `<svg>` is
  `role="presentation"`, which says nothing itself and — unlike `aria-hidden`
  — hides nothing inside it. The equivalent for the picture is an ordered
  description in `page.tsx`, off screen but never `display: none`, and it has
  to carry everything the drawing carries **in the same order**, including the
  two facts the drawing states in words rather than lines. When FIG. 1
  changes, that list changes with it.
- The reveal fires from the keyboard as well as the pointer, and the two are
  separate rules: the `:focus-visible` half is unconditional, the `:hover`
  half is inside `@media (hover: hover) and (pointer: fine)`. Tabbing the
  legend walks the machine, and so does tabbing the drawing, on any device.
- **Both ways into a course are real links.** The whole legend cell is a
  target, via `::after { position: absolute; inset: 0 }` on the link, and each
  part of the machine is a target too. **What that costs:** a screen-reader
  reader now meets the five courses twice, once in the drawing and once in the
  legend. It is paid deliberately. The alternative was a focusable link inside
  an `aria-hidden` subtree, which is a focus stop that announces nothing, and
  the two sets of links say the same sentence about the same destination —
  `stageLabel()` in `stages.ts` is the one place either name is written, so
  they cannot drift into sounding like ten courses.
- Only the plate you can see is reachable. Both are in the DOM and the other
  is `display: none`, which takes its five links out of the tab order and out
  of the accessibility tree. That is why neither is ever hidden by moving it
  off screen or fading it to nothing.
- The legend is `role="list"` with a visually hidden `<h2>`, because
  `list-style: none` costs the list its semantics in Safari and there was no
  heading between the h1 and the notes.

On a course page:

- **FIG. 2's bays are doors too**, so the same trade the index made is made
  here. Each of the five `<svg>`s is `role="presentation"` and none of them is
  `aria-hidden`, because a focusable link inside an `aria-hidden` subtree is a
  focus stop that announces nothing. Every mark, numeral, label and spark in
  them is `aria-hidden` instead — by `Bay`, `Callout` and `Spark` in
  `details.tsx`, and by `aria-hidden` on the spine group in each drawing — so
  the bay links are the only things in the picture a screen reader meets.
  **What that costs:** a reader now meets each part of the course twice, once
  in the drawing and once as a schedule column. It is paid deliberately, and
  `partLabel()` in `parts.ts` is the one place a bay's name is written, in the
  order the schedule column already says it — the part's number and name, how
  many lessons and how many minutes, then the one clause the column cannot
  say, which is where the bay leads.
- The reveal fires from the keyboard as well as the pointer, split the same
  way as the index's, but it correlates on `:focus-within` rather than
  `:focus-visible`: the thing that takes focus is the anchor, and `data-part`
  is on the bay around it.
- The focus ring on a bay is the hit rects inked at `1.5` — the thin weight
  already on the sheet, never a fourth one, never a glow or a radius — and it
  stays graphite while the bay takes the course ink, so the box never
  disappears into the part it is marking. It is the rects rather than an
  `outline` because WebKit paints no outline on an SVG element at all.
- The key plan is the other way back to FIG. 1, and the whole block — drawing
  and caption — is the target rather than four words. It had a hover state and
  no focus state; the ring is now its own already-transparent border, inked.
  It and the `← Fig. 1` text link above it are two links to one page with two
  different names, which is the point: one says where you are standing, the
  other says where it goes.
- The equivalent of the picture is an ordered description of the drawing — off
  screen where the drawing is shown, and shown in the drawing's place below
  `62rem`. One node with two treatments, rather than two copies that can
  drift. Every way into a lesson is a row-sized link in the schedule, with the
  minutes and the read state in its accessible name, because the mark and the
  numeral beside the title are `aria-hidden`. Read and unread differ in fill,
  not hue.

On a lesson there is nothing to describe: no drawing, no `aria-hidden`
subtree, no off-screen equivalent. Everything the title block says is readable
text. The two things on the page that scroll sideways — a code block and a
table — are both tab stops, because a region that scrolls has to be reachable
from a keyboard. The table's wrapper is a named `role="region"`, since an
empty div announces nothing; the code block is a `<pre>` and announces the
code inside it. A `GO DEEPER` link says `(opens in a new tab)` off screen, and
the address printed beside it is `aria-hidden`, so it is not read out twice.

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
  rest is the flat colour chart this drawing replaced. Rings only.
- **Relabel `Top-k` and `Trace` in plain English.** Rejected: they are the
  exact names the reader will meet in someone else's code and in
  `content/learn/rag/12-reranking.mdx` and
  `content/learn/evals/10-tracing-a-run.mdx`, and "watching" is already the
  key's word for the dotted weight. The gloss lives in the legend's role lines
  instead, where there is room for a sentence.
- **Weight the legend columns** so the bigger courses get more room. Rejected:
  five equal columns; weighting would claim a ranking the page does not have.
- **The drawing is a highlight and nothing more.** Held for as long as the
  plate existed, on the reason that an SVG `<a>` would bypass the router and
  reload the page. Reopened by the owner — *when we click the section inside
  the analog diagram it should open the corresponding lesson* — and the reason
  turned out to be false: Next's `linkClicked()` upper-cases `nodeName`
  precisely because "anchors inside an svg have a lowercase nodeName", so a
  `next/link` inside the drawing is a client navigation like any other. The
  five parts are doors. What that cost is recorded in Accessibility, and it is
  a real cost, not a free win.
- **"On a touch screen the reveal never fires", left as an assumption.** It
  was recorded here and in the code as a fact about touch browsers, and it was
  false: Mobile Safari and Chrome on Android both synthesise hover on the
  first tap. Nothing showed while the drawing was only a highlight; the moment
  the parts became links it cost the reader their first tap — one tap lit the
  stage, the second opened the course. Fixed by scoping every hover rule to
  `(hover: hover) and (pointer: fine)` and leaving every focus rule
  unconditional, on both sheets. The sentence is now true because a media
  query makes it true, not because a browser was assumed to behave.

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
- **A bay opens the part, not a lesson** — a `#part-3` anchor down to the
  schedule column, or a filtered view of that part. Rejected on the owner's
  own words, *the clicking on analog diagram to open lesson doesn't work
  inside a course*: the ask is a lesson, and scrolling a reader forty lines
  down the page they were already on is a worse answer than opening the thing
  they clicked for. A bay opens its part's **first lesson in reading order** —
  the lowest `order`, not the first on disk and not the first in the array,
  because a renumbered lesson must move the door with it.
- **Letting the five drawings write their own hrefs and labels.** The obvious
  shape, since each already hand-authors its own geometry, and refused for the
  reason `Stage.tsx` exists on the index: the five were written by five
  different hands, and anything all five have to remember will drift into five
  slightly different sentences about the same five destinations. `Bay` owns
  the link; `partDoor()` owns the words. The same argument took `agents.tsx`'s
  private copy of `Bay` away — it had drifted already, and a private `Bay`
  would have been the one detail whose parts were still not doors. Its
  `Callout` stays private, because that one is a real difference: it rings at
  15 where the others ring at 17.

- **Five lesson pages, built and read side by side.** The lesson page was the
  one surface the plate redesign had not reached, and arguing about it in the
  abstract had already failed twice. So five complete pages were built to five
  deliberately distant briefs — a plate, a print, a console, a magazine spread
  and a signboard — wired to the same route, and read on the real content:
  real prose, real comparison tables, a real seventeen-lesson course. Three
  turned out to be right about different things and the shipped page is the
  one that keeps all three. **The spread** was right about the layout and the
  type: one measure with the margin used for the things that must not be
  squeezed into it, and a real display face over a real text face. **The
  console** was right about the colour and the manner — very few marks, all of
  them precise — and wrong about its monospaced headline, which is the exact
  costume this redesign exists to remove. **The signboard** was right that a
  page needs one piece of structure to feel built rather than typeset, and the
  course's own ink at `--ln-stroke` is it. What none of them got on their own:
  the ground. All five were drawn on their own world, and the winner was
  rebuilt on the index sheet's palette, value for value, which is why index,
  course and lesson now read as one publication. The lab is deleted; five
  candidate directories in the tree are a maintenance cost the moment one of
  them ships. **Do not reopen the lesson's form without building the
  alternative on real content first** — that is the part that decided it.

- **The transit metaphor, everywhere it reached.** A course was a line, a
  lesson was a stop, a part was a zone, and a lesson opened on a drawn
  segment of track with a you-are-here ring on it. **Removed at the owner's
  instruction** — *"wtf are you adding the train stop think in it, remove it
  entirely from our learn website"* — and it is not a taste question that can
  be reopened. What went: the drawing in `Position.tsx` and its four
  primitives; the words *stop*, *line* meaning a course, *zone* meaning a
  part, *terminus*, *platform*, *station* and *signalling* in every label,
  `aria-label`, comment and class name; and the lesson's one authored motion
  moment, which was that ring drawing itself in. What stayed: the five course
  inks, which are colours and were never lines; FIG. 1 and FIG. 2, which are
  engineering diagrams of an LLM request and of a course, not maps; and the
  draughting-plate world, which is the section's identity. **Do not propose a
  position diagram, a progress track, a journey line or a route map for a
  lesson.** The facts it carried are a kicker and two figures of type, and
  that is enough.

`Line.tsx`, `Line.module.css` and `line-data.ts` are gone. They drew the old
course page and nothing else imported them. So are `Position.tsx`,
`PrevNext.tsx`, `WhyBand.tsx`, `Wins.tsx`, `Deeper.tsx`, `Quiz.tsx` and
`_components/mdx.tsx` with their stylesheets: they built the lesson page the
spread replaced, and `app/learn/_lesson/` does all of it now. `app/learn/lab/`
and its five candidates went with them.
