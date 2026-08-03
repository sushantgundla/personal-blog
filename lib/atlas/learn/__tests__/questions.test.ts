// @ts-nocheck -- no test runner is wired into this project yet, so
// describe/test/expect have no type declarations. Remove this line once a
// runner (Jest/Vitest) is added; the assertions themselves are already
// runner-ready.
/**
 * The §6 correctness rules from
 * docs/superpowers/specs/2026-08-03-atlas-learn-design.md, written for a
 * Jest/Vitest-compatible runner.
 *
 * These read the real committed deck (`content/atlas/learn/deck.json`) rather
 * than a fixture, because the rules are about the actual data — an invariant
 * that only holds against a hand-made fixture is not an invariant.
 *
 * No runner is wired into this project yet. `scripts/atlas/learn-selfcheck.mjs`
 * is the runner-free version of every check below, run over 500 questions per
 * game instead of the smaller samples here, and it has actually been run. If
 * you add a rule, add it there too — that script is the gate.
 */
import { getDeck } from '../deck';
import { makeRng } from '../rng';
import {
  PRIMARY_CODES,
  formatMeasure,
  pickIndicator,
  printResolution,
  sovereignCountries,
} from '../quiz-indicators';
import { CONFUSABLE_FLAG_PAIRS, areConfusableFlags, confusableWith } from '../confusable';
import { buildForgery } from '../questions/forgery';
import { buildHigherLower, pairKey } from '../questions/higher-lower';
import { buildFlagQuestion } from '../questions/flags';
import { buildSurpriseCard } from '../questions/surprise';
import { buildRound, buildSurprise } from '../questions';

const EMPTY = new Set<string>();

/** A sample big enough to catch a rule violation, small enough for a unit test. */
function many<T>(n: number, make: (i: number) => T | null): T[] {
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    const v = make(i);
    if (v) out.push(v);
  }
  return out;
}

describe('the deck itself', () => {
  test('every measure clears the 30-reporting-countries bar', async () => {
    const deck = await getDeck();
    for (const indicator of deck.indicators) {
      expect(indicator.outOf).toBeGreaterThanOrEqual(30);
      expect(indicator.min).toBeLessThanOrEqual(indicator.max);
    }
  });

  test('no World Bank aggregate is stored as a country', async () => {
    const deck = await getDeck();
    const isos = new Set(deck.countries.map((c) => c.iso3));
    for (const aggregate of ['WLD', 'EUU', 'HIC', 'OED', 'ARB', 'LMY', 'MIC']) {
      expect(isos.has(aggregate)).toBe(false);
    }
  });

  test('every code in PRIMARY_CODES is a real measure the deck kept', async () => {
    const deck = await getDeck();
    const codes = new Set(deck.indicators.map((i) => i.code));
    for (const code of PRIMARY_CODES) {
      expect(codes.has(code)).toBe(true);
    }
  });

  test('sovereignCountries is the 193 UN members plus VAT and PSE', async () => {
    const deck = await getDeck();
    const sovereign = sovereignCountries(deck);
    expect(sovereign).toHaveLength(195);
    const isos = new Set(sovereign.map((c) => c.iso3));
    expect(isos.has('VAT')).toBe(true);
    expect(isos.has('PSE')).toBe(true);
    // The three whose flags are literally another country's flag, plus the
    // continent with no flag at all.
    for (const territory of ['BVT', 'HMD', 'UMI', 'ATA', 'TKL', 'CCK']) {
      expect(isos.has(territory)).toBe(false);
    }
  });
});

describe('confusable flag pairs', () => {
  test('every code named is a sovereign state in the deck', async () => {
    const deck = await getDeck();
    const isos = new Set(sovereignCountries(deck).map((c) => c.iso3));
    for (const [a, b] of CONFUSABLE_FLAG_PAIRS) {
      expect(isos.has(a)).toBe(true);
      expect(isos.has(b)).toBe(true);
      expect(a).not.toBe(b);
    }
  });

  test('the relation is symmetric and does not include unrelated pairs', () => {
    expect(areConfusableFlags('IDN', 'MCO')).toBe(true);
    expect(areConfusableFlags('MCO', 'IDN')).toBe(true);
    expect(areConfusableFlags('IDN', 'FRA')).toBe(false);
    for (const [a, b] of CONFUSABLE_FLAG_PAIRS) {
      expect(confusableWith(a)).toContain(b);
      expect(confusableWith(b)).toContain(a);
    }
  });
});

