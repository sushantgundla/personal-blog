# Country Explorer ("The Atlas") — Design Spec

**Date:** 2026-08-02 (original spec). **Moved to `docs/atlas/design.md` and annotated against
the shipped code without rewriting the original text.**
**Branch:** `feature/country-explorer`
**Status:** shipped. See [`build-pipeline.md`](./build-pipeline.md) for how the data actually
gets built today and [`feature-checklist.md`](./feature-checklist.md) for what works in the
browser.

> **This file is the plan, written before implementation. Where it disagrees with the shipped
> code, the code wins — this note calls out every place that happened, but leaves the rest of
> the spec as originally written, since it still describes what got built.**
>
> - **§3.1 "no static JSON snapshot… fetched on the server, cached with ISR"** — this is the
>   biggest divergence. The shipped app does the opposite: `content/atlas/snapshot/countries/*.json`
>   (250 files) and `content/atlas/snapshot/rankings.json` **are committed to the repo**, built
>   offline by `scripts/atlas/build-snapshot.mjs`, and read first — no network — by
>   `lib/atlas/dossier.ts`'s `getDossier()` and `lib/atlas/rankings.ts`. Live ISR fetching (the
>   `fetchLiveDossier` function this spec describes) still exists, but only as a fallback for a
>   country the snapshot doesn't have yet, and as what runs behind the "Refresh" button on a
>   dossier page. This changed because a cold page was measured at 30–95s (worse, per this
>   spec's own §5, 204–280s for some countries) under World Bank/Wikidata/Comtrade throttling —
>   see `build-pipeline.md`.
> - **§3.2/§3.3 sources** — REST Countries is correctly rejected here and never used. That part
>   of the spec matches the code. (An earlier research pass, `data-sources.md` in this same
>   folder, had recommended REST Countries v5 before this spec overrode that choice — see that
>   file's own note.)
> - **§3.4** `lib/atlas/geo/world-paths.ts` — matches. `content/atlas/famous-people.json` —
>   matches, still precomputed by `build-people.mjs`.
> - **§5** "`generateStaticParams` pre-renders every country page" — does not match. Only 25
>   countries (the largest populations/economies) are prerendered at build
>   (`PRERENDER_ISO3` in `app/atlas/[iso3]/page.tsx`); the rest render on first request via
>   `dynamicParams` (default `true`) and are now fast because of the committed snapshot, not
>   because they're prerendered.
> - **Routes** — `/atlas/compare/[a]-vs-[b]` in the table below is really the dynamic segment
>   `app/atlas/compare/[countries]/page.tsx`, and it was built to handle **2 to 5 countries**,
>   not just 2 — see `MAX_FULL_FACE_NOTES` in that file.
>
> Numbers used elsewhere in this spec (e.g. "~160 indicators" in §3.2) are the plan's estimate;
> the shipped catalogue in `lib/atlas/indicators.ts` has **151** entries — see `data-sources.md`.

---

## 1. What we are building

A standalone interactive app on `sushantgundla.com` where a visitor browses a world map, picks a
country, and reads an enormous dossier about it — geography, economy, trade, society, culture,
history, famous people, hundreds of numbers.

It is a showcase project. It is linked from the Projects pages of every version of the site
(`/projects`, `/v4/projects`, and any future `/vN/projects`), but it has its own design that does
not change when the surrounding site is redesigned. It owns its own layout, its own colour
tokens, and its own chrome.

**Route namespace:** `/atlas`

| Route | Purpose |
|---|---|
| `/atlas` | The plate — world map, search, choropleth, rankings rail |
| `/atlas/[iso3]` | One country's dossier |
| `/atlas/compare/[a]-vs-[b]` | Two countries head to head |
| `/atlas/rankings/[indicator]` | Leaderboard for one indicator |

All are real, linkable, indexable URLs.

### Out of scope for v1

- Quizzes and games (explicitly declined)
- 3D globe (`three.js` is 150 KB+ gzipped; a flat engraved plate is faster and more on-metaphor)
- User accounts, favourites, saved comparisons
- Any paid or key-requiring data source

---

## 2. Visual direction — "Denomination"

**The metaphor: every country is its own banknote, and the world map is the uncut printing plate.**

Chosen from three directions in a research file this spec cites as
`docs/superpowers/research/country-explorer-design.md` — **that file does not exist anywhere in
the repo** (checked while moving this doc to `docs/atlas/`; only `data-sources.md` and
`story-catalog.md` were ever present). The direction it argued for is the one that shipped, so
nothing downstream depends on recovering it, but the rationale for rejecting the other two
directions is lost. The short version of what's left: a sheet of banknotes is *already* a grid of
self-contained, ornamented, number-led modules, so the metaphor solves the hard problem — how to
show hundreds of numbers without it reading as a spreadsheet — for free.

Security-printing vocabulary throughout: intaglio engraving, guilloché rosettes, microtext,
serial numbers, security threads, registration marks, perforations, watermarks, and the uncut
sheet a mint produces before the notes are cut apart.

### 2.1 Colour tokens

Defined once in `app/atlas/atlas.css` under `.atlas-root`. Muted ink on dark security paper.

| Token | Hex | Use |
|---|---|---|
| `--note-void` | `#080706` | page ground, between notes |
| `--note-plate` | `#0F0D0B` | the printing plate, map background |
| `--note-paper` | `#1A1613` | note stock |
| `--note-paper-hi` | `#231D18` | raised note, hover |
| `--note-rule` | `#2E2721` | perforations, cutting guides, hairlines |
| `--note-intaglio` | `#E9E1D2` | engraved highlight, primary text |
| `--note-intaglio-dim` | `#A2988A` | secondary text, hatch lines |
| `--note-ember` | `#FF6B2B` | **primary** — registration marks, denominations, above average |
| `--note-rust` | `#C1662F` | guilloché stroke, section rules |
| `--note-thread` | `#7FA6A0` | security thread, sparklines, below average |
| `--note-uv` | `#9B7FD4` | UV mode only |
| `--note-seal` | `#B08D57` | seals, watermark edges, ornaments |
| `--note-nodata` | `#191614` | choropleth "no data" fill |

Contrast floor: `--note-intaglio` on `--note-paper` ≈ 12.1:1, `--note-ember` on `--note-plate`
≈ 6.6:1, `--note-uv` on `--note-paper` ≈ 5.4:1. All pass AA.

**Per-country ink.** Each country derives one hue from a hash of its ISO3 code, clamped to
`hsl(h, 30–38%, 48–56%)` so it can never be candy-bright. It tints that country's guilloché, note
edges and section rules only. Ember stays the global accent. **The build must assert contrast for
the derived hue against `--note-paper` and darken until it passes, then fail loudly if it cannot.**
Do not trust a hash to produce accessible colour.

### 2.2 Typography

| Role | Face | Size | Notes |
|---|---|---|---|
| Country name (face note) | Bodoni Moda 700 | `clamp(3.5rem, 11vw, 9rem)` | the engraved title |
| Denomination numerals | Archivo 900, tabular | `clamp(2rem, 5vw, 5rem)` | the value on every note |
| Note labels | JetBrains Mono 500 | 9–10px, uppercase, `tracking-[0.28em]` | |
| Serials, microtext | JetBrains Mono 400 | 6px microtext, 11px serials | microtext is decorative — `aria-hidden`, never carries information |
| Section rules | Bodoni Moda 400 italic | 1rem, `tracking-[0.3em]` | the `— PEOPLE —` cutting guides |
| Body, history, bios | Inter 400 | 1.0625rem / 1.75 | |

One new font request: **Bodoni Moda** (Google Fonts, variable, Latin subset, ~28 KB), loaded only
in the `/atlas` layout. Archivo, Inter and JetBrains Mono are already loaded site-wide.

Scale ratio 1.5, deliberately dramatic: 9 / 11 / 16 / 24 / 36 / 54 / 80+. Banknotes have enormous
denominations and tiny everything-else, and that gap is the look.

### 2.3 Signature motion

All CSS or small React. **No animation library.** Everything is `transform`, `opacity`,
`stroke-dashoffset`, or `fill`.

1. **Guilloché draw-on** — `stroke-dasharray`/`stroke-dashoffset` over 600–900 ms, then an
   infinite 90-second rotation.
2. **Intaglio sheen** — a raking low-opacity linear-gradient with `mix-blend-mode: overlay`,
   translated across on a 12 s loop. Reuses the `.v4-sweep` technique.
3. **Hatch densify on hover** — two SVG `<pattern>` definitions, swapped by changing one path's
   `fill` to the other pattern's `url()`.
4. **The note prints** — on selection the plate goes `scale(.96)` + `saturate(.3)` and the note
   rises. Where the View Transitions API is supported, the map path and the dossier's face note
   share a `view-transition-name` so the country morphs into its own banknote. Plain fade
   everywhere else.
5. **Note cascade** — a `<details>` opening staggers its notes in at 40 ms intervals.
6. **Watermark resolve** — portraits go `opacity:.12 contrast(.4)` → `opacity:1 contrast(1)` on
   hover.
7. **UV lamp** — one class on the root swaps a set of custom properties; about a dozen elements
   cross-fade over 400 ms.
8. **Magnetic buttons** — reuse `app/v4/_components/MagneticButton.tsx` on primary controls.

Every effect gets a hard off-switch in one `@media (prefers-reduced-motion: reduce)` block, the
same pattern as `app/v4/v4.css`. Content is visible by default; animation only ever adds.

---

## 3. Data architecture

### 3.1 The rule

**Fetched on the server, cached with Next.js ISR.** No static JSON snapshot of the numbers is
committed. A visitor arriving after the revalidate window expires triggers a refresh, and the
fresh version is then served to everyone from cache.

```ts
fetch(url, { next: { revalidate: N } })
```

| Source | `revalidate` | Why |
|---|---|---|
| World Bank indicators | `604800` (7 days) | updates a few times a year |
| World Bank country list | `604800` | almost never changes |
| Wikidata SPARQL | `86400` (1 day) | community edited |
| Wikipedia summary | `86400` | |
| UN Comtrade | `604800` | annual data |
| Open-Meteo (capital weather) | `3600` (1 hour) | |
| Frankfurter (exchange rates) | `86400` | |

### 3.2 Sources — confirmed working, no API key

Full research in [`data-sources.md`](./data-sources.md) and [`story-catalog.md`](./story-catalog.md)
(moved from `docs/superpowers/research/` — same content, new path).

| Source | Gives us | Endpoint shape |
|---|---|---|
| **World Bank v2** | ~160 indicators, full history 1960→now, all-country rankings | `api.worldbank.org/v2/country/{iso3}/indicator/A;B;C?source=2&format=json&mrnev=1&per_page=200` |
| **Wikidata SPARQL** | motto, anthem + audio, flag, emblem, capital + coords, independence, languages, currency, driving side, plate code, highest/lowest point, UNESCO sites, famous people | `query.wikidata.org/sparql?format=json&query=…` |
| **Wikipedia REST** | intro paragraph, short description, lead image, canonical URL, revision timestamp | `en.wikipedia.org/api/rest_v1/page/summary/{title}` |
| **UN Comtrade preview** | exports and imports by partner, by product | `comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode={comtradeCode}&period={yr}&cmdCode=TOTAL&flowCode=X&motCode=0&partner2Code=0` |
| **Open-Meteo** | live weather at the capital | `api.open-meteo.com/v1/forecast?latitude=..&longitude=..&current=temperature_2m` |
| **Frankfurter** | exchange rates (~30 currencies only) | `api.frankfurter.dev/v1/latest?from={cur}` |
| **Wikimedia Commons** | flags, emblems, portraits, landmark photos, anthem `.ogg` | `commons.wikimedia.org/wiki/Special:FilePath/{file}?width=N` |
| **world-atlas TopoJSON** | map geometry, ~100 KB, public domain | bundled locally, never fetched |

### 3.3 REST Countries is dead — do not use it

`restcountries.com` v1–v4 all return a deprecation payload. Verified 2026-08-02: `v3.1/alpha/IND`
301-redirects to `files-03.restcountries.com/countries.00/legacy.json`, which returns
`{"success": false, ... "This API version has been deprecated"}`. The replacement (v5) requires an
API key. **We do not use it.** Everything it would have given us comes from Wikidata plus the
local ISO table.

### 3.4 Local static files (committed, not fetched)

| File | Contents | Why local |
|---|---|---|
| `lib/atlas/iso-countries.ts` | ~250 rows: ISO alpha-2, alpha-3, M49 numeric, English name, Wikidata Q-id, Wikipedia title | The join key for every source except UN Comtrade — see the next row, Comtrade has its own code space. |
| `lib/atlas/comtrade-codes.ts` | ISO3 → Comtrade `reporterCode`, and Comtrade `partnerCode` → {ISO3, name} | Comtrade's `reporterCode`/`partnerCode` are NOT UN M49 (§3.6). Generated by `scripts/atlas/build-comtrade-codes.mjs` from Comtrade's own `Reporters.json`/`partnerAreas.json`, filtering out expired historical codes and aggregate groups. |
| `lib/atlas/geo/world-paths.ts` | ~250 pre-projected SVG `d` strings + centroid + bbox per country | Generated at build time by `scripts/atlas/build-geo.mjs` from world-atlas TopoJSON using `d3-geo` + `topojson-client`, both `devDependencies`. **The browser ships zero mapping library.** |
| `content/atlas/famous-people.json` | Top 12 people per country with portrait URLs | The live SPARQL query took 26.8 s for India and will time out for large countries. Generated by `scripts/atlas/build-people.mjs`, re-run manually. |
| `lib/atlas/overrides.ts` | Hand-written corrections: national dish, head of state, anything Wikidata gets wrong | See §3.6 |

### 3.5 Request budget

**Per country page: 5–7 World Bank calls + 1 Wikidata + 1 Wikipedia + 2 Comtrade + 1 weather + 1 FX ≈ 11 requests**, all fired with `Promise.allSettled` so one dead source cannot blank the page.
Under ISR this runs once per revalidate window per country, not per visitor.

Every panel must have an empty state. This is not optional — Wikidata genuinely has nothing for
national animal, bird, flower or sport for most countries.

### 3.6 Known data traps — all must be handled

| Trap | Handling |
|---|---|
| **World Bank returns a UTF-8 BOM** (`EF BB BF`) | Use `res.json()`, never `JSON.parse(await res.text())` without stripping it |
| **`source=2` is mandatory** on multi-indicator calls | Always send it; omitting it returns `Invalid value` |
| **Max ~40 indicators per call**; 60 is rejected | Batch at 25 |
| **Default `per_page` is 50** — silently truncates | Always set `per_page` explicitly (200 for dossiers, 400 for all-country, 1000 for time series) |
| **Random HTTP 400s** on valid URLs — throttling in disguise | Retry 3× with backoff. Treat 400 as retryable, not as a bad indicator code |
| **`mrnev=1` is forbidden with `country/all`** — HTTP 400 | Use `mrv=1` or `date=YYYY` for rankings |
| **78 of 295 World Bank "countries" are aggregates** ("World", "Euro area", "High income") | Filter `region.value !== "Aggregates"` or the GDP leaderboard is topped by "World" |
| **Taiwan, Western Sahara and Vatican City are absent** from the World Bank entirely | Country list comes from `lib/atlas/iso-countries.ts`, not the World Bank. Numbers degrade to "no data"; the page must not 404 |
| **Kosovo uses non-standard `XKX`** | Special-cased in the ISO table |
| **Wikidata is vandalised** — India's head of state returned "Ganesh rajput" on 2026-08-02 | Head of state and head of government render only from `lib/atlas/overrides.ts`, never live from Wikidata. Every other Wikidata field carries a "from Wikidata, as of {timestamp}" line |
| **Comtrade returns `partnerDesc: null`** | Join the numeric partner code against `lib/atlas/comtrade-codes.ts` (generated from Comtrade's own `partnerAreas.json`) |
| **Comtrade `reporterCode`/`partnerCode` are Comtrade's OWN code space, not UN M49** — e.g. India is `699` today, but `356` ("India (...1974)", pre-Sikkim) is a separate expired reporter Comtrade still lists. `lib/atlas/iso-countries.ts`'s `m49` field is correct UN M49 and is NOT the right code to send here | Generate `lib/atlas/comtrade-codes.ts` from Comtrade's `Reporters.json`/`partnerAreas.json` via `scripts/atlas/build-comtrade-codes.mjs`, keeping only non-expired, non-group rows |
| **Comtrade's free preview endpoint caps around 500 rows with no paging** — for a reporter with many partners, transport-mode and re-export breakdown rows can crowd out its biggest partners before the cap is hit (confirmed live: France's unfiltered call never reached Germany or the USA) | Always pass `motCode=0&partner2Code=0` on the request itself, not just as a client-side filter afterwards |
| **Frankfurter covers only ~30 currencies** | The FX panel renders only when a rate exists. Over half of countries will not show it. That is fine; do not fake it |
| **The Wikipedia lead image for a country is usually its flag, not scenery** | Pull landmark photos from UNESCO site `P18` images instead |
| **~70 countries have no good free portrait** | Design the no-portrait face note first: the guilloché rosette grows to fill the watermark space |
| **Anthem audio is `.ogg`** — Safari will not play it | Feature-detect, hide the player when unsupported |
| **Wikidata SPARQL needs a descriptive `User-Agent`** with a contact URL | Set it on every request or get blocked |
| **~100 of the 160 indicator codes are unverified** | A validation sweep must run before shipping: batches of 20, 10 s apart, drop anything that returns empty |

### 3.7 Attribution — required, must be visible

- Wikipedia text is **CC BY-SA 4.0** — credit and link the article, name the licence
- World Bank is **CC BY 4.0** — "Source: World Bank, World Development Indicators"
- Wikidata is CC0 — credit anyway
- Commons images are per-file — show "Image: Wikimedia Commons" linking the file page
- "Source: UN Comtrade", "Weather: Open-Meteo (CC BY 4.0)"

A persistent `SOURCES` panel at the foot of every dossier, plus a per-number "as of {year}" line.
**Every number renders the year it is from.** Health and education data lag 3–5 years; showing a
2021 number as if it were current is a correctness bug.

---

## 4. Screens

### 4.1 `/atlas` — the plate

The landing screen is the uncut printing plate, and the plate is the map.

- The world is **engraved, not filled**: each country is a `<path>` with no fill, an
  `--note-intaglio-dim` stroke, and a 45° hairline SVG `<pattern>` clipped to the landmass. Land
  reads engraved, ocean reads as bare dark plate.
- Plate furniture: registration crosses in the four corners, a serial number that increments as
  the pointer moves, a 6px microtext line `THE WORLD · 195 SOVEREIGN STATES · SPECIMEN`, and a
  denomination panel showing the country count.
- **Hover** densifies the country's hatch and turns its stroke ember. A corner cartouche appears
  with the name, ISO3 as a denomination numeral, and two summary numbers.
- **The metric dial** paints every country by a chosen indicator, with a per-country
  `transition-delay` derived from centroid longitude so the colour sweeps west to east over
  ~900 ms. `--note-nodata` fill for the 18-or-so countries with no value.
- **The rankings rail** down the left lists every country ordered by the active metric. Hovering
  a row highlights the map and vice versa.
- **Search** is a mono serial-number entry box. Type-ahead over all ~250 countries, arrow keys,
  Enter to go. **This is the keyboard and mobile path and it is not a consolation prize** — the
  map is never the only way in.
- **Ambient:** the intaglio sheen loop. Nothing else.

### 4.2 `/atlas/[iso3]` — the dossier

An uncut sheet of notes.

1. **The face note** — full width at ~5:2 banknote proportion. Country name engraved huge, its
   guilloché rosette at 400px half-bleeding off the right edge, population as the denomination,
   a watermark portrait of the best-known figure at 12% opacity, the ISO numeric as a serial, and
   the country's motto as microtext along the bottom edge.
2. **The sheet** — a responsive grid of denomination notes (3 across desktop, 2 tablet, 1 mobile).
   Each note is one indicator: mono label, value as a denomination numeral, a rank line
   (`#5 of 195`), a comparison bar drawn as a **security thread** with a `WORLD` bead at the
   average, the year the number is from, and a corner ornament. ~60–80 notes, sectioned by
   perforated cutting guides: `— LAND —`, `— PEOPLE —`, `— MONEY —`, `— TRADE —`, `— HEALTH —`,
   `— LEARNING —`, `— WORK —`, `— CONNECTED —`, `— NATURE —`, `— STATE —`.
3. **Progressive disclosure** — each section shows its 9 highest-value notes then a
   `▸ ISSUE 34 MORE` control, a `<details>` styled as a mint's issue stamp. Native `<details>`
   throughout: free keyboard support, works without JavaScript.
4. **Sparklines are security threads** — a `<polyline>` with slight sine displacement, ember dot
   on the latest value, `stroke-dashoffset` draw-on. No axes, no legend.
5. **Trade is a bearer bond** — two engraved columns, partner flags as small seals, values in a
   ruled ledger, balance struck at the bottom in ember or thread depending on sign.
6. **History is the security strip** — a vertical metallic thread with events as hologram patches.
7. **Famous people are watermarks** — portraits at reduced contrast on note paper, resolving to
   full contrast on hover, name engraved beneath.
8. **The UV lamp** — a toggle that shifts the whole sheet into UV mode: paper darkens and only the
   remarkable facts (top-10 or bottom-10 world ranks) fluoresce in `--note-uv`. It is a
   "show me only what is extraordinary" filter wearing a costume.
9. **Extras** — anthem player, live clock at the capital, current weather, landmark strip,
   country-outline size overlay against a country of your choosing, one-click hops to neighbours.
10. **Year slider** — 1960 → now, redrawing the charted indicators and the sparkline endpoints.

### 4.3 `/atlas/compare/[a]-vs-[b]`

Two face notes side by side, then the same sheet of notes rendered as paired values with the
higher one in ember and a security thread between them. Mobile stacks them.

### 4.4 `/atlas/rankings/[indicator]`

One indicator, all countries, as a ledger: rank, flag seal, name, value, thread bar. Sortable,
linkable, and the source of the map's choropleth data.

---

## 5. Technical constraints

- **Zero runtime mapping or animation libraries.** `d3-geo` and `topojson-client` are build-time
  only. The map is a static inline `<svg>` of ~250 `<path>` elements rendered on the server, so it
  is in the HTML before JavaScript runs. ~180 KB of markup, ~45 KB gzipped.
- `generateStaticParams` pre-renders every country page.
- Must work on mobile. The sheet is already a one-column stack there, so mobile is a
  simplification, not a redesign.
- Must respect `prefers-reduced-motion`.
- Must stay fast on a Vercel free tier.
- `next.config.js` needs `images.remotePatterns` for `upload.wikimedia.org` and
  `commons.wikimedia.org`. Both hosts — flags are often local en.wikipedia uploads, not Commons.
- TypeScript strict mode. `npm run build` and `npm run lint` must pass.

### 5.1 Do not touch

`app/v2/`, `public/v2/`, the PNG files in the repo root, and `components/SiteFrame.tsx` are the
owner's separate in-progress work. Nothing in this project may modify, move, delete or commit
them. The `/atlas` route does not go through `SiteFrame` — it has its own layout at
`app/atlas/layout.tsx`.

---

## 6. Module boundaries

Each unit has one job, a clear interface, and can be tested alone.

```
lib/atlas/
  iso-countries.ts      the ISO/M49/Q-id join table (static)
  comtrade-codes.ts     ISO3 <-> Comtrade's own reporter/partner code space (static, see §3.6)
  types.ts              CountryDossier, Indicator, Ranking, TradePartner, …
  indicators.ts         the indicator catalogue: code, label, unit, section, format, direction
  sources/
    worldbank.ts        batching, retry, BOM, aggregates filter, mrnev vs mrv
    wikidata.ts         the dossier SPARQL query, UNESCO query, User-Agent
    wikipedia.ts        summary fetch
    comtrade.ts         partner trade + comtrade-codes.ts join
    meteo.ts            capital weather
    fx.ts               exchange rates, absent-by-default
  dossier.ts            composes all sources into one CountryDossier via Promise.allSettled
  rankings.ts           all-country fetch, aggregate filter, rank computation
  guilloche.ts          deterministic rosette path from an ISO3 hash
  ink.ts                deterministic per-country hue with a contrast assertion
  format.ts             number, currency and unit formatting; tabular figures
  geo/world-paths.ts    generated — do not hand-edit

app/atlas/
  layout.tsx            own chrome, Bodoni font load, atlas.css
  atlas.css             all design tokens and effects
  page.tsx              the plate
  [iso3]/page.tsx       the dossier
  compare/[pair]/page.tsx
  rankings/[indicator]/page.tsx
  _components/          Plate, Cartouche, MetricDial, RankRail, Search, FaceNote,
                        DenominationNote, SecurityThread, Sparkline, TradeBond,
                        HistoryStrip, PeopleWatermarks, UvLamp, AnthemPlayer,
                        CapitalClock, SizeOverlay, YearSlider, Sources

scripts/atlas/
  build-geo.mjs         TopoJSON → projected SVG paths
  build-people.mjs      the slow SPARQL query, run manually
  verify-indicators.mjs the pre-ship sweep of the ~100 unverified indicator codes
```

If a component file grows past roughly 200 lines it is doing too much — split it.

---

## 7. Error handling

- Every source call is wrapped and returns `{ ok: true, data } | { ok: false, reason }`. A failed
  source renders that panel's empty state; it never throws the page.
- `Promise.allSettled`, never `Promise.all`, at the composition layer.
- World Bank: 3 retries with exponential backoff, treating 400 as retryable.
- Wikidata: a 20-second timeout with `AbortController`, because the service can hang.
- A country with no World Bank row at all (Taiwan, Western Sahara, Vatican City) still renders a
  full page from Wikidata and Wikipedia, with the numeric sections showing "no data".
- Missing portrait, missing anthem, missing FX rate, missing trade year are all normal states with
  designed empty treatments — not errors.

---

## 8. Testing

- **Unit:** `guilloche.ts` is deterministic (same ISO3 → same path); `ink.ts` always returns a hue
  passing contrast; `format.ts` handles null, zero, negative, trillions; `worldbank.ts` parses a
  BOM-prefixed fixture and filters aggregates.
- **Fixtures, not live calls, in tests.** Captured responses for India (rich), Tuvalu (sparse),
  Taiwan (absent from the World Bank) and North Korea (listed, all nulls). Those four are the
  test matrix for every rendering component.
- **Build:** `npm run build` and `npm run lint` clean.
- **Manual:** every route at 375px and 1440px, with and without `prefers-reduced-motion`, keyboard
  only, and with JavaScript disabled for the map and the `<details>` sections.

---

## 9. Build order

1. **Foundation** — `/atlas` layout, tokens, fonts, ISO table, `build-geo.mjs`, the static map SVG
2. **Data layer** — every `lib/atlas/sources/*` client with its traps handled, plus fixtures
3. **The plate** — map, hover cartouche, search, metric dial, rank rail
4. **The dossier** — face note, guilloché, the sheet of denomination notes, security threads,
   sparklines, UV lamp
5. **Story sections** — history strip, people watermarks, anthem, clock, weather, landmarks,
   size overlay, neighbours
6. **Compare, rankings, trade bond, year slider**
7. **Polish** — accessibility, reduced motion, mobile, performance, the indicator verification
   sweep, links added to `/projects` and `/v4/projects`

---

## 10. Definition of done

- `npm run build` and `npm run lint` pass clean
- All four routes render for India, Tuvalu, Taiwan and North Korea without throwing
- The map is visible and usable with JavaScript disabled
- Full keyboard path from `/atlas` to any dossier
- `prefers-reduced-motion` kills every animation
- No horizontal scroll at 375px
- Every number shows its year; every source is attributed
- Nothing under `app/v2/`, `public/v2/`, the root PNGs or `components/SiteFrame.tsx` has changed
