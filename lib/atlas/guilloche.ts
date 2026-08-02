/**
 * Deterministic guilloché rosette generator — the spirograph-like engraved
 * ornament on a banknote, derived from a country's ISO3 code. Same seed
 * always produces the same path; different seeds produce visibly different,
 * but always balanced, rosettes.
 *
 * The curve is a classic hypotrochoid (a small circle of radius `r` rolling
 * inside a fixed circle of radius `R=1`, tracing a point at distance `d`
 * from its centre) plus a small secondary harmonic that adds fine engraved
 * texture without breaking the closed loop. All frequencies are integers,
 * so the curve always closes exactly after one turn (`t` from `0` to `2π`)
 * — there is no risk of an ugly gap or a curve that never repeats.
 *
 * No DOM, no Node APIs: this runs identically on the server and in the
 * browser.
 */

import { hashString, hashToRange } from './hash';

export interface GuillocheOptions {
  /** Output coordinate space is `size` x `size`. Default 200. */
  size?: number;
  /** Number of sampled points around the curve. Default 400. */
  points?: number;
}

interface GuillocheParams {
  /** Count of primary lobes, 7-14. Below ~7 the curve reads as a lumpy,
   *  asymmetric blob rather than a rosette — every irregularity is too
   *  visible with so few lobes. */
  petals: number;
  /** d/r ratio: <1 gives simple cusped petals, >1 gives crossing inner loops. */
  dRatio: number;
  /** Which of two texture-harmonic families (x2 or x3 the petal count). */
  texHarmonicMultiplier: 2 | 3;
  /** Small integer offset so the texture frequency isn't a plain multiple. */
  texFreqOffset: -1 | 0 | 1;
  /** Amplitude of the texture ripple, small relative to the main curve. */
  texAmp: number;
  texPhase: number;
  /** Cosmetic whole-curve rotation. */
  rotation: number;
}

const DEFAULT_SIZE = 200;
const DEFAULT_POINTS = 400;

function deriveParams(seed: string): GuillocheParams {
  const s = seed.toUpperCase();
  const petals = 7 + Math.floor(hashToRange(hashString(`${s}:petals`), 0, 8)); // 7..14
  // d/r near 1.0 is the degenerate case: the loop collapses to a near-straight
  // spoke between cusps, which reads as a plain pointed star, not an engraved
  // rosette. Split into two bands on either side of that dead zone instead —
  // clearly no inner loop, or clearly a looped tip — and pick one with the hash.
  const hasInnerLoop = hashToRange(hashString(`${s}:loop`), 0, 1) < 0.5;
  const dRatio = hasInnerLoop
    ? hashToRange(hashString(`${s}:d`), 1.12, 1.4)
    : hashToRange(hashString(`${s}:d`), 0.5, 0.82);
  const texHarmonicMultiplier: 2 | 3 =
    hashToRange(hashString(`${s}:texmul`), 0, 1) < 0.5 ? 2 : 3;
  const texFreqOffset = (Math.floor(hashToRange(hashString(`${s}:texoff`), 0, 3)) - 1) as
    | -1
    | 0
    | 1;
  // Below ~0.08 the texture ripple is too subtle to break up the near-straight
  // necks a hypotrochoid's tip loops leave between them — most visible when
  // texHarmonicMultiplier is 2, whose frequency sits close enough to the base
  // curve's own that it needs more amplitude to read as curvature at all.
  // Below that floor the whole rosette reads as a flat pointed star, not an
  // engraved ornament.
  const texAmp = hashToRange(hashString(`${s}:texamp`), 0.09, 0.15);
  const texPhase = hashToRange(hashString(`${s}:texphase`), 0, Math.PI * 2);
  const rotation = hashToRange(hashString(`${s}:rot`), 0, Math.PI * 2);
  return { petals, dRatio, texHarmonicMultiplier, texFreqOffset, texAmp, texPhase, rotation };
}

/** Sample the curve in its own normalized units (not yet scaled to a size). */
function sampleRawPoints(seed: string, count: number): Array<[number, number]> {
  const p = deriveParams(seed);
  const r = 1 / p.petals;
  const d = p.dRatio * r;
  const rollRatio = (1 - r) / r; // = petals - 1, always an integer
  const texFreq = p.petals * p.texHarmonicMultiplier + p.texFreqOffset;
  const cosR = Math.cos(p.rotation);
  const sinR = Math.sin(p.rotation);

  const pts: Array<[number, number]> = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    let x = (1 - r) * Math.cos(t) + d * Math.cos(rollRatio * t);
    let y = (1 - r) * Math.sin(t) - d * Math.sin(rollRatio * t);
    x += p.texAmp * Math.cos(texFreq * t + p.texPhase);
    y += p.texAmp * Math.sin(texFreq * t + p.texPhase);
    // Whole-curve rotation, purely cosmetic — keeps the closed loop intact.
    const rx = x * cosR - y * sinR;
    const ry = x * sinR + y * cosR;
    pts.push([rx, ry]);
  }
  return pts;
}

function buildCurve(
  seed: string,
  count: number
): { points: Array<[number, number]>; maxRadius: number } {
  const points = sampleRawPoints(seed, count);
  let maxRadius = 0;
  for (const [x, y] of points) {
    const radius = Math.sqrt(x * x + y * y);
    if (radius > maxRadius) maxRadius = radius;
  }
  return { points, maxRadius };
}

/**
 * Generate the rosette as a single closed SVG path `d` string, suitable for
 * `stroke` with no `fill`. Same `seed` always returns the same string.
 */
export function guillochePath(seed: string, opts: GuillocheOptions = {}): string {
  const size = opts.size ?? DEFAULT_SIZE;
  const count = opts.points ?? DEFAULT_POINTS;
  const { points, maxRadius } = buildCurve(seed, count);
  // Normalize against the curve's own actual max radius so it always fills
  // its bounding circle exactly, with no clipping and no wasted margin,
  // regardless of which parameters the hash landed on.
  const scale = maxRadius === 0 ? 1 : size / 2 / maxRadius;
  const cx = size / 2;
  const cy = size / 2;

  const coords = points.map(([x, y]) => {
    const px = cx + x * scale;
    const py = cy + y * scale;
    return `${px.toFixed(2)},${py.toFixed(2)}`;
  });

  return `M${coords[0]} L${coords.slice(1).join(' ')} Z`;
}

/**
 * Total length of the same closed curve `guillochePath` would draw at the
 * default size (200 x 200, 400 points) — for `stroke-dasharray` /
 * `stroke-dashoffset` draw-on animation. Assumes the default size; if a
 * caller renders `guillochePath` at a custom `size`, scale this value by
 * `size / 200`.
 */
export function guillocheLength(seed: string): number {
  const { points, maxRadius } = buildCurve(seed, DEFAULT_POINTS);
  const scale = maxRadius === 0 ? 1 : DEFAULT_SIZE / 2 / maxRadius;
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % points.length];
    const dx = (x1 - x0) * scale;
    const dy = (y1 - y0) * scale;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}
