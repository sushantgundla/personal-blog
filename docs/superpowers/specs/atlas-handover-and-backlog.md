# The Atlas — handover and backlog

**Written:** 2026-08-03
**Live at:** https://sushantgundla.com/atlas
**Status:** shipped and deployed. All agreed v1 features are built and verified in a browser.

This document exists so the next session can pick The Atlas up cold: what it is, how it
works, what was decided and why, what bit us, and what is still worth building.

---

## 1. What it is

An interactive world atlas on Sushant's personal blog. A visitor browses an engraved world
map, picks a country, and reads an enormous dossier about it — around 150 measures plus its
story: motto, currency, languages, anthem, famous people, landmarks, history, neighbours.

It is a **personal, exploratory project**, deliberately separated from his professional work.
It appears on `/projects` under its own **Experiments** heading, described as "built so people
can learn about the world by poking at it, not by reading a table." That sentence is the whole
point of the thing, and anything added later should serve it.

### Visual direction — "Denomination"

**Every country is its own banknote. The world map is the uncut printing plate.**

Chosen from three directions. The reason it won: a sheet of banknotes is *already* a grid of
self-contained, ornamented, number-led modules, so the metaphor solves the hard problem — how
to present hundreds of numbers without it reading as a spreadsheet — for free.

Vocabulary used throughout: intaglio engraving, guilloché rosettes, microtext, security
threads, registration marks, perforations, watermarks, seals, the uncut sheet.

Every country gets a **unique guilloché rosette** generated deterministically from a hash of
its ISO3 code — 195 bespoke ornaments for zero content cost. `lib/atlas/guilloche.ts`.

---

## 2. Routes

| Route | What |
|---|---|
| `/atlas` | The plate — engraved world map, metric bar, standings rail, search |
| `/atlas/[iso3]` | One country's dossier |
| `/atlas/compare/[countries]` | Two to five countries, e.g. `ind-vs-fra-vs-jpn` |
| `/atlas/compare` | Same screen with empty slots |
| `/atlas/rankings/[indicator]` | Rank every country by any of ~150 measures |
| `/atlas/api/refresh/[iso3]` | POST only — refetches one country and updates the shared cache |

`/atlas` owns its own layout (`app/atlas/layout.tsx`) and does not use the site chrome.

---

## 3. Architecture

### Data sources — all free, no API keys

| Source | Gives us |
|---|---|
| **World Bank v2** | ~150 indicators, full history from 1960, all-country rankings |
| **Wikidata SPARQL** | motto, anthem + audio, flag, emblem, capital, independence, languages, currency, driving side, plate code, highest/lowest point, UNESCO sites, neighbours (`P47`) |
| **Wikipedia REST** | the country description, revision timestamp |
| **UN Comtrade** | imports and exports by partner |
| **Open-Meteo** | live weather at the capital |
| **Frankfurter** | exchange rates (~30 currencies only) |
| **world-atlas TopoJSON** | map geometry, bundled locally, never fetched |

**REST Countries is dead** — every version returns a deprecation payload and the replacement
needs an API key. Everything it would have given comes from Wikidata plus a local ISO table.

### Caching — the thing that makes it usable

Two layers, no database:

1. **A committed snapshot.** `content/atlas/snapshot/countries/<ISO3>.json` (250 files, ~40 KB
   each) plus `content/atlas/snapshot/rankings.json` (~3 MB, all 150 indicators for all
   countries). Built offline by `scripts/atlas/build-snapshot.mjs`, committed to the repo,
   deployed read-only.
2. **Next's data cache.** `getDossier` reads through `unstable_cache`, tagged per country.

Cold page load went from **65 seconds to about 50 milliseconds** this way.

**The refresh button** had to work on Vercel, where the filesystem is read-only. It therefore
goes through `revalidateTag` and Next's shared cache rather than a file write — proven by
deleting a country's snapshot file and confirming a fresh request still served the refreshed
copy. The file write is kept for local development only.

### Rebuilding the snapshot

```bash
npm run atlas:snapshot                    # everything — hours, sequential by necessity
npm run atlas:snapshot -- --skip-countries # just rankings.json, about two minutes
npm run atlas:snapshot -- --patch-neighbours
```

It is resumable, checkpoints after every country, skips and continues on failure, and writes
`content/atlas/snapshot/.sweep-status.json` on every country and every exit path so a silent
death is visible to anyone with `cat`.

**Do not add concurrency.** It was tried and measured: the World Bank degrades under
simultaneous multi-country load, not merely per request. One country went from ~60s to over
600s. The reason is recorded in the script.

