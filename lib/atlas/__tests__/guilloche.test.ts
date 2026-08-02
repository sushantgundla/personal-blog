// @ts-nocheck -- no test runner is wired into this project yet, so
// describe/test/expect have no type declarations. Remove this line once a
// runner (Jest/Vitest) is added; the assertions themselves are already
// runner-ready.
/**
 * Written for a Jest/Vitest-compatible runner (describe/test/expect globals).
 * No runner is wired into this project yet — see `scratch/atlas-selfcheck.mjs`
 * for a runner-free version of these same checks that has actually been run,
 * including a visual pass over 20+ real ISO3 codes.
 */
import { guillochePath, guillocheLength } from '../guilloche';

describe('guillochePath', () => {
  test('same seed produces the same path every time', () => {
    expect(guillochePath('IND')).toBe(guillochePath('IND'));
    expect(guillochePath('TUV', { size: 300 })).toBe(guillochePath('TUV', { size: 300 }));
  });

  test('different seeds produce different paths', () => {
    const seeds = ['IND', 'USA', 'FRA', 'JPN', 'BRA', 'TUV', 'NZL', 'KEN'];
    const paths = seeds.map((s) => guillochePath(s));
    expect(new Set(paths).size).toBe(seeds.length);
  });

  test('is a single closed path: starts with M, ends with Z', () => {
    const d = guillochePath('IND');
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
  });

  test('respects the requested point count', () => {
    const d = guillochePath('IND', { points: 50 });
    // 1 "M x,y" + 49 more coordinate pairs in the "L ..." run.
    const coordCount = d.match(/-?\d+\.\d+,-?\d+\.\d+/g)?.length;
    expect(coordCount).toBe(50);
  });

  test('fits inside its size x size box (centered, radius <= size/2)', () => {
    const size = 200;
    const d = guillochePath('KEN', { size });
    const coords = [...d.matchAll(/(-?\d+\.\d+),(-?\d+\.\d+)/g)].map((m) => [
      parseFloat(m[1]),
      parseFloat(m[2]),
    ]);
    const cx = size / 2;
    const cy = size / 2;
    for (const [x, y] of coords) {
      const r = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      expect(r).toBeLessThanOrEqual(size / 2 + 0.01); // +epsilon for rounding
    }
  });
});

describe('guillocheLength', () => {
  test('is deterministic for the same seed', () => {
    expect(guillocheLength('IND')).toBe(guillocheLength('IND'));
  });

  test('is a positive, finite number', () => {
    for (const seed of ['IND', 'USA', 'TUV', 'XKX']) {
      const len = guillocheLength(seed);
      expect(Number.isFinite(len)).toBe(true);
      expect(len).toBeGreaterThan(0);
    }
  });
});
