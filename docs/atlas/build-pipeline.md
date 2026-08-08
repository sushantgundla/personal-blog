# The Atlas — build pipeline

Covers how the Atlas's data actually gets built: which script produces which file, in what
order, against which external APIs, and what to run when a source changes. Written from reading
`scripts/atlas/*.mjs`, `lib/atlas/*.ts`, `package.json` and `next.config.js` directly — this is
what the code does today, not what any spec planned. Where this disagrees with
[`design.md`](./design.md), see that file's annotation for why.

## The two kinds of generated file

The Atlas has two different classes of build output, and confusing them is the easiest way to
waste an hour:

1. **Static TypeScript modules under `lib/atlas/`** — small, rarely-regenerated, hand-reviewed
   after generation. Committed to git. Regenerate only when the underlying reference data
   actually changes (a new country, a new ISO code, Comtrade's reference lists updating).
2. **The country snapshot under `content/atlas/snapshot/`** — 250 country JSON files plus one
   `rankings.json`, ~250 files, large, regenerated wholesale periodically. Also committed to
   git, but treated as a cache: it's fine (expected, even) for it to go stale between rebuilds.

## Script reference

| Script | Produces | Reads from | External APIs | npm script |
|---|---|---|---|---|
| `scripts/atlas/build-iso.mjs` | `lib/atlas/iso-countries.ts` | — | Wikidata SPARQL | `npm run atlas:iso` |
| `scripts/atlas/build-geo.mjs` | `lib/atlas/geo/world-paths.ts` | `lib/atlas/iso-countries.ts` (parsed as text, not imported — see below), `world-atlas` npm package (bundled TopoJSON, no network) | none | `npm run atlas:geo` |
| `scripts/atlas/build-comtrade-codes.mjs` | `lib/atlas/comtrade-codes.ts` | — | UN Comtrade reference files (`Reporters.json`, `partnerAreas.json`) | `npm run atlas:comtrade` |
| `scripts/atlas/build-people.mjs` | `content/atlas/famous-people.json` | `lib/atlas/iso-countries.ts` (parsed as text) | Wikidata SPARQL | `npm run atlas:people` |
| `scripts/atlas/build-snapshot.mjs` | `content/atlas/snapshot/countries/*.json`, `content/atlas/snapshot/rankings.json` | `lib/atlas/iso-countries.ts`, `indicators.ts`, `overrides.ts`, `rankings.ts` (imported directly as TypeScript) | World Bank, Wikidata, Wikipedia, UN Comtrade, Open-Meteo, Frankfurter | `npm run atlas:snapshot` — see below |
| `scripts/atlas/build-deck.mjs` | `content/atlas/learn/deck.json` | `content/atlas/snapshot/rankings.json`, `content/atlas/snapshot/countries/*.json` | none (reads the committed snapshot, offline) | `npm run atlas:deck` |
| `scripts/atlas/verify-indicators.mjs` | console report only, no file written | `lib/atlas/indicators.ts` (parsed as text) | World Bank | `npm run atlas:verify` |
| `scripts/atlas/learn-selfcheck.mjs` | console pass/fail only, no file written | `lib/atlas/learn/deck.ts` (which reads `content/atlas/learn/deck.json`), `lib/atlas/learn/questions/index.ts`, `lib/atlas/learn/quiz-indicators.ts`, `lib/atlas/iso-countries.ts`, `lib/atlas/learn/confusable.ts` (all imported directly as TypeScript, self-registers `ts-resolve-hook.mjs`) | none (offline) | `npm run atlas:learn-selfcheck` |
| `scripts/atlas/smoke.mjs` | console pass/fail only, no file written | the four static files above | none (offline) | `npm run atlas:smoke` |
| `scripts/atlas/ts-resolve-hook.mjs` | nothing on its own — a Node module-resolution hook used *by* `build-snapshot.mjs` and `learn-selfcheck.mjs` | — | — | not run directly |

## Build order, from a clean checkout

Later scripts depend on earlier scripts' output, so this order matters the first time (or any
time the ISO table changes):