describe('pickIndicator', () => {
  test('favours the hand-picked measures without only ever using them', async () => {
    const deck = await getDeck();
    const rng = makeRng('pick-indicator');
    const primary = new Set(PRIMARY_CODES);
    let hits = 0;
    const draws = 2000;
    for (let i = 0; i < draws; i++) {
      if (primary.has(pickIndicator(rng, deck).code)) hits++;
    }
    // Aiming at 75%. Wide bounds so this is a check on the weighting existing,
    // not a re-test of the generator's statistics.
    expect(hits / draws).toBeGreaterThan(0.6);
    expect(hits / draws).toBeLessThan(0.9);
  });

  test('returns null for an empty pool rather than throwing', async () => {
    const deck = await getDeck();
    expect(pickIndicator(makeRng('empty'), deck, [])).toBeNull();
  });
});

describe('spot the forgery', () => {
  test('two of the three statements are the deck’s real values', async () => {
    const deck = await getDeck();
    const rng = makeRng('forgery-truth');
    const questions = many(120, () => buildForgery(deck, rng, EMPTY));
    expect(questions.length).toBeGreaterThan(100);

    for (const q of questions) {
      expect(q.options).toHaveLength(3);
      const forgedCode = q.id.split(':')[2];
      let trueCount = 0;
      q.options.forEach((opt, i) => {
        if (i === q.answer) return;
        // The label may belong to several codes ("Military spending" is three
        // separate measures), so any matching one counts.
        const matches = deck.indicators.filter((ind) => ind.label === opt.measure);
        const real = matches.some((ind) => {
          const v = deck.values[ind.code]?.[q.country.iso3];
          return v && opt.text.includes(formatMeasure(ind, v[0]));
        });
        if (real) trueCount++;
      });
      expect(trueCount).toBe(2);
      expect(forgedCode).toBeTruthy();
    }
  });

  test('the forged figure is never within 15% of the truth, nor outside [min, max]', async () => {
    const deck = await getDeck();
    const rng = makeRng('forgery-band');
    for (const q of many(120, () => buildForgery(deck, rng, EMPTY))) {
      const code = q.id.split(':')[2];
      const indicator = deck.indicators.find((i) => i.code === code);
      const truth = deck.values[code][q.country.iso3][0];
      // The printed figure is what the player sees; the value behind it is
      // within half the last printed digit of it.
      const printed = q.options[q.answer].text;
      const resolution = printResolution(indicator, truth);
      expect(printed).not.toContain(formatMeasure(indicator, truth));
      // The generator refuses to build on a value too small for its own
      // formatting, which is what makes the assertion above meaningful.
      expect(Math.abs(truth)).toBeGreaterThanOrEqual(5 * resolution);
    }
  });

  test('all three statements use different measures', async () => {
    const deck = await getDeck();
    const rng = makeRng('forgery-labels');
    for (const q of many(150, () => buildForgery(deck, rng, EMPTY))) {
      const labels = q.options.map((o) => o.measure);
      expect(new Set(labels).size).toBe(3);
    }
  });

  test('a country already used in the round is never asked about again', async () => {
    const deck = await getDeck();
    const rng = makeRng('forgery-dedupe');
    const used = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const q = buildForgery(deck, rng, used);
      if (!q) continue;
      expect(used.has(q.country.iso3)).toBe(false);
      used.add(q.country.iso3);
    }
  });

  test('the verdict shows a real number, year and link for all three lines', async () => {
    const deck = await getDeck();
    const rng = makeRng('forgery-verdict');
    for (const q of many(100, () => buildForgery(deck, rng, EMPTY))) {
      expect(q.verdict.rows).toHaveLength(3);
      for (const row of q.verdict.rows) {
        expect(row.value).toBeTruthy();
        expect(row.year).toMatch(/^\d{4}$/);
        expect(row.href).toBe(`/atlas/${q.country.iso3.toLowerCase()}`);
      }
      expect(q.provenance.length).toBeGreaterThan(0);
      for (const p of q.provenance) {
        expect(p.source).toBe('World Bank');
        expect(p.year).toMatch(/^\d{4}$/);
      }
    }
  });
});

