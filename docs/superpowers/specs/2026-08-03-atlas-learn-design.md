# The Atlas — the learning section (`/atlas/learn`)

**Written:** 2026-08-03
**Status:** design approved, implementation authorised with full autonomy.
**Predecessor:** `docs/superpowers/specs/atlas-handover-and-backlog.md` §6.1

---

## 1. What this is

A separate section of The Atlas where a visitor is *asked* something instead of
browsing. The project's stated purpose is that people learn about the world by poking at
it; browsing is passive, being asked a question is not.

Everything a question needs is already in the repo — 250 country snapshots, ~150 measures
each with ranks and years, flags, capitals, languages, neighbours. Nothing here calls an
external API at play time.

### The frame — "the mint's training floor"

You are an apprentice at the mint being tested. Chosen over a counterfeit-detection desk
because it carries a **progression**, which a one-off examination bench does not: ledger
cards, a wall of graded results, and a grade you climb.

It shares the banknote world of `/atlas` (same `atlas.css` tokens, same engraving
vocabulary, same guilloché) but is unmistakably a different room: paper record-keeping
rather than map and dossier.

Vocabulary: the floor, the ledger, a card, a grade, a stamp, the wall, the run (one round
of ten).

### v1 scope — four games

1. **Spot the forgery** — three statements about one country, one fabricated. Pick the fake.
2. **Higher or lower** — two countries, one measure, which is greater.
3. **Guess the flag** — a flag and four country names.
4. **Surprise me** — not a game. A button on the front door that deals one random country's
   single most remarkable fact as a ledger card.

Deliberately *not* in v1 (from the backlog, still wanted later): Guess the country,
Where in the world, Country of the day.

---

## 2. Routes

| Route | What |
|---|---|
| `/atlas/learn` | The floor — four game cards, your grade, the wall of past runs, the Surprise me button |
| `/atlas/learn/[game]` | One run of ten. `game` ∈ `forgery`, `higher-lower`, `flags` |
| `/atlas/learn/api/round` | GET — returns a batch of ready-made questions as JSON |

`/atlas/learn/*` sits inside the existing `app/atlas/layout.tsx`, so it inherits
`atlas.css`, the hatch defs and the top bar. It does **not** get its own layout.

An unknown `[game]` value renders `not-found`.

---

## 3. Architecture

### 3.1 Why the server generates questions

Decided by the owner: questions come from the server on request, and the request must be
very fast. Two mechanisms make that true.

**A prebuilt deck, cached in memory.** `scripts/atlas/build-deck.mjs` reads the 250
country snapshots plus `rankings.json` once, offline, and writes one compact file:
`content/atlas/learn/deck.json`. `lib/atlas/learn/deck.ts` reads that file once per server
process and holds it in module scope — the same pattern `lib/atlas/rankings.ts` already
uses for the snapshot. After the first request in a process, generating a question is pure
CPU over an in-memory object: about a millisecond.

Without the prebuilt deck, every cold start on Vercel would read and parse 250 files
(~10 MB). With it, one file read.

`deck.json` is a **server-side artifact**. It is never sent to the browser.

**Batching plus prefetch.** The route returns ten questions at once. The play screen
requests the next batch when the player reaches question seven, so the fetch overlaps with
play. After the first request the player never waits.

Answers travel inside the batch so feedback is instant with no second round trip. A player
could read them in the network tab; the score is local and there are no accounts, so they
would only be cheating themselves. This is an accepted trade, not an oversight.

### 3.2 File plan