---

## 4. Traps — every one of these cost real time

Read this section before touching the data layer.

| Trap | What happens |
|---|---|
| **`mrv` on a batched request resolves once for the whole batch** | Slow-reporting indicators get filtered out by their fresher batch-mates. Thirteen indicators reported "no data for any country" while the World Bank held figures for 78–212 countries each. Use an explicit date range and reduce to each country's latest value. |
| **One dead indicator code poisons its entire batch of 25** | Three whole sections rendered blank because of a single non-existent code. The failure looks exactly like "the data is missing". |
| **World Bank aggregates are not countries** | 78 of 295 rows are "World", "Euro area", "High income". Unfiltered, the population leaderboard opens with "World" and India sits at #16. Rank only ISO3 codes present in `lib/atlas/iso-countries.ts`. |
| **`mrnev=1` is forbidden with `country/all`** | HTTP 400. Use `mrv` or a date range. |
| **Default `per_page` is 50** | Silently truncates. Always set it explicitly. |
| **Responses carry a UTF-8 BOM** | `JSON.parse(await res.text())` throws. Use `res.json()`. |
| **Random HTTP 400s on valid URLs** | Throttling in disguise. Retry with backoff; treat 400 as retryable. |
| **Comtrade uses its own country codes, not M49** | India is 699 there, 356 in M49. Wrong codes return wrong or empty trade data that looks plausible. |
| **Comtrade's free endpoint caps near 500 rows** | Without `motCode=0&partner2Code=0`, transport-mode and re-export duplicates crowd out the real partners. France's panel never once listed Germany or the USA. |
| **`next/image` refuses SVG** | Every Wikidata flag and coat of arms is an SVG behind a redirect, so none of them ever rendered. Append `?width=N` to a Commons `Special:FilePath` URL and it returns a PNG. |
| **Wikidata returns `http://` URLs** | `next/image` rejects them and takes the whole page down with a 500. Normalise at the source. |
| **Wikidata is community-edited and gets vandalised** | India's head of state came back as "Ganesh rajput" on 2026-08-02. Head of state and head of government render only from `lib/atlas/overrides.ts`. |
| **The famous-people SPARQL query takes 27 seconds** | Too slow to run live, and it times out for large countries. Precomputed into `content/atlas/famous-people.json`. |
| **React renders `<title>` empty on the server when given several children** | Silent hydration mismatch, which can break interactivity for the whole page. Pre-join into one string. |
| **Taiwan, Western Sahara and Vatican City are absent from the World Bank entirely** | Not sparse — absent. Their pages say so once rather than showing ten empty sections. |
| **Frankfurter covers ~30 currencies** | Over half of countries have no exchange rate. That panel is hidden, not faked. |
| **76 countries have no map geometry at 110m resolution** | Reachable only through search and the standings, marked with an asterisk and a visible legend. |

### Correctness rules that must not be traded away

- **Every number renders the year it came from.** Health and education data lag 3–5 years.
- **A rank is withheld below 30 reporting countries**, and so is the world average. Ranking
  nine countries and calling it a world rank is a lie the interface must not tell.
- **`higherIsBetter: null` means no winner.** Population, land area, sector shares, interest
  rates, military spending. Highlighting a "best" there is a political claim, not a fact.
- **A missing value is a dash.** Never zero, never a winner.

---

## 5. What was built

All 21 agreed v1 features, verified in a browser rather than in code. The full list with
status lives in `docs/superpowers/specs/atlas-feature-checklist.md`. Headlines:

- Engraved map with hover, zoom, pan, and paint-by-metric sweeping west to east
- Country dossier: face note with flag, coat of arms, portrait watermark and guilloché;
  ~150 denomination notes; sparklines; UV lamp that makes only record-breaking facts glow
- Compare two to five countries, with slots you add and remove in place
- Rank the world by any of ~150 measures
- Trade ledger and trade-partner arcs drawn across a map
- Anthem, live capital clock, landmarks, famous people, history, size overlay, neighbours
- Year slider back to 1960
- Sources and licences on every page

Quality: production build passes, TypeScript strict clean, no console errors, no horizontal
scroll at 375px, full keyboard path, `prefers-reduced-motion` kills every animation, and the
map works with JavaScript disabled.

### Known limits

- Exchange rates cover ~30 currencies; the panel hides otherwise
- Anthem audio is `.ogg`; Safari cannot play it, so the player hides
- ~70 countries have no free portrait; the rosette grows to fill that space
- `npm run lint` **still does not work** — a `.eslintrc.json` exists but ESLint was never
  installed. `npm install --save-dev eslint eslint-config-next` and then actually run it.