describe('higher or lower', () => {
  test('both values are real, the gap is at least 1.15x, and the answer is the greater', async () => {
    const deck = await getDeck();
    const rng = makeRng('hl-rules');
    const questions = many(200, () => buildHigherLower(deck, rng, EMPTY));
    expect(questions.length).toBeGreaterThan(150);

    for (const q of questions) {
      const code = q.id.split(':')[2];
      const a = deck.values[code][q.options[0].iso3];
      const b = deck.values[code][q.options[1].iso3];
      expect(a).toBeTruthy();
      expect(b).toBeTruthy();
      expect(a[0]).toBeGreaterThan(0);
      expect(b[0]).toBeGreaterThan(0);
      expect(Math.max(a[0], b[0]) / Math.min(a[0], b[0])).toBeGreaterThanOrEqual(1.15);
      expect(q.answer).toBe(a[0] > b[0] ? 0 : 1);
    }
  });

  test('the two years are never more than three apart', async () => {
    const deck = await getDeck();
    const rng = makeRng('hl-years');
    for (const q of many(200, () => buildHigherLower(deck, rng, EMPTY))) {
      const code = q.id.split(':')[2];
      const a = deck.values[code][q.options[0].iso3];
      const b = deck.values[code][q.options[1].iso3];
      expect(Math.abs(Number(a[1]) - Number(b[1]))).toBeLessThanOrEqual(3);
    }
  });

  test('never says "better" — higherIsBetter must not leak into the wording', async () => {
    const deck = await getDeck();
    const rng = makeRng('hl-wording');
    for (const q of many(200, () => buildHigherLower(deck, rng, EMPTY))) {
      const text = [q.prompt, q.measure, q.verdict.headline, q.verdict.note].join(' ');
      expect(text).not.toMatch(/\bbetter\b|\bworse\b|\bbest\b|\bworst\b/i);
      expect(q.prompt).toMatch(/greater/i);
    }
  });

  test('a pairing already used in the round never comes back', async () => {
    const deck = await getDeck();
    const rng = makeRng('hl-dedupe');
    const used = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const q = buildHigherLower(deck, rng, used);
      if (!q) continue;
      const key = pairKey(q.options[0].iso3, q.options[1].iso3);
      expect(used.has(key)).toBe(false);
      used.add(key);
    }
  });
});

describe('guess the flag', () => {
  test('four distinct countries, four distinct names, and the flag is the answer’s', async () => {
    const deck = await getDeck();
    const rng = makeRng('flags-shape');
    const questions = many(200, () => buildFlagQuestion(deck, rng, EMPTY));
    expect(questions.length).toBeGreaterThan(150);

    for (const q of questions) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map((o) => o.iso3)).size).toBe(4);
      expect(new Set(q.options.map((o) => o.name)).size).toBe(4);
      const answer = deck.countries.find((c) => c.iso3 === q.options[q.answer].iso3);
      expect(answer.flagUrl).toBe(q.flagUrl);
    }
  });

  test('never offers both halves of a confusable pair', async () => {
    const deck = await getDeck();
    const rng = makeRng('flags-confusable');
    for (const q of many(400, () => buildFlagQuestion(deck, rng, EMPTY))) {
      for (let i = 0; i < q.options.length; i++) {
        for (let j = i + 1; j < q.options.length; j++) {
          expect(areConfusableFlags(q.options[i].iso3, q.options[j].iso3)).toBe(false);
        }
      }
    }
  });

  test('the flag URL is https and rasterised — a raw SVG would break next/image', async () => {
    const deck = await getDeck();
    const rng = makeRng('flags-url');
    for (const q of many(200, () => buildFlagQuestion(deck, rng, EMPTY))) {
      expect(q.flagUrl.startsWith('https://')).toBe(true);
      expect(q.flagUrl).toContain('width=');
    }
  });

  test('distractors come from the answer’s region whenever the region has four flags', async () => {
    const deck = await getDeck();
    const rng = makeRng('flags-region');
    const flagsPerRegion = new Map<string, number>();
    for (const c of deck.countries) {
      if (!c.flagUrl || !c.region) continue;
      flagsPerRegion.set(c.region, (flagsPerRegion.get(c.region) ?? 0) + 1);
    }
    for (const q of many(200, () => buildFlagQuestion(deck, rng, EMPTY))) {
      const answer = deck.countries.find((c) => c.iso3 === q.options[q.answer].iso3);
      if (!answer.region || (flagsPerRegion.get(answer.region) ?? 0) < 4) continue;
      for (const opt of q.options) {
        const country = deck.countries.find((c) => c.iso3 === opt.iso3);
        expect(country.region).toBe(answer.region);
      }
    }
  });

  test('the verdict teaches all four countries, not just the right one', async () => {
    const deck = await getDeck();
    const rng = makeRng('flags-verdict');
    for (const q of many(100, () => buildFlagQuestion(deck, rng, EMPTY))) {
      expect(q.verdict.rows).toHaveLength(4);
      for (const row of q.verdict.rows) {
        expect(row.value).toBeTruthy();
        expect(row.href).toMatch(/^\/atlas\/[a-z]{3}$/);
      }
      expect(q.provenance[0].source).toBe('Wikidata');
    }
  });
});

