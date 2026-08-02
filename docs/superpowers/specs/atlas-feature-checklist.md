# The Atlas — feature checklist

Every feature agreed with the owner, and whether it actually works in the browser.
**"Built" means seen working on a running server, not present in the codebase.**

Audited 2026-08-02 against `http://localhost:3456`.

## Agreed features

| # | Feature | Component | Status |
|---|---|---|---|
| 1 | Map: pick a country → its dossier | `Plate.tsx` | works |
| 2 | Paint the map by any metric | `MetricDial.tsx` | works |
| 3 | Rankings / leaderboards | `RankRail.tsx`, `/atlas/rankings/[indicator]` | **broken — aggregates polluting ranks** |
| 4 | Search and jump, keyboard-first | `AtlasSearch.tsx` | **broken — renders twice** |
| 5 | Compare two countries | `/atlas/compare/[pair]` | works |
| 6 | Country dossier, hundreds of numbers | `NoteSheet.tsx`, `DenominationNote.tsx` | works |
| 7 | Face note — flag, portrait, guilloché | `FaceNote.tsx` | **broken — no flag, no portrait, clipped rosette** |
| 8 | UV lamp — only remarkable facts glow | `UvLamp.tsx` | wired, unverified |
| 9 | Trade partners, imports and exports | `TradeBond.tsx` | **MISSING from the dossier — only on compare** |
| 10 | Trade partner lines drawn on the map | — | **NEVER BUILT** |
| 11 | Neighbour hops | `Neighbours.tsx` | wired, unverified |
| 12 | National anthem playback | `AnthemPlayer.tsx` | wired, unverified |
| 13 | Live clock at the capital | `CapitalClock.tsx` | wired, unverified |
| 14 | Landmark photos | `LandmarkStrip.tsx` | wired, unverified |
| 15 | Country size overlay | `SizeOverlay.tsx` | wired, unverified |
| 16 | Famous people as watermarks | `PeopleWatermarks.tsx` | wired, unverified |
| 17 | History timeline | `HistoryStrip.tsx` | wired, unverified |
| 18 | Year slider, 1960 → now | `YearSlider.tsx` | wired, unverified |
| 19 | Wikipedia summary — what the country *is* | — | **MISSING — no country description anywhere** |
| 20 | Wikidata facts panel — motto, currency, languages, driving side, highest point, independence, plate code, calling code, TLD | — | **MISSING — no dedicated panel** |
| 21 | Sources and attribution | `Sources.tsx` | works |

Explicitly out of scope: quizzes and games.

## Known defects

1. **Aggregates ranked as countries.** `/atlas` standings read #1 World, #2 IDA & IBRD total, #3 Low & middle income. India shows `#16 of 264` when it should be about `#2 of 195`. Clicking "World" goes to `/atlas/WLD`, which 404s. Rank only ISO3 codes present in `lib/atlas/iso-countries.ts`.
2. **Two search boxes.** `AtlasSearch` renders inline and also moves a node into `#atlas-search-slot`, leaving two visible inputs.
3. **Face note is mostly empty.** No flag (Wikidata `P41`), no portrait despite `famous-people.json` having one for India, guilloché clipped into scattered arcs.
4. **LAND indicators return nothing** — forest, arable land, land area all blank.
5. **Trailing grid cell** renders as a solid rectangle when a section's note count is not a multiple of 3.

## Definition of done

- Every row above says "works", verified on a running server
- `/atlas/WLD` and any other aggregate code is unreachable from the UI
- Exactly one search box
- `npm run build` exits 0
- No horizontal scroll at 375px
- Every animation inside the `prefers-reduced-motion` block