---

## 6. Backlog

### 6.1 The learning section — the big one

**The ask, in the owner's words:** a place where someone can say "surprise me" and get a fact
about a random country; something genuinely useful for learning; a quiz where you are asked a
question about a country and have to answer. Guess-the-flag and guess-the-country are wanted
too — but **this must be its own section with its own entire UI and pages**, not bolted onto
the map.

**Why it fits.** The project's stated purpose is that people learn about the world by poking
at it. Browsing is passive. Being asked a question is not. Everything needed is already
cached locally — 250 countries, ~150 measures each, flags, emblems, mottos, capitals,
neighbours — so **a quiz can run entirely client-side with no API calls at all.**

**Suggested route:** `/atlas/learn`.

**On the visual direction.** The dossier metaphor is a banknote. The natural extension for a
quiz is the other half of that world: **counterfeit detection**. A mint's examination desk —
UV lamp, loupe, watermark checks, a stamp that comes down GENUINE or FORGED. It keeps the
family resemblance while being unmistakably a different room. Worth considering before
defaulting to a generic quiz UI, which would look like every other quiz.

**Game formats, best first:**

1. **Spot the forgery.** Three statements about a country, one fabricated. Pick the fake.
   This is the strongest idea: it fits the metaphor exactly, it is genuinely hard, and the
   fabrication can be generated from real data by perturbing a true value plausibly — which
   also means infinite questions with no authoring. Teaches scale and plausibility, which is
   what people are actually bad at.
2. **Higher or lower.** Two countries, one measure — which is greater? Trivially generated
   from the ranking data, endlessly replayable, and it teaches relative scale better than any
   table. Difficulty tunes itself by how close the two values are.
3. **Guess the flag.** Flag shown, four countries offered. Easy to build, easy to love.
4. **Guess the country.** Facts revealed one at a time — region, then population, then
   currency, then capital — with the score falling as more clues appear. This is the most
   educational format because it rewards inference rather than recall.
5. **Where in the world.** Click the country on the map. Reuses the existing engraved map and
   its geometry; naturally excludes the 76 countries with no shape.
6. **Surprise me.** Not a game — a button. One random country's single most remarkable fact,
   presented as a note. Good as the section's front door and as an idle-state delight.
7. **Country of the day.** One country, the same for everyone, changing daily. Derive it from
   the date so it needs no storage.

**Design notes worth respecting:**

- **Generate questions from the cached data, never hand-author them.** 250 countries × 150
  measures is effectively unlimited material, and hand-authored questions rot.
- **Every question must cite its source and year**, and be dismissible as "this data is from
  2021" — the same honesty rule as the rest of the app. A quiz that asserts a stale figure as
  current is worse than no quiz.
- **Never build a question on a value the app itself would withhold.** If fewer than 30
  countries report a measure, it must not appear in a "which is higher" question either.
- **Answer feedback is the teaching moment.** Getting it wrong should show the real numbers,
  both countries, and a link to the full dossier. That is where the learning actually happens.
- Keep score locally; no accounts.
- Keyboard-first, reduced-motion respected, works at 375px — the same bar as the rest.

### 6.2 Smaller items

- **`npm run lint` does not work.** Install ESLint and actually run it.
- **The compare screen shows each country's flag and name three times** — in the slots, in the
  cards, and in the ledger header. Collapse to two.
- **Landmark photos, people watermarks and the history timeline** were verified by agents but
  never inspected by a human. Worth one careful look.
- **A snapshot freshness indicator.** The data has a capture date; when it is months old the
  page should say so more loudly than it currently does.
- **Scheduled snapshot refresh.** Today it is a manual script. A weekly job that rebuilds and
  opens a PR would keep it honest without anyone remembering.

---

## 7. Working notes for whoever picks this up

- The snapshot sweep takes **hours** and must run sequentially. Start it early.
- **Never run `npm run build` while a dev server is running on the same directory** — both
  write `.next` and the dev server dies with `Cannot find module './NNN.js'`. This cost the
  session several restarts.
- A running Node process keeps the code it loaded at start. Editing a file the sweep imports
  does nothing until it is restarted.
- This repo often has **more than one session working in it at once**. Check `git status`
  before staging, stage deliberately, and never `git add -A`. An earlier commit in this
  session swept up another session's file moves and would have deleted the home page, about,
  articles, projects and radar pages from the live site on merge.
- Deployment is push-to-`main`; Vercel builds in a few minutes. Verify on the real domain,
  not localhost.
