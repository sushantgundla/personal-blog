// @ts-nocheck -- no test runner is wired into this project yet, so
// describe/test/expect have no type declarations. Remove this line once a
// runner (Jest/Vitest) is added; the assertions themselves are already
// runner-ready.
/**
 * Written for a Jest/Vitest-compatible runner (describe/test/expect globals).
 * No runner is wired into this project yet — see `scratch/atlas-selfcheck.mjs`
 * for a runner-free version of these same checks that has actually been run.
 */
import { hashString, hashToUnitFloat, hashSequence, hashToRange } from '../hash';

describe('hashString', () => {
  test('is deterministic for the same input', () => {
    expect(hashString('IND')).toBe(hashString('IND'));
    expect(hashString('india')).not.toBe(hashString('IND')); // case matters at this layer
  });

  test('produces different output for different input', () => {
    expect(hashString('IND')).not.toBe(hashString('USA'));
  });

  test('always returns an unsigned 32-bit integer', () => {
    for (const seed of ['IND', 'USA', 'TUV', '', 'a very long seed string indeed']) {
      const h = hashString(seed);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(0xffffffff);
    }
  });
});

describe('hashToUnitFloat', () => {
  test('stays within [0, 1)', () => {
    for (const seed of ['IND', 'USA', 'TUV', 'XKX']) {
      const f = hashToUnitFloat(seed);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
    }
  });
});

describe('hashSequence', () => {
  test('returns the requested count of values, each deterministic', () => {
    const a = hashSequence('IND', 4);
    const b = hashSequence('IND', 4);
    expect(a).toHaveLength(4);
    expect(a).toEqual(b);
  });

  test('successive values are not all identical (independent-looking)', () => {
    const values = hashSequence('IND', 5);
    expect(new Set(values).size).toBeGreaterThan(1);
  });
});

describe('hashToRange', () => {
  test('maps into the requested inclusive-ish range', () => {
    const h = hashString('IND');
    const v = hashToRange(h, 10, 20);
    expect(v).toBeGreaterThanOrEqual(10);
    expect(v).toBeLessThanOrEqual(20);
  });
});
