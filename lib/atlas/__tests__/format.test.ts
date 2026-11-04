// @ts-nocheck -- no test runner is wired into this project yet, so
// describe/test/expect have no type declarations. Remove this line once a
// runner (Jest/Vitest) is added; the assertions themselves are already
// runner-ready.
/**
 * Written for a Jest/Vitest-compatible runner (describe/test/expect globals).
 * No runner is wired into this project yet — see `scratch/atlas-selfcheck.mjs`
 * for a runner-free version of these same checks that has actually been run.
 */
import { formatValue, formatRank, formatYear, formatComparison, formatWikidataDate } from '../format';

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

  test('infinity is treated as missing, never engraved as ∞', () => {
    expect(formatValue(Infinity, 'currency')).toBe('—');
    expect(formatValue(-Infinity, 'number')).toBe('—');
  });

  test('rounding up to 1,000 of a unit steps to the next unit', () => {
    expect(formatValue(999_960_000, 'number')).toBe('1.00B');
    expect(formatValue(999_996_000_000, 'currency')).toBe('$1.00T');
    expect(formatValue(999_940_000, 'number')).toBe('999.9M');
  });

  test('a negative that rounds to zero loses its minus sign', () => {
    expect(formatValue(-0.04, 'percent')).toBe('0.0%');
    expect(formatValue(-0.4, 'number')).toBe('0');
    expect(formatValue(-0.06, 'percent')).toBe('-0.1%');
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

  test('a missing or zero total drops the "of" instead of printing "of 0"', () => {
    expect(formatRank(5, null)).toBe('#5');
    expect(formatRank(5, 0)).toBe('#5');
  });
});

describe('formatWikidataDate', () => {
  test('a full date reads day, month, year', () => {
    expect(formatWikidataDate('1947-08-15T00:00:00Z')).toBe('15 Aug 1947');
  });

  test('a year-only date prints the bare year, without zero-padding', () => {
    expect(formatWikidataDate('0481-01-01T00:00:00Z')).toBe('481');
    expect(formatWikidataDate('1776-01-01T00:00:00Z')).toBe('1776');
  });

  test('zero-padding is stripped from a full early date too', () => {
    expect(formatWikidataDate('0301-09-04T00:00:00Z')).toBe('04 Sep 301');
  });

  test('anything unparseable is returned unchanged', () => {
    expect(formatWikidataDate('sometime')).toBe('sometime');
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