```bash
npm run atlas:iso                                     # 1. lib/atlas/iso-countries.ts
npm run atlas:geo                                      # 2. lib/atlas/geo/world-paths.ts (needs #1)
npm run atlas:comtrade                                 # 3. lib/atlas/comtrade-codes.ts (independent of #1/#2, but conventionally run here)
npm run atlas:people                                   # 4. content/atlas/famous-people.json (needs #1)
npm run atlas:snapshot                                 # 5. content/atlas/snapshot/* (needs #1, #3, #4 is NOT required — see note below)
npm run atlas:deck                                      # 6. content/atlas/learn/deck.json (needs #5)
npm run atlas:verify                                    # 7. QA only, run before shipping new indicator codes
npm run atlas:learn-selfcheck                           # 8. QA only, run after touching the learning section's question generators
npm run atlas:smoke                                     # 9. QA only, cheap sanity check, safe to run anytime
```

Step 4 (`build-people.mjs`) doesn't have to run before step 5 — `build-snapshot.mjs`
deliberately does **not** capture famous people into the snapshot files (see the note in
`fetchOneCountry`'s doc comment in that script). `lib/atlas/dossier.ts` reads
`content/atlas/famous-people.json` fresh on every request instead, specifically so editing that
file takes effect immediately without a snapshot rebuild.

## `build-snapshot.mjs` — the important one, and its exact command

`npm run atlas:snapshot` runs it, but the underlying command is exact and worth knowing if
you ever need to run it by hand:

```bash
node --experimental-loader=./scripts/atlas/ts-resolve-hook.mjs scripts/atlas/build-snapshot.mjs
```

Why it's shaped this way:

- `build-snapshot.mjs` **imports the real `lib/atlas/*.ts` source files directly** — the same
  `fetchLatestIndicators`, `fetchDossierFacts`, `computeAllRankings`, and so on that the running
  Next.js app uses — rather than keeping a second copy of the fetch logic in plain JavaScript.
  This works because the Node version this repo runs on can import a `.ts` file directly
  (built-in TypeScript type-stripping, no separate compile step).
- But `lib/atlas/*.ts` files import each other with extensionless specifiers (`from "../format"`),
  which is normal, bundler-friendly TypeScript style — and which Node's own module resolver,
  unlike webpack/SWC, refuses to follow (`ERR_MODULE_NOT_FOUND`) because plain ESM resolution
  needs an explicit extension.
- `ts-resolve-hook.mjs` is a small `--experimental-loader` that patches Node's resolver: if a
  relative import with no extension doesn't resolve, retry it with `.ts` appended. That's the
  only thing it does. `--experimental-loader=./scripts/atlas/ts-resolve-hook.mjs` on the command
  above is what wires it in — omit it and the script fails on the first `lib/atlas` import.

Useful flags (see the script's own `main()`):

```bash
--limit N                 # stop after N countries (testing)
--only ISO3,ISO3           # only these countries
--force                    # re-fetch even countries already captured
--skip-rankings             # countries only, skip rankings.json
--skip-countries             # rankings.json only, skip country files
--patch-neighbours          # backfill the `neighbours` field into already-captured files
                             #   without a full re-fetch (added 2026-08-03, see below)
```

A full run over all ~250 countries **can take up to an hour**, more under heavy World Bank
throttling — see "Timing and throttling" below. It's resumable: it reads which country files
already exist and skips them, and checkpoints after every single country (not just at the end),
so an interrupted run loses nothing. A crash, `SIGTERM` or `SIGINT` is recorded in
`content/atlas/snapshot/.sweep-status.json`, which is the way to tell "still running" from
"silently died hours ago" without having watched the terminal — `cat` that file.

### What actually gets fetched, per country

For each country, `build-snapshot.mjs` calls the same six source functions
`lib/atlas/dossier.ts`'s live path does, via `Promise.allSettled` so one dead source never blanks
a country's file:

| Call | Client | External API |
|---|---|---|
| `fetchLatestIndicators` | `lib/atlas/sources/worldbank.ts` | World Bank v2 |
| `fetchTimeSeries` | `lib/atlas/sources/worldbank.ts` | World Bank v2 |
| `fetchDossierFacts` | `lib/atlas/sources/wikidata.ts` | Wikidata SPARQL |
| `fetchSummary` | `lib/atlas/sources/wikipedia.ts` | Wikipedia REST |
| `fetchTradeSummary` | `lib/atlas/sources/comtrade.ts` | UN Comtrade preview |
| `fetchCapitalWeather` | `lib/atlas/sources/meteo.ts` | Open-Meteo (runs after Wikidata resolves the capital's coordinates) |
| `fetchRate` | `lib/atlas/sources/fx.ts` | Frankfurter (runs after Wikidata resolves the currency code) |

A country file is only written if **at least one** of those seven calls succeeded — a country
where every source failed is left uncaptured so the next run retries it automatically, rather
than being frozen with an all-empty file.

### Concurrency: sequential on purpose

`CONCURRENCY` in `build-snapshot.mjs` is `1` — countries are fetched one at a time, not in
parallel, with a 4-second pause between them on top of `worldbank.ts`'s own retry/backoff. This
is a deliberate finding, documented in the script: running 3 countries concurrently in testing
made two of them take 477s and 611s (against a ~60–80s/country sequential baseline) — the World
Bank throttles by simultaneous *load*, not just by request count, so concurrency made it slower,
not faster. Don't raise `CONCURRENCY` without re-testing on a fresh sample and watching elapsed
time, not just the ok/fail count — the failure mode is silent (everything still reports "ok",
just far slower).

### `--patch-neighbours`

Added 2026-08-03. Backfills the `wikidata.data.neighbours` field (Wikidata `P47`) into files
captured before that date, when `Neighbours.tsx` fetched it separately per-request instead of it
being part of the main dossier SPARQL query. Patches just that one field per already-captured
file — much cheaper than a full re-fetch, and it exists specifically so a schema change like this
doesn't require re-running the whole hour-long sweep.

## `build-comtrade-codes.mjs`, `build-iso.mjs`, `build-geo.mjs`, `build-people.mjs` — when to rerun

- **`build-iso.mjs`** — only if the underlying Wikidata ISO/M49 data changes, or a new country
  needs adding. Downstream of this file: `build-geo.mjs`, `build-people.mjs`, and the join every
  other source uses. Its `EXCLUDE_ISO3` map (defunct states like the USSR, Yugoslavia,
  Czechoslovakia) and `ISO3_OVERRIDES` (Kosovo `XKS` → `XKX`) exist to stop those from colliding
  with a current country's M49 code — read the comments there before touching it.
- **`build-geo.mjs`** — only if `iso-countries.ts` changes in a way that affects the M49 join, or
  the `world-atlas` npm package is upgraded to a new TopoJSON resolution.
- **`build-comtrade-codes.mjs`** — only if UN Comtrade's own reference lists change (it fetches
  `Reporters.json` and `partnerAreas.json` fresh every run). Throws loudly if it ever finds two
  active reporter codes for the same ISO3 — that would silently corrupt every trade lookup
  downstream, so this is a deliberate hard stop, not a bug to work around.
- **`build-people.mjs`** — independent of the snapshot. Safe to rerun anytime; it's resumable and
  only fetches countries not already in `content/atlas/famous-people.json`. Use `--force`-style
  re-fetching is not built in — delete an ISO3's entry from the JSON file first if you want to
  refresh just that one country.

## Runtime: how the read side uses all this

Documenting the write side (this file, so far) isn't the whole story — the read side determines
why the snapshot exists at all:

1. `lib/atlas/dossier.ts`'s `getDossier(iso3)` reads `content/atlas/snapshot/countries/{iso3}.json`
   first — a plain file read, no network. Also true of `lib/atlas/rankings.ts` reading
   `content/atlas/snapshot/rankings.json`.
2. If that file doesn't exist, it falls back to `fetchLiveDossier(iso3)` — the live,
   throttle-prone `Promise.allSettled` fetch across all seven sources.
3. Either way, the result goes into Next's Data Cache (`unstable_cache`, tagged
   `atlas-dossier-{iso3}`), which on Vercel is shared across every instance and region of the
   deployment — not just the process that computed it.
4. The **refresh button** on a dossier page (`app/atlas/api/refresh/[iso3]/route.ts`, calling
   `refreshDossier()`) does a live re-fetch, best-effort writes it back to the snapshot file
   (works locally; silently a no-op on Vercel's read-only deployed filesystem), and — the part
   that actually matters on Vercel — pushes the fresh value straight into the Data Cache and
   calls `revalidateTag`, so every visitor after the one who clicked refresh gets the new data
   from cache, with no live fetch of their own. A 5-minute cooldown per country, keyed in memory,
   guards against a refresh loop or crawler hammering.

This two-layer cache (committed snapshot file, then Data Cache on top) is why the cold-load
problem described in [`feature-checklist.md`](./feature-checklist.md)'s "Known limits" (30–90s
first load) is now the exception, not the rule — it only recurs for a country genuinely missing
from the snapshot.

## Why `next.config.js` sets `staticPageGenerationTimeout: 420`

```js
// Next's default per-page static-generation timeout is 60s. Each Atlas
// country page fires ~11 requests against APIs that throttle hard (World
// Bank, Wikidata, Comtrade) — measured live at 204s for /atlas/isl and
// 280s for /atlas/ind under throttling...
staticPageGenerationTimeout: 420,
```

That comment (and the design-spec path it cites, `docs/superpowers/specs/2026-08-02-country-explorer-design.md`,
now moved to [`design.md`](./design.md)) describes the pre-snapshot world: `next build` only
prerenders 25 countries (`PRERENDER_ISO3` in `app/atlas/[iso3]/page.tsx`), but each of those still
called `fetchLiveDossier` at build time before the snapshot existed, and that could take minutes
under throttling — long enough that Next's 60-second default would `SIGTERM` the build worker
mid-fetch and restart the same slow work.

**This is not fully obsolete.** `getDossier()` now checks the committed snapshot first even
during `next build`'s prerendering, so a build against a snapshot with all 25 prerendered
countries already captured should be fast. The 420-second ceiling remains a real safety margin
for: a prerendered country missing from the snapshot (a fresh addition to `PRERENDER_ISO3` before
the next `build-snapshot.mjs` sweep), or the snapshot itself being deleted or corrupted. Don't
lower this without checking that every `PRERENDER_ISO3` entry has a current snapshot file.

## Testing

- `scripts/atlas/smoke.mjs` — offline, no network, no server. Checks that
  `lib/atlas/geo/world-paths.ts` has 170+ paths, `lib/atlas/iso-countries.ts` and
  `lib/atlas/comtrade-codes.ts` are present and non-empty, and
  `content/atlas/famous-people.json` is valid JSON with no lingering `http://` image URLs (a
  known regression — `next/image` rejects non-`https://` sources under
  `images.remotePatterns`). Cheap; safe to run anytime, including in CI.
- `lib/atlas/__tests__/` — unit tests for `guilloche.ts` (deterministic path from an ISO3 hash),
  `ink.ts` (hue always passes contrast), `format.ts` (null/zero/negative/trillions), and a hash
  test, plus `iso3-fixture.ts` and three captured fixtures in `lib/atlas/fixtures/`
  (`ind.json` rich, `tuv.json` sparse, `twn.json` absent from the World Bank) — the same
  three-country test matrix `design.md` §8 specifies (that section also names North Korea as a
  fourth; only three fixture files exist in the repo).
- `scripts/atlas/verify-indicators.mjs` — the pre-ship sweep of every code in
  `lib/atlas/indicators.ts` (151 as of this writing) against 8 sample countries, in batches of 20,
  10+ seconds apart. Distinguishes a code the API positively confirms as invalid from one that
  merely timed out ("inconclusive") so a bad network run never wrongly drops a real code — rerun
  it to settle anything reported inconclusive. Run this after adding or changing indicator codes,
  before shipping.
