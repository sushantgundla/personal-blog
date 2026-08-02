// @ts-nocheck -- no test runner is wired into this project yet, so
// describe/test/expect have no type declarations. Remove this line once a
// runner (Jest/Vitest) is added; the assertions themselves are already
// runner-ready.
/**
 * Written for a Jest/Vitest-compatible runner (describe/test/expect globals).
 * No runner is wired into this project yet — see `scratch/atlas-selfcheck.mjs`
 * for a runner-free version of these same checks that has actually been run.
 */
import { formatValue, formatRank, formatYear, formatComparison } from '../format';

describe('formatValue', () => {
  test('never prints NaN, undefined or $NaN', () => {
    const cases: Array<[unknown, Parameters<typeof formatValue>[1]]> = [
      [null, 'number'],
      [undefined, 'currency'],
      [NaN, 'percent'],
      [Infinity, 'number'],
    ];
    for (const [value, format] of cases) {
      const out = formatValue(value as number, format);
      expect(out).not.toMatch(/NaN/);
      expect(out).not.toMatch(/undefined/);
    }
  });

  test('null and undefined render the empty marker, not zero', () => {
    expect(formatValue(null, 'number')).toBe('—');
    expect(formatValue(undefined, 'currency')).toBe('—');
  });

  test('zero is a real value, not "no data"', () => {
    expect(formatValue(0, 'number')).toBe('0');
    expect(formatValue(0, 'currency')).toBe('$0');
    expect(formatValue(0, 'percent')).toBe('0.0%');
  });

  test('negative numbers keep their sign', () => {
    expect(formatValue(-2485, 'number')).toBe('-2,485');
    expect(formatValue(-1.43e9, 'currency')).toBe('-$1.43B');
  });

  test('compacts trillions, billions and millions as specified', () => {
    expect(formatValue(3.554e12, 'currency')).toBe('$3.55T');
    expect(formatValue(1.428e9, 'currency')).toBe('$1.43B');
    expect(formatValue(142.5e6, 'number')).toBe('142.5M');
    expect(formatValue(2485, 'number')).toBe('2,485');
  });

  test('percent, years and per1000 get their suffixes', () => {
    expect(formatValue(61.3, 'percent')).toBe('61.3%');
    expect(formatValue(72.4, 'years')).toBe('72.4 yrs');
    expect(formatValue(23.4, 'per1000')).toBe('23.4 /1,000');
  });

  test('a custom empty marker is honoured', () => {
    expect(formatValue(null, 'number', { empty: 'n/a' })).toBe('n/a');
  });
});

describe('formatRank', () => {
  test('formats a normal rank', () => {
    expect(formatRank(5, 195)).toBe('#5 of 195');
  });

  test('missing rank renders the empty marker', () => {
    expect(formatRank(null, 195)).toBe('—');
    expect(formatRank(undefined, 195)).toBe('—');
  });
});

describe('formatYear', () => {
  test('formats a year with no grouping comma', () => {
    expect(formatYear(2025)).toBe('2025');
  });

  test('missing year renders the empty marker', () => {
    expect(formatYear(null)).toBe('—');
    expect(formatYear(undefined)).toBe('—');
  });
});

describe('formatComparison', () => {
  test('formats a normal comparison', () => {
    expect(formatComparison(61, 100)).toBe('61% of world average');
  });

  test('guards against a zero or missing world average', () => {
    expect(formatComparison(61, 0)).toBe('—');
    expect(formatComparison(61, null)).toBe('—');
    expect(formatComparison(null, 100)).toBe('—');
  });
});
