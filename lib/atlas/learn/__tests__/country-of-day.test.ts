// @ts-nocheck -- no test runner is wired into this project yet, so
// describe/test/expect have no type declarations. Remove this line once a
// runner (Jest/Vitest) is added; the assertions themselves are already
// runner-ready.
/**
 * Country of the day — item 7 of
 * docs/superpowers/specs/atlas-handover-and-backlog.md §6.1. Written for a
 * Jest/Vitest-compatible runner, matching lib/atlas/learn/__tests__/rng.test.ts
 * and the "surprise me" block of questions.test.ts, which this feature
 * reuses almost entirely.
 *
 * These read the real committed deck (`content/atlas/learn/deck.json`)
 * rather than a fixture, same reasoning as questions.test.ts: a rule that
 * only holds against a hand-made fixture is not a rule.
 *
 * No runner is wired into this project yet. scripts/atlas/learn-selfcheck.mjs
 * is the runner-free version of these same checks, over a longer run of
 * dates, and it has actually been run.
 */
import { getDeck } from '../deck';
import { buildCountryOfDay, utcDateStamp } from '../questions/country-of-day';

/** 60 consecutive UTC dates starting 2026-01-01 — fixed, not "today", so the
 *  suite never depends on the day it happens to run. */
function someDates(n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(2026, 0, 1));
    d.setUTCDate(d.getUTCDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

describe('utcDateStamp', () => {
  test('formats as YYYY-MM-DD', () => {
    const stamp = utcDateStamp(new Date('2026-03-05T23:59:00Z'));
    expect(stamp).toBe('2026-03-05');
  });

  test('reads the UTC date, not the local one', () => {
    // 2026-03-05T23:30:00Z is already 2026-03-06 in most timezones east of
    // UTC — the stamp must still read the UTC day, or two visitors in
    // different timezones would see different countries at the same instant.
    const stamp = utcDateStamp(new Date('2026-03-05T23:30:00Z'));
    expect(stamp).toBe('2026-03-05');
  });
});

describe('buildCountryOfDay', () => {
  test('the same date always yields the same card', async () => {
    const deck = await getDeck();
    const a = buildCountryOfDay(deck, '2026-08-08');
    const b = buildCountryOfDay(deck, '2026-08-08');
    expect(a).toEqual(b);
  });

  test('different dates spread across many countries rather than sticking', async () => {
    const deck = await getDeck();
    const dates = someDates(60);
    const isos = new Set(dates.map((date) => buildCountryOfDay(deck, date)?.iso3).filter(Boolean));
    // Not a tight bound — this only has to catch the draw being obviously
    // broken (every date landing on the same handful of countries).
    expect(isos.size).toBeGreaterThan(15);
  });

  test('every card carries the date it was asked for', async () => {
    const deck = await getDeck();
    for (const date of someDates(20)) {
      const card = buildCountryOfDay(deck, date);
      expect(card.date).toBe(date);
    }
  });

  test('only ever picks a sovereign country', async () => {
    const deck = await getDeck();
    const sovereign = new Set(deck.countries.filter((c) => c.sovereign).map((c) => c.iso3));
    for (const date of someDates(30)) {
      const card = buildCountryOfDay(deck, date);
      expect(sovereign.has(card.iso3)).toBe(true);
    }
  });

  test('every fact cites a source and a year, and links to the dossier', async () => {
    const deck = await getDeck();
    for (const date of someDates(30)) {
      const card = buildCountryOfDay(deck, date);
      expect(card.facts.length).toBeGreaterThan(0);
      for (const fact of card.facts) {
        expect(fact.headline).toBeTruthy();
        expect(fact.detail).toBeTruthy();
        expect(['World Bank', 'Wikidata']).toContain(fact.provenance.source);
        expect(fact.provenance.href).toBe(`/atlas/${card.iso3.toLowerCase()}`);
        if (fact.provenance.source === 'World Bank') {
          expect(String(fact.provenance.year)).toMatch(/^\d{4}$/);
        }
      }
    }
  });

  test('never repeats the same fact headline twice on one card', async () => {
    const deck = await getDeck();
    for (const date of someDates(30)) {
      const card = buildCountryOfDay(deck, date);
      const headlines = card.facts.map((f) => f.headline);
      expect(new Set(headlines).size).toBe(headlines.length);
    }
  });

  test('links to the same dossier the facts cite', async () => {
    const deck = await getDeck();
    const card = buildCountryOfDay(deck, '2026-08-08');
    expect(card.href).toBe(`/atlas/${card.iso3.toLowerCase()}`);
  });
});