```
scripts/atlas/build-deck.mjs           # offline build -> content/atlas/learn/deck.json
scripts/atlas/learn-selfcheck.mjs      # runner-free invariant checks (this repo has no test runner)
content/atlas/learn/deck.json          # committed, server-side only

lib/atlas/learn/types.ts               # the contract in §4 — shared by every other file here
lib/atlas/learn/deck.ts                # loads deck.json, module-scope cache, getDeck()
lib/atlas/learn/rng.ts                 # seeded PRNG + pick/shuffle/sample helpers
lib/atlas/learn/quiz-indicators.ts     # PRIMARY_CODES — the measures that make good questions
lib/atlas/learn/questions/forgery.ts
lib/atlas/learn/questions/higher-lower.ts
lib/atlas/learn/questions/flags.ts
lib/atlas/learn/questions/surprise.ts
lib/atlas/learn/questions/index.ts     # buildRound(game, count, seed) -> Round
lib/atlas/learn/__tests__/*.test.ts    # runner-ready, same style as lib/atlas/__tests__

app/atlas/learn/page.tsx               # the floor (server component)
app/atlas/learn/[game]/page.tsx        # one run (server shell + client play screen)
app/atlas/learn/[game]/not-found.tsx
app/atlas/learn/api/round/route.ts     # GET ?game=&count=&seed=

app/atlas/learn/_components/GameCard.tsx        # floor: one game's card
app/atlas/learn/_components/GradeSeal.tsx       # floor: your grade, stamped
app/atlas/learn/_components/ResultsWall.tsx     # floor: last 20 runs (client, localStorage)
app/atlas/learn/_components/SurpriseCard.tsx    # floor: the Surprise me button + dealt card
app/atlas/learn/_components/floor.module.css

app/atlas/learn/_components/PlayScreen.tsx      # the run: state machine, prefetch, keyboard
app/atlas/learn/_components/ForgeryQuestion.tsx
app/atlas/learn/_components/HigherLowerQuestion.tsx
app/atlas/learn/_components/FlagQuestion.tsx
app/atlas/learn/_components/Verdict.tsx         # after-answer teaching panel
app/atlas/learn/_components/RunSummary.tsx      # end of ten
app/atlas/learn/_components/play.module.css

lib/atlas/learn/progress.ts            # localStorage read/write, grades, streaks
```

`package.json` gains `"atlas:deck": "node scripts/atlas/build-deck.mjs"`.

---

## 4. The contract (`lib/atlas/learn/types.ts`)

Every file above is written against exactly this. Do not diverge.

```ts
export type GameId = 'forgery' | 'higher-lower' | 'flags';

/** One country as the deck stores it. */
export interface DeckCountry {
  iso3: string;
  name: string;
  region: string | null;
  flagUrl: string | null;      // already https, already ?width= (a PNG, not the SVG)
  capital: string | null;
  languages: string[];
  drivingSide: string | null;
  tld: string | null;
  neighbours: string[];        // ISO3 only
}

/** One measure the deck considers safe to ask about. */
export interface DeckIndicator {
  code: string;
  label: string;               // plain English, straight from lib/atlas/indicators.ts
  unit: string;
  format: 'number' | 'currency' | 'percent' | 'years' | 'per1000';
  higherIsBetter: boolean | null;
  section: string;
  outOf: number;               // countries reporting — always >= 30, see §6
  min: number;                 // lowest reported value, for plausibility bounds
  max: number;                 // highest reported value
}

/** value, year, rank — packed as an array to keep deck.json small. */
export type DeckValue = [value: number, year: string, rank: number];

export interface Deck {
  capturedAt: string;
  countries: DeckCountry[];
  indicators: DeckIndicator[];
  /** values[indicatorCode][iso3] */
  values: Record<string, Record<string, DeckValue>>;
}

/** Where a fact came from — rendered on every question, no exceptions. */
export interface Provenance {
  source: 'World Bank' | 'Wikidata';
  year: string | null;
  /** Deep link to the dossier the fact is drawn from. */
  href: string;               // e.g. "/atlas/ind"
}

interface QuestionBase {
  id: string;                 // stable within a round, used as a React key
  game: GameId;
  prompt: string;
  /** Index into `options` that is correct. */
  answer: number;
  /** Shown after answering — this is where the learning happens. */
  verdict: {
    headline: string;
    rows: Array<{ label: string; value: string; year: string | null; href: string | null }>;
    note: string | null;
  };
  provenance: Provenance[];
}

export interface ForgeryQuestion extends QuestionBase {
  game: 'forgery';
  country: { iso3: string; name: string; flagUrl: string | null };
  options: Array<{ text: string; measure: string }>;   // exactly 3, one is forged
}

export interface HigherLowerQuestion extends QuestionBase {
  game: 'higher-lower';
  measure: string;            // the indicator label, e.g. "Life expectancy"
  options: Array<{ iso3: string; name: string; flagUrl: string | null }>;  // exactly 2
}

export interface FlagQuestion extends QuestionBase {
  game: 'flags';
  flagUrl: string;
  options: Array<{ iso3: string; name: string }>;      // exactly 4
}

export type Question = ForgeryQuestion | HigherLowerQuestion | FlagQuestion;

export interface Round {
  roundId: string;
  game: GameId;
  questions: Question[];
}

/** The Surprise me card — not part of a round. */
export interface SurpriseCard {
  iso3: string;
  name: string;
  flagUrl: string | null;
  headline: string;           // "3rd highest forest cover on Earth"
  detail: string;             // "31.2% of land area, 2022 — #3 of 189"
  href: string;
  provenance: Provenance;
}
```