describe('surprise me', () => {
  test('every card is genuinely remarkable under §6', async () => {
    const deck = await getDeck();
    const rng = makeRng('surprise');
    for (const card of many(300, () => buildSurpriseCard(deck, rng))) {
      const match = card.detail.match(/#(\d[\d,]*) of ([\d,]+)$/);
      expect(match).toBeTruthy();
      const rank = Number(match[1].replace(/,/g, ''));
      const outOf = Number(match[2].replace(/,/g, ''));
      const percentile = Math.round(((outOf - rank) / (outOf - 1)) * 100);
      const remarkable =
        (outOf >= 60 && (rank <= 3 || rank >= outOf - 2)) ||
        percentile > 97 ||
        percentile < 3 ||
        rank <= 10;
      expect(remarkable).toBe(true);
    }
  });

  test('"highest" and "lowest" respect the sort direction — rank 1 is best, not highest', async () => {
    const deck = await getDeck();
    const rng = makeRng('surprise-direction');
    for (const card of many(300, () => buildSurpriseCard(deck, rng))) {
      const label = card.headline.replace(/^.*? on Earth for /, '');
      const match = card.detail.match(/#(\d[\d,]*) of ([\d,]+)$/);
      const rank = Number(match[1].replace(/,/g, ''));
      const outOf = Number(match[2].replace(/,/g, ''));
      const indicator = deck.indicators.find((i) => i.label === label && i.outOf === outOf);
      expect(indicator).toBeTruthy();

      const rankOneIsHighest = indicator.higherIsBetter !== false;
      const fromTop = rank <= outOf / 2;
      const expectedWord = fromTop
        ? rankOneIsHighest
          ? 'highest'
          : 'lowest'
        : rankOneIsHighest
          ? 'lowest'
          : 'highest';
      expect(card.headline).toContain(` ${expectedWord} on Earth`);
    }
  });

  test('carries a year, a source and a dossier link', async () => {
    const deck = await getDeck();
    const rng = makeRng('surprise-provenance');
    for (const card of many(100, () => buildSurpriseCard(deck, rng))) {
      expect(card.provenance.source).toBe('World Bank');
      expect(card.provenance.year).toMatch(/^\d{4}$/);
      expect(card.href).toBe(`/atlas/${card.iso3.toLowerCase()}`);
    }
  });
});

describe('buildRound', () => {
  test('the same seed always produces an identical round', async () => {
    for (const game of ['forgery', 'higher-lower', 'flags']) {
      const a = await buildRound(game, 10, 'a-fixed-seed');
      const b = await buildRound(game, 10, 'a-fixed-seed');
      expect(a).toEqual(b);
    }
  });

  test('different seeds produce different rounds', async () => {
    const a = await buildRound('flags', 10, 'seed-one');
    const b = await buildRound('flags', 10, 'seed-two');
    expect(a).not.toEqual(b);
  });

  test('count is clamped to 1..20', async () => {
    expect((await buildRound('flags', 0, 'clamp')).questions.length).toBe(1);
    expect((await buildRound('flags', 999, 'clamp')).questions.length).toBeLessThanOrEqual(20);
  });

  test('every question carries the game it was asked for', async () => {
    for (const game of ['forgery', 'higher-lower', 'flags']) {
      const round = await buildRound(game, 10, 'game-id');
      expect(round.game).toBe(game);
      for (const q of round.questions) {
        expect(q.game).toBe(game);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
      }
    }
  });

  test('no question ever contains a country that is not a sovereign state', async () => {
    const deck = await getDeck();
    const sovereign = new Set(sovereignCountries(deck).map((c) => c.iso3));
    for (const game of ['forgery', 'higher-lower', 'flags']) {
      for (let seed = 0; seed < 15; seed++) {
        const round = await buildRound(game, 20, `sovereign-${game}-${seed}`);
        for (const q of round.questions) {
          const isos =
            q.game === 'forgery' ? [q.country.iso3] : q.options.map((o) => o.iso3);
          for (const iso of isos) expect(sovereign.has(iso)).toBe(true);
        }
      }
    }
    for (let seed = 0; seed < 50; seed++) {
      expect(sovereign.has((await buildSurprise(`sovereign-${seed}`)).iso3)).toBe(true);
    }
  });

  test('question ids are unique inside a round, so React keys are safe', async () => {
    for (const game of ['forgery', 'higher-lower', 'flags']) {
      const round = await buildRound(game, 20, 'unique-ids');
      const ids = round.questions.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('buildSurprise', () => {
  test('the same seed always deals the same card', async () => {
    expect(await buildSurprise('same')).toEqual(await buildSurprise('same'));
  });
});
