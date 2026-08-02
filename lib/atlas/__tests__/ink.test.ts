// @ts-nocheck -- no test runner is wired into this project yet, so
// describe/test/expect have no type declarations. Remove this line once a
// runner (Jest/Vitest) is added; the assertions themselves are already
// runner-ready.
/**
 * Written for a Jest/Vitest-compatible runner (describe/test/expect globals).
 * No runner is wired into this project yet — see `scratch/atlas-selfcheck.mjs`
 * for a runner-free version of these same checks that has actually been run,
 * including the full contrast sweep this file describes.
 */
import { countryInk, contrastRatio } from '../ink';
import { ISO3_CODES } from './iso3-fixture';

const NOTE_PAPER = '#1A1613';

describe('contrastRatio', () => {
  test('is 1 for identical colours', () => {
    expect(contrastRatio('#1A1613', '#1A1613')).toBeCloseTo(1, 5);
  });

  test('is 21 for pure black vs. pure white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });

  test('is symmetric', () => {
    expect(contrastRatio('#1A1613', '#E9E1D2')).toBeCloseTo(
      contrastRatio('#E9E1D2', '#1A1613'),
      10
    );
  });
});

describe('countryInk', () => {
  test('same ISO3 always returns the same ink', () => {
    expect(countryInk('IND')).toEqual(countryInk('IND'));
  });

  test('every known ISO3 code passes 4.5:1 contrast against --note-paper', () => {
    const failures: string[] = [];
    for (const iso3 of ISO3_CODES) {
      const ink = countryInk(iso3);
      if (contrastRatio(ink.hex, NOTE_PAPER) < 4.5) failures.push(iso3);
    }
    expect(failures).toEqual([]);
  });

  test('hue is always in [0, 360)', () => {
    for (const iso3 of ISO3_CODES) {
      const { hue } = countryInk(iso3);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
  });

  test('hex and hexDim are well-formed 6-digit hex colours', () => {
    const hexPattern = /^#[0-9a-f]{6}$/i;
    for (const iso3 of ISO3_CODES.slice(0, 20)) {
      const ink = countryInk(iso3);
      expect(ink.hex).toMatch(hexPattern);
      expect(ink.hexDim).toMatch(hexPattern);
    }
  });
});
