// @ts-nocheck -- no test runner is wired into this project yet, so
// describe/test/expect have no type declarations. Remove this line once a
// runner (Jest/Vitest) is added; the assertions themselves are already
// runner-ready.
/**
 * Written for a Jest/Vitest-compatible runner (describe/test/expect globals),
 * matching lib/atlas/__tests__/hash.test.ts.
 *
 * No runner is wired into this project yet. `scripts/atlas/learn-selfcheck.mjs`
 * is the runner-free version of the checks that matter most here — including
 * the determinism one — and that script has actually been run.
 */
import { makeRng } from '../rng';

describe('makeRng', () => {
  test('the same seed always gives the same sequence', () => {
    const a = makeRng('IND');
    const b = makeRng('IND');
    const seqA = [a.next(), a.next(), a.next(), a.next(), a.next()];
    const seqB = [b.next(), b.next(), b.next(), b.next(), b.next()];
    expect(seqA).toEqual(seqB);
  });

  test('different seeds give different sequences', () => {
    const a = makeRng('IND');
    const b = makeRng('USA');
    expect(a.next()).not.toBe(b.next());
  });

  test('a string seed and a number seed are both accepted', () => {
    expect(typeof makeRng('IND').next()).toBe('number');
    expect(typeof makeRng(12345).next()).toBe('number');
  });

  test('next() stays inside [0, 1)', () => {
    const rng = makeRng('range');
    for (let i = 0; i < 2000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  test('the sequence does not immediately repeat itself', () => {
    const rng = makeRng('spread');
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(rng.next());
    expect(seen.size).toBe(500);
  });
});

describe('int', () => {
  test('stays inside the inclusive range and reaches both ends', () => {
    const rng = makeRng('int');
    let sawMin = false;
    let sawMax = false;
    for (let i = 0; i < 2000; i++) {
      const v = rng.int(3, 7);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
      if (v === 3) sawMin = true;
      if (v === 7) sawMax = true;
    }
    expect(sawMin).toBe(true);
    expect(sawMax).toBe(true);
  });

  test('a single-value range always returns that value', () => {
    const rng = makeRng('int-one');
    expect(rng.int(4, 4)).toBe(4);
  });

  test('an inverted range throws rather than looping forever', () => {
    expect(() => makeRng('int-bad').int(7, 3)).toThrow();
  });
});

describe('pick', () => {
  test('always returns a member of the array', () => {
    const rng = makeRng('pick');
    const items = ['a', 'b', 'c', 'd'];
    for (let i = 0; i < 200; i++) {
      expect(items).toContain(rng.pick(items));
    }
  });

  test('throws on an empty array instead of returning undefined', () => {
    // Returning undefined would type-check as `T` and surface much later as a
    // question with a blank country name.
    expect(() => makeRng('pick-empty').pick([])).toThrow();
  });
});

describe('sample', () => {
  test('returns n distinct items', () => {
    const rng = makeRng('sample');
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    for (let i = 0; i < 200; i++) {
      const drawn = rng.sample(items, 3);
      expect(drawn).toHaveLength(3);
      expect(new Set(drawn).size).toBe(3);
      for (const d of drawn) expect(items).toContain(d);
    }
  });

  test('caps at the array length rather than repeating or throwing', () => {
    const rng = makeRng('sample-cap');
    expect(rng.sample([1, 2], 5)).toHaveLength(2);
    expect(rng.sample([1, 2], 0)).toEqual([]);
  });

  test('does not mutate the input array', () => {
    const rng = makeRng('sample-pure');
    const items = [1, 2, 3, 4, 5];
    rng.sample(items, 3);
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('shuffle', () => {
  test('keeps every element exactly once', () => {
    const rng = makeRng('shuffle');
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = rng.shuffle(items);
    expect(out.slice().sort((a, b) => a - b)).toEqual(items);
  });

  test('does not mutate the input array', () => {
    const rng = makeRng('shuffle-pure');
    const items = ['a', 'b', 'c'];
    rng.shuffle(items);
    expect(items).toEqual(['a', 'b', 'c']);
  });

  test('is deterministic for a given seed', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f'];
    expect(makeRng('same').shuffle(items)).toEqual(makeRng('same').shuffle(items));
  });

  test('actually reorders, given enough elements', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const rng = makeRng('shuffle-moves');
    let moved = false;
    for (let i = 0; i < 20 && !moved; i++) {
      if (JSON.stringify(rng.shuffle(items)) !== JSON.stringify(items)) moved = true;
    }
    expect(moved).toBe(true);
  });
});
