// @ts-nocheck -- describe/test/expect come from lib/atlas/__tests__/globals.mjs
// at run time (npm run atlas:test) and have no type declarations here.
import { ALL_LAND_BORDER_PAIRS, LAND_BORDER_PAIRS, isLandBorder, neighboursOf } from '../land-borders';
import { BY_ISO3 } from '../iso-countries';

describe('land border table', () => {
  test('every ISO3 in it is also in the ISO table', () => {
    const unknown = ALL_LAND_BORDER_PAIRS.flat().filter((iso3) => !BY_ISO3[iso3]);
    expect(unknown).toEqual([]);
  });

  test('no pair is listed twice, in either order, and no country borders itself', () => {
    expect(LAND_BORDER_PAIRS.size).toBe(ALL_LAND_BORDER_PAIRS.length);
    expect(ALL_LAND_BORDER_PAIRS.filter(([a, b]) => a === b)).toEqual([]);
  });
});

describe('isLandBorder', () => {
  test('is symmetric', () => {
    for (const [a, b] of ALL_LAND_BORDER_PAIRS) {
      expect(isLandBorder(a, b)).toBe(true);
      expect(isLandBorder(b, a)).toBe(true);
    }
  });

  test('rejects the maritime and disputed pairs the file header names', () => {
    expect(isLandBorder('MDV', 'GBR')).toBe(false);
    expect(isLandBorder('KIR', 'USA')).toBe(false);
    expect(isLandBorder('SDN', 'UGA')).toBe(false);
    expect(isLandBorder('IND', 'LKA')).toBe(false);
  });
});

describe('neighboursOf', () => {
  test('agrees with isLandBorder in both directions, sorted', () => {
    for (const iso3 of ['IND', 'DEU', 'CHN', 'BRA', 'NLD']) {
      const list = neighboursOf(iso3);
      expect(list).toEqual([...list].sort());
      for (const other of list) {
        expect(isLandBorder(iso3, other)).toBe(true);
        expect(neighboursOf(other)).toContain(iso3);
      }
    }
  });

  test('includes the six pairs Wikidata P47 used to miss', () => {
    expect(neighboursOf('BEL')).toContain('NLD');
    expect(neighboursOf('DEU')).toContain('NLD');
    expect(neighboursOf('CHN')).toContain('HKG');
    expect(neighboursOf('CHN')).toContain('MAC');
    expect(neighboursOf('ISR')).toContain('PSE');
    expect(neighboursOf('SUR')).toContain('GUF');
  });

  test('is empty for an island nation and an unknown code', () => {
    expect(neighboursOf('ISL')).toEqual([]);
    expect(neighboursOf('ZZZ')).toEqual([]);
  });
});
