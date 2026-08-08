// Country of the day — one country, the same for everyone, changing daily.
// Item 7 of docs/superpowers/specs/atlas-handover-and-backlog.md §6.1: "One
// country, the same for everyone, changing daily. Derive it from the date so
// it needs no storage."
//
// ------------------------------------------------------------------ shape
// Not a game — no `GameId`, no `/atlas/learn/[game]` route, no round. It is
// a front-door feature on the floor at /atlas/learn, the same kind of thing
// "Surprise me" (./surprise.ts) is. It reuses that file almost entirely:
// `candidatesFor` decides what counts as remarkable (§6 of the design doc —
// a top/bottom-3 rank on a measure at least 60 countries report, then a
// percentile past 97/3, then any top-10 rank), and `describeRank` /
// `measureText` / `ordinal` turn one candidate into the same English a
// surprise card uses. The only real difference is that a day's card shows a
// *handful* of facts rather than the single best one, and picks a country
// deterministically instead of by a fresh random draw.
//
// -------------------------------------------------------------- the seed
// `makeRng` (../rng.ts) is deterministic in the seed string, so seeding it
// from the UTC calendar date — "country-of-day:2026-08-08" — is the entire
// mechanism: no database row, no cron job, no cache to invalidate. Every
// server process, and every visitor's browser were this ever called from
// one, derives the same pick from the same date. If the deterministically
// first-drawn country has nothing remarkable (candidatesFor returns an empty
// list — rare, but not impossible for a small territory-adjacent state), the
// loop below draws again from the *same* seeded generator, which is still
// fully deterministic: the same date always exhausts the same sequence of
// candidates and lands on the same eventual country.
//
// -------------------------------------------------------- server-only, always
// This is called from app/atlas/learn/_components/CountryOfDayCard.tsx,
// which is a plain server component — not a client component, and not
// behind a fetch the way SurpriseCard.tsx's modal is. The date is computed
// once, on the server, and baked straight into the HTML. There is no
// client-side `new Date()` anywhere in this feature, so there is nothing
// that could disagree with what the server rendered and no hydration
// mismatch is possible — see that component's header for the fuller
// explanation. The page rolls the pick over on a schedule via
// `export const revalidate` in app/atlas/learn/page.tsx rather than freezing
// it at build time; see that file for the chosen interval and why.
import type { CountryOfDayCard, CountryOfDayFact, Deck } from "../types";
import { makeRng } from "../rng";
import { dossierHref, sovereignCountries } from "../quiz-indicators";
import { candidatesFor, describeRank, measureText, ordinal, type Candidate } from "./surprise";
import { formatRank } from "../../format";

/** Countries to try before giving up — same bound surprise.ts uses for the
 *  same reason: a handful of sovereign states report almost nothing. */
const MAX_ATTEMPTS = 60;

/** "A handful of facts that make it worth a minute" — enough to be worth
 *  reading, not a whole dossier reprinted on the floor. */
const FACTS_PER_CARD = 3;

/** Today, in UTC, as "YYYY-MM-DD" — both the seed and the label printed on
 *  the card, so "today" can never mean two different days in one render.
 *  UTC rather than the visitor's own timezone: the whole point is that
 *  everyone sees the same country on the same day, and a visitor's local
 *  clock is exactly the kind of per-request state this feature is built to
 *  avoid depending on. */
export function utcDateStamp(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** One candidate, turned into the fact text a card prints — the same
 *  headline/detail shape SurpriseCard.tsx already renders. */
function factFrom(iso3: string, candidate: Candidate): CountryOfDayFact {
  const { place, word } = describeRank(candidate.indicator, candidate.rank);
  return {
    headline: `${ordinal(place)} ${word} on Earth for ${candidate.indicator.label}`,
    detail:
      `${measureText(candidate.indicator, candidate.value)}, ${candidate.year} — ` +
      `${formatRank(candidate.rank, candidate.indicator.outOf)}`,
    provenance: {
      source: "World Bank",
      year: candidate.year,
      href: dossierHref(iso3),
    },
  };
}

/**
 * Today's — or `date`'s — country, with a handful of its most remarkable
 * facts. `date` defaults to `utcDateStamp()` but takes an explicit value so
 * callers (tests, the self-check) can ask for any day without waiting for
 * the clock.
 *
 * Returns `null` only if not a single sovereign country in the whole deck
 * clears the §6 remarkable bar within `MAX_ATTEMPTS` draws — which would
 * mean the deck itself has no ranks in it, the same failure `buildSurprise`
 * treats as fatal.
 */
export function buildCountryOfDay(deck: Deck, date: string = utcDateStamp()): CountryOfDayCard | null {
  const pool = sovereignCountries(deck);
  const rng = makeRng(`country-of-day:${date}`);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const country = rng.pick(pool);
    const candidates = candidatesFor(deck, country);
    if (candidates.length === 0) continue;

    // Best first: the lowest tier (1 beats 2 beats 3), then the most
    // extreme rank within a tier. This ordering is a plain sort over data
    // already in hand, so it stays a pure function of the date — no further
    // draws from `rng`, and therefore no risk of it changing what the *next*
    // attempt (a different country) would draw.
    const ranked = candidates.slice().sort((a, b) => a.tier - b.tier || a.rank - b.rank);

    // At most one fact per indicator label. Three World Bank codes share the
    // label "Military spending" (% of GDP, US$, % of government spending);
    // two rows both headlined "Military spending" would read as a
    // copy-paste bug even though both figures are true — the same trap §5 of
    // the design doc calls out for the forgery generator.
    const seenLabels = new Set<string>();
    const chosen: Candidate[] = [];
    for (const candidate of ranked) {
      if (chosen.length >= FACTS_PER_CARD) break;
      if (seenLabels.has(candidate.indicator.label)) continue;
      seenLabels.add(candidate.indicator.label);
      chosen.push(candidate);
    }

    return {
      date,
      iso3: country.iso3,
      name: country.name,
      flagUrl: country.flagUrl,
      facts: chosen.map((c) => factFrom(country.iso3, c)),
      href: dossierHref(country.iso3),
    };
  }

  return null;
}
