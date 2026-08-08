# The Atlas — feature checklist

Every feature agreed with the owner, and whether it works in the browser.
**"Works" means seen working on a running server, not present in the codebase.**

Last verified 2026-08-02 against `http://localhost:3456`. Moved here from
`docs/superpowers/specs/atlas-feature-checklist.md`; content unchanged except this note.

> **One entry below is now stale.** "Known limits" says cold page loads take 30–90 seconds and
> that only 25 countries plus 21 leaderboards are prerendered. The 25/21 prerender figures are
> still accurate. The 30–90s cold-load number is not: it was fixed the next day (2026-08-03) by
> committing `content/atlas/snapshot/*` and reading it before any live call — see
> [`build-pipeline.md`](./build-pipeline.md). A country not yet in the snapshot still falls back
> to a live fetch, so a cold load is still possible for a genuinely uncaptured country, just no
> longer the normal case.

## Agreed features

| # | Feature | Where | Status |
|---|---|---|---|
| 1 | Map: pick a country → its dossier | `/atlas` | works |
| 2 | Paint the map by any metric, sweeping west to east | `/atlas` | works |
| 3 | Rankings / leaderboards | `/atlas`, `/atlas/rankings/[indicator]` | works |
| 4 | Search and jump, keyboard-first, `/` to focus | every `/atlas` page | works |
| 5 | Compare two countries | `/atlas/compare/[a]-vs-[b]` | works |
| 6 | Dossier — ~150 numbers as denomination notes | `/atlas/[iso3]` | works |
| 7 | Face note — flag, portrait, coat of arms, guilloché | `/atlas/[iso3]` | works |
| 8 | UV lamp — only record-breaking facts glow | `/atlas/[iso3]` | works — 56 facts glow on India |
| 9 | Trade ledger, imports and exports by partner | `/atlas/[iso3]` | works |
| 10 | Trade partner arcs drawn on a map | `/atlas/[iso3]` | works |
| 11 | Neighbour hops | `/atlas/[iso3]` | works |
| 12 | National anthem playback | `/atlas/[iso3]` | works, ~70% of countries have audio |
| 13 | Live clock at the capital | `/atlas/[iso3]` | works |
| 14 | Landmark photos | `/atlas/[iso3]` | works |
| 15 | Country size overlay | `/atlas/[iso3]` | works |
| 16 | Famous people as watermarks | `/atlas/[iso3]` | works |
| 17 | History timeline | `/atlas/[iso3]` | works |
| 18 | Year slider, 1960 → now | `/atlas/[iso3]` | works |
| 19 | Wikipedia description — what the country *is* | `/atlas/[iso3]` | works |
| 20 | Facts ledger — motto, currency, languages, driving side, highest point, independence, plate code, calling code, TLD, anthem | `/atlas/[iso3]` | works |
| 21 | Sources and attribution | every page | works |
| 22 | Spot the forgery — three statements about a country, pick the fake | `/atlas/learn/forgery` | in codebase — not seen working in a browser |
| 23 | Higher or lower — two countries, one measure, which is greater | `/atlas/learn/higher-lower` | in codebase — not seen working in a browser |
| 24 | Guess the flag — a flag, four country names | `/atlas/learn/flags` | in codebase — not seen working in a browser |
| 25 | Guess the country — clues revealed one at a time (Region → Population → Language → Neighbour → Capital), a falling display-only score | `/atlas/learn/guess-country` | in codebase — not seen working in a browser |
| 26 | Where in the world — click the named country on the engraved map, keyboard-playable, honest miss feedback (neighbour / same region / far) instead of a fake distance | `/atlas/learn/where-in-the-world` | in codebase — not seen working in a browser |
| 27 | Surprise me — one random country's most remarkable fact | `/atlas/learn` | in codebase — not seen working in a browser |
| 28 | Country of the day — one country, same for everyone, changes daily, not a game | `/atlas/learn` | in codebase — not seen working in a browser |

Quizzes and games are no longer out of scope — the learning section above shipped 2026-08-08.
Still explicitly out of scope, at the owner's request: user accounts, favourites or saved
comparisons, a 3D globe, and any data source that needs an API key or a paid plan.

## Quality checks

