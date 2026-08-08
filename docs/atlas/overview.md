# The Atlas — overview

Covers what The Atlas is, what a visitor sees, and why it exists. Written for someone who has
never opened it. For the design system, see [`design.md`](./design.md); for how the data is
built, see [`build-pipeline.md`](./build-pipeline.md).

## What it is

The Atlas is a standalone interactive feature on `sushantgundla.com`, at `/atlas`. A visitor
picks a country — by clicking it on a world map or by typing its name into a search box — and
gets a huge page about that one country: its economy, its people, its trade, its history, its
famous residents, its flag and anthem, hundreds of individual facts and numbers.

It's a showcase project — something to demonstrate craft and depth, not a blog post. It's linked
from the Projects page of every version of the site, but it owns its own visual design, its own
colours, its own layout. It does not change when the rest of the site is redesigned.

## The idea: every country is a banknote

The whole page is styled as security printing — the kind of engraving, fine line-work, and
serial numbers you see on real paper currency. The metaphor: **every country is its own
banknote, and the world map is the uncut printing plate the banknotes are cut from.**

That metaphor solves a real design problem. A country dossier here shows roughly 150 numbers.
Shown as a plain table, that reads as a spreadsheet — dry and forgettable. Shown as a sheet of
denomination notes, each number gets its own frame, its own ornament, its own sense of being a
headline figure. Banknotes are already good at exactly this: showing one big number
surrounded by decoration, over and over, on one sheet.

The visual language follows through: intaglio engraving, guilloché rosettes (the wavy circular
patterns on real currency), microtext, security threads, watermarks, and registration marks.
Full detail in [`design.md`](./design.md).

## What a visitor can do

| Page | What's there |
|---|---|
| `/atlas` | The world map ("the plate"). Click a country, search for one, or colour the whole map by a chosen statistic (population, GDP, life expectancy, and more) and watch it sweep across the map. |
| `/atlas/[country]` | One country's full dossier: ~150 numbers grouped into sections (Land, People, Money, Trade, Health, Learning, Work, Connected, Nature, State), plus a big flag/name "face note", a portrait of a notable person, national anthem playback, live weather and clock at the capital, trade partners drawn as arcs on a mini map, neighbouring countries, and a history timeline. |
| `/atlas/compare/[a]-vs-[b]` | Two (or up to five) countries side by side, same sections, the higher value in each row highlighted. |
| `/atlas/rankings/[indicator]` | One statistic, every country, ranked — e.g. every country by GDP per person, richest to poorest. |
| `/atlas/learn` | The training floor — five games plus two non-game features (Surprise me, Country of the day), so a visitor is asked something instead of just browsing. |

A UV-lamp toggle on a country page dims everything except the facts where that country is a
world top-10 or bottom-10 — "show me only what's extraordinary about this place."

## Why it exists

Three reasons, in the owner's own words as captured in [`design.md`](./design.md) and
[`feature-checklist.md`](./feature-checklist.md):

- It's a portfolio piece that shows depth — real data, real numbers, sourced and dated, not
  placeholder content.
- It's a design exercise in taking one strong metaphor (a banknote) and following it all the way
  through typography, colour, motion and layout, rather than decorating a generic dashboard.
- It's a technical exercise in handling messy, real-world open data — throttled APIs, vandalised
  crowd-sourced facts, missing countries, inconsistent code spaces — honestly, with every gap
  shown as a design decision (an empty state) rather than hidden or faked.

## What it deliberately doesn't do

Quizzes and games were out of scope for v1 (see [`design.md`](./design.md) §1), but that changed
— the learning section at `/atlas/learn` shipped five games (spot the forgery, higher or lower,
guess the flag, guess the country, where in the world) plus two non-game floor features
(a surprise-me button, and a Country of the day card). Full detail in
[`feature-checklist.md`](./feature-checklist.md).

Still out of scope: a 3D globe, user accounts, favourites or saved comparisons, and any data
source that requires an API key or a paid plan.

## Where the numbers come from

Every number is real, sourced from the World Bank, Wikidata, Wikipedia, UN Comtrade, Open-Meteo
and Frankfurter (exchange rates) — no invented data, and every figure on the page shows the year
it's from. Full source-by-source detail in [`data-sources.md`](./data-sources.md) and
[`story-catalog.md`](./story-catalog.md); how it's actually fetched and turned into the files the
site reads is in [`build-pipeline.md`](./build-pipeline.md).