---

## 5. The deck build (`scripts/atlas/build-deck.mjs`)

Plain Node ESM, like every other script in `scripts/atlas/`. It imports the TypeScript
catalogue directly the way the existing scripts do (Node 26 strips types; see
`scripts/atlas/ts-resolve-hook.mjs` for the pattern already in use).

Steps:

1. Read `content/atlas/snapshot/rankings.json`.
2. For each of the ~150 indicator codes, keep it only if at least **30** countries report a
   value *and* a rank — the same `MIN_RANKABLE_COUNTRIES` bar `lib/atlas/rankings.ts`
   already enforces. Record `outOf`, `min`, `max`.
3. Drop any row whose `iso3` is not in `lib/atlas/iso-countries.ts` — World Bank aggregates
   ("World", "Euro area", "High income") are not countries and must never appear in a
   question. This trap is documented in the handover and it is the single easiest way to
   ship a wrong quiz.
4. Read the 250 files in `content/atlas/snapshot/countries/`. From each, take
   `wikidata.data` and keep only the deck fields. Normalise every image URL through the
   same rules `lib/atlas/format.ts` uses (`toHttps`, `commonsThumbnail`) so no SVG and no
   `http://` URL ever reaches `next/image`.
5. Write `content/atlas/learn/deck.json`, pretty-printed at zero indent (it is a build
   artifact, not something anyone reads).
6. Print a summary: indicators kept and dropped, countries with a flag, countries with a
   capital, total file size.

**Currency is excluded from the deck.** Wikidata gives France's currency as "CFP Franc",
which is wrong for the mainland. 244 countries have a currency value and an unknown number
of them are wrong in the same way. A quiz that asserts a wrong fact is worse than a smaller
quiz. Mottos are excluded too, for a different reason — only 34 of 250 countries have one,
so it cannot carry a game.

Fields the deck *does* trust: flag, capital, official languages, driving side, TLD,
neighbours, and every World Bank measure that clears the bar in step 2.

---

## 6. Correctness rules — non-negotiable

These are the rules the rest of The Atlas already lives by. A quiz breaks them more loudly
than a dossier does, because it asserts rather than displays.

- **Never build a question on a value the app itself would withhold.** Fewer than 30
  reporting countries means no rank on a dossier, and it means no question here either.
  Enforced once, in the deck build, so no generator can get it wrong.
- **Every question renders the year its numbers come from**, and names its source. Health
  and education data lag three to five years.
- **A wrong answer is the teaching moment.** The verdict panel shows the real numbers for
  every option, their years, and links to the full dossiers.
- **Never compare across distant years.** Higher-or-lower requires both values to be within
  three years of each other. "India in 2015 vs France in 2023" is not a fair question.
- **Never ask a near-tie.** Higher-or-lower requires a gap ratio of at least 1.15.
- **`higherIsBetter` is irrelevant here** and must not leak into wording. The question is
  "which is greater", never "which is better".
- **A missing value is never a question.** No dashes, no zeroes standing in for absence.

### Forgery — how a fake is made