| Check | Result |
|---|---|
| `npm run build` | passes, exit 0 |
| TypeScript strict | clean |
| 375px, no horizontal scroll | passes on map, dossier, compare |
| Keyboard only | search → dial → rank rail → map country → Enter opens dossier |
| Focus visibility | visible everywhere; map countries use an ember stroke |
| `prefers-reduced-motion` | zero animations running |
| Console errors | none on map, dossier, compare, rankings |
| Works without JavaScript | map renders, countries are links, search falls back to a form |

## Defects found and fixed

1. **World Bank aggregates ranked as countries** — the standings opened with World, IDA & IBRD total and Low & middle income; India sat at #16. Now ranks only real ISO3 codes.
2. **One dead indicator code poisoned a whole batch of 25** — LAND, NATURE and STATE all rendered blank as a result.
3. **Ranks computed over a handful of countries** — school enrolment showed "#7 of 9" beside a world average. Each country now contributes its own latest value (9 → 160 countries); below thirty countries the rank and the average are both withheld.
4. **Flags and coats of arms never rendered** — Commons serves them as SVG behind a redirect, which `next/image` rejects. Asking Commons for a width returns a raster.
5. **Two search boxes** — the component rendered inline and also moved a copy into the header. Renders once now, and works on every page.
6. **No loading state** — clicking any of the 225 non-prerendered countries showed nothing, not even a URL change, for up to 95 seconds.
7. **Comtrade used the wrong country codes** — it has its own numbering, not M49. Its free endpoint also caps near 500 rows, so without transport-mode and re-export filters France's largest partners were crowded out: Germany and the USA never appeared.
8. **`http://` image URLs** from Wikidata took whole pages down with a 500.
9. **Guilloché rotated around its corner** instead of its centre, swinging the rosette out of frame.
10. **Note texture painted over the numerals.**
11. **Hydration mismatch** — React renders an SVG `<title>` empty on the server when given several children.
12. **Taiwan, Western Sahara and Vatican City** showed ten sections of "unavailable". They are not World Bank members; the page now says so once.
13. **Empty notes rendered as blank cards** — dropped now, with an honest count per section.
14. **150 requests per dossier** — batched to 10 shared across the site, behind a concurrency limit.
15. **`npm run lint` didn't work** — `eslint` and `eslint-config-next` were installed locally but
    never declared in `package.json`, so a clean `npm ci` broke it. Both are now declared;
    `npx next lint` reports zero errors (it previously reported two). This closes the "Known
    limits" item below and the backlog's §6.2 item — see
    [`atlas-handover-and-backlog.md`](../superpowers/specs/atlas-handover-and-backlog.md).
16. **`famous-people.json` (712 KB) was re-parsed on every `getDossier()` call** — now cached at
    module scope in `lib/atlas/dossier.ts`.
17. **`rankings.json` (2.9 MB) was parsed fresh on every cold start** — now behind
    `unstable_cache` in `lib/atlas/rankings.ts`, so cold starts share the parse.
18. **`Sparkline.tsx` created about 20 `IntersectionObserver`s per dossier** — now one shared
    observer for the page.
19. **`app/sitemap.ts` had zero Atlas entries** — it now lists `/atlas`, all 250 country
    dossiers (with each snapshot's real `capturedAt` as `lastModified`), all 213 rankings,
    `/atlas/compare`, `/atlas/learn` and its five playable games.
20. **AtlasSearch and CompareSlots' SlotSearch comboboxes had no `aria-activedescendant`** —
    both now set it, with a per-option `id`, so a screen reader announces the highlighted
    option while typing.
21. **CapitalClock's ticking time was announced every second** by a screen reader — it now sets
    `aria-live="off"` on the clock digits.

## Known limits

- Cold page loads take 30–90 seconds when the open-data APIs are throttling. Once cached, pages are instant, and 25 countries plus 21 leaderboards are prerendered at build.
- Exchange rates cover roughly 30 currencies; the panel is hidden for the rest.
- 76 small countries have no map geometry at this resolution; they are reachable by search and the rankings rail. Where in the world only asks about the 174 of 250 that do.
- Health and education figures lag 2–5 years. Every number shows the year it is from.
- The compare screen still shows a country's flag and name three times when comparing exactly
  two countries — the third repeat there is `FaceNote.tsx`, the full hero banknote, kept
  deliberately. For three to five countries this is fixed (see the backlog).