The fake must be plausible enough to be tempting and wrong enough to be unambiguous.

1. Take a true `(country, indicator, value, year)`.
2. Multiply by a factor drawn from `[1.45, 2.20]` or `[0.45, 0.70]`.
3. Reject and redraw if the result falls inside ±15% of the true value (ambiguous), or
   outside the indicator's `[min, max]` across all countries (implausible — nobody is fooled
   by a life expectancy of 160).
4. Percentages clamp to `[0, 100]`; if clamping puts the fake back inside the ±15% band,
   pick a different indicator.
5. The other two statements are true values for the same country, different indicators,
   different sections where possible.
6. After ten failed draws for a country, move to another country. Never ship a forgery that
   failed its checks.

### Flags — how distractors are chosen

Three wrong names, preferably from the same `region` as the answer (harder and fairer than
offering Chad against Fiji). If the region has fewer than four countries with flags, fill
from anywhere. All four options must be distinct countries with distinct names.

### Surprise me — what counts as remarkable

In order of preference: a rank in the top 3 or bottom 3 of an indicator with `outOf ≥ 60`;
then a percentile above 97 or below 3; then any rank in the top 10. If a country has
nothing that clears those bars, deal a different country.

---

## 7. The round route

`GET /atlas/learn/api/round?game=forgery&count=10&seed=abc`

- `game` — required, one of the three ids. Anything else → 400.
- `count` — optional, default 10, clamped to 1..20.
- `seed` — optional. Given one, the same batch comes back every time, which is what makes
  the generators testable. Omitted, the route makes one.
- `export const dynamic = 'force-dynamic'` and `Cache-Control: no-store` — a cached round
  would serve everyone the same ten questions.
- Errors return `{ error: string }` with a real status code, never a half-built round.
- The handler does no I/O beyond the first `getDeck()` in the process.

---

## 8. The floor (`/atlas/learn`)

Server-rendered. Renders with JavaScript disabled, apart from the parts that are inherently
interactive.

- A short line of framing: what this is, and that every question comes from the same data
  as the dossiers.
- **Four cards**, engraved, each with its own guilloché rosette seeded from the game id so
  it matches how every country note is built. Three link to a run; the fourth is Surprise me
  and deals a card in place.
- **Your grade**, stamped as a seal, with lifetime correct answers under it.
- **The wall** — the last 20 runs as small ledger cards, each stamped with its score, newest
  first. Empty state: "No runs on the wall yet."

Grades, by lifetime correct answers: Apprentice (0), Engraver (25), Plate-maker (75),
Inspector (200), Master of the Mint (500).

### Progress (`lib/atlas/learn/progress.ts`)

`localStorage`, key `atlas.learn.v1`, one JSON object: lifetime correct and asked per game,
current and best streak, and the last 20 runs. No accounts, no server state. Every read is
defensive — a corrupt or absent value returns a fresh empty progress object rather than
throwing. All access is inside `useEffect` so the server and the first client render agree.

---

## 9. A run (`/atlas/learn/[game]`)

One client state machine, `PlayScreen.tsx`:

`loading → asking → answered → (next) … → summary`

- Fetches its first batch on mount, and the next batch when the player reaches question 7.
- **Keyboard first.** `1`–`4` pick an option, `Enter` moves on, `Esc` leaves the run. Every
  option is a real `<button>` so tab and space work without any of that.
- After answering: the `Verdict` panel. Correct or not, it shows every option's real number,
  its year, and a link to that country's dossier. The stamp comes down.
- After ten: `RunSummary` — score, a line on the streak, "run it again" and "back to the
  floor". The run is written to the wall here.
- If the fetch fails, the screen says so plainly and offers a retry. It never shows an empty
  question.
- `prefers-reduced-motion` removes every animation, including the stamp.
- No horizontal scroll at 375px.

---

## 10. Getting there

- `app/atlas/layout.tsx` gains one link on the right of the top bar: `the training floor →`.
  It shows on every `/atlas/*` route, which is the discovery path, and is the only change to
  an existing file's chrome.
- `/atlas/learn` links back to the plate.

---

## 11. Testing

This repo has **no test runner** — `lib/atlas/__tests__` is runner-ready but has never been
executed, and `npm run lint` does not work because ESLint was never installed. So
"tested" here means all four of these, actually run:

1. **`node scripts/atlas/learn-selfcheck.mjs`** — the real gate. Generates 500 questions per
   game against the built deck and asserts every invariant in §6: no aggregate ISO3s, no
   indicator under 30 reporters, forged values never within 15% of the truth and never
   outside `[min, max]`, higher-or-lower never a near-tie and never more than three years
   apart, flags always four distinct countries, every question carries a year and a source,
   `answer` always in range, and the same seed always gives the same round.
2. **`lib/atlas/learn/__tests__/*.test.ts`** — the same checks written for a future
   Jest/Vitest, in the existing `// @ts-nocheck` house style.
3. **`npm run build`** exits 0, TypeScript strict, no new warnings.
4. **A browser pass** on `/atlas/learn` and all three games: play a full run of each, force a
   wrong answer, check the verdict numbers against the dossier, check the wall records the
   run, check 375px, check keyboard-only play, check reduced motion.

---

## 12. Deliberately not built

- Accounts, server-side scores, leaderboards.
- Question authoring by hand. Every question is generated; hand-written ones rot.
- Currency and motto questions — see §5.
- Guess the country, Where in the world, Country of the day — wanted, but not v1.

---

## 13. What shipped after this spec (2026-08-08)

This section records what changed after the v1 build above. The rest of this document is left
as originally written.

**Two more games, plus the Country of the day card §12 called out as "not v1," all shipped:**

- **Guess the country** (`/atlas/learn/guess-country`) — one hidden country, clues revealed one
  at a time, broad to narrow: Region → Population (banded, not exact) → Language → Neighbour →
  Capital. Four country names offered. **Diverges from this spec's `GameId` union in §4** (which
  only lists `'forgery' | 'higher-lower' | 'flags'`) — the shipped `lib/atlas/learn/types.ts`
  adds `'guess-country'` and `'where-in-the-world'`. The score shown to the player falls with
  each clue revealed (100/80/60/40/20), but that is a **display-only** number kept on the
  client — whether a run counts as right or wrong for the grade ladder in §8 stays binary, same
  as every other game. Language stands in for the currency clue this spec's backlog predecessor
  suggested (§6.1 of `atlas-handover-and-backlog.md`), because §5's "currency is excluded from
  the deck" rule still holds — Wikidata's currency data is wrong often enough to disqualify it.
- **Where in the world** (`/atlas/learn/where-in-the-world`) — the player is named a country and
  clicks it on the reused engraved map (`lib/atlas/geo/world-paths.ts`, the same geometry
  `/atlas` uses). Only the 174 of 250 countries that have map geometry at this resolution are
  ever asked. Fully keyboard-playable — the map doubles as a listbox: arrow keys, Home/End,
  type-ahead, Enter. A wrong click is told how far off it was in honest terms — neighbour, same
  region, or a different part of the world — never a fabricated kilometre distance, because
  inverting the map's d3-geo projection in the browser would mean shipping `d3-geo` to the
  client for a number nobody asked for. New file: `lib/atlas/learn/geo-proximity.ts`.
- **Country of the day**, on the floor at `/atlas/learn` — one country, the same for everyone,
  derived deterministically from the UTC date via the same seeded PRNG the other games use, so
  it needs no storage. **It is not a game** — no `GameId`, no `/atlas/learn/[game]` route — it
  renders as a plain async server component,
  `app/atlas/learn/_components/CountryOfDayCard.tsx`, specifically so there is no client-side
  "what day is it" re-check and therefore no hydration mismatch to guard against.
  `app/atlas/learn/page.tsx` gained `export const revalidate = 3600` so the page picks up a new
  day within an hour of UTC midnight without going fully dynamic.

None of this was checked in a real browser as of this writing — see
[`feature-checklist.md`](../../atlas/feature-checklist.md) for what "works" means there and
what still needs a human to look at it.
