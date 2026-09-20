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

/**
 * The shape of one hypotrochoid, already reduced to the numbers the sampler
 * needs. `deriveParams` speaks in hash-friendly terms (a harmonic family and
 * an offset); this speaks in the single integer frequency those combine into,
 * so the inner layers of `guillocheLayers` can pick a frequency directly
 * without pretending to have a harmonic family.
 */
interface HypoSpec {
  /** Count of primary lobes. Must be an integer ≥ 2. */
  petals: number;
  /** d/r ratio: <1 gives simple cusped petals, >1 gives crossing inner loops. */
  dRatio: number;
  /** Texture ripple frequency. Must be an integer, or the loop will not close. */
  texFreq: number;
  texAmp: number;
  texPhase: number;
  rotation: number;
}

/**
 * Sample any hypotrochoid in its own normalized units (not yet scaled to a
 * size). Every layer in this file goes through here, so the closure guarantee
 * — integer frequencies, exactly one turn of `t` — is stated in one place
 * instead of once per curve.
 */
function sampleSpec(spec: HypoSpec, count: number): Array<[number, number]> {
  const r = 1 / spec.petals;
  const d = spec.dRatio * r;
  const rollRatio = (1 - r) / r; // = petals - 1, always an integer
  const cosR = Math.cos(spec.rotation);
  const sinR = Math.sin(spec.rotation);

  const pts: Array<[number, number]> = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    let x = (1 - r) * Math.cos(t) + d * Math.cos(rollRatio * t);
    let y = (1 - r) * Math.sin(t) - d * Math.sin(rollRatio * t);
    x += spec.texAmp * Math.cos(spec.texFreq * t + spec.texPhase);
    y += spec.texAmp * Math.sin(spec.texFreq * t + spec.texPhase);
    // Whole-curve rotation, purely cosmetic — keeps the closed loop intact.
    const rx = x * cosR - y * sinR;
    const ry = x * sinR + y * cosR;
    pts.push([rx, ry]);
  }
  return pts;
}

/** Sample the curve in its own normalized units (not yet scaled to a size). */
function sampleRawPoints(seed: string, count: number): Array<[number, number]> {
  const p = deriveParams(seed);
  return sampleSpec(
    {
      petals: p.petals,
      dRatio: p.dRatio,
      texFreq: p.petals * p.texHarmonicMultiplier + p.texFreqOffset,
      texAmp: p.texAmp,
      texPhase: p.texPhase,
      rotation: p.rotation,
    },
    count
  );
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

/* ============================================================
   Multi-layer rosette — the same ornament, engraved in four passes
   ============================================================ */

/**
 * One concentric ring of the ornament. A caller renders one `<path>` per
 * layer and hands `weight`, `opacity` and `spin` straight to CSS custom
 * properties, so the stacking rules live here with the geometry rather than
 * being re-guessed in every component.
 */
export interface GuillocheLayer {
  /** SVG path `d` string. */
  d: string;
  /** Total stroke length at the requested size, for stroke-dasharray draw-on. */
  length: number;
  /** 0 = outermost. Callers use this to stagger the draw and pick opacity. */
  index: number;
  /** Suggested stroke-width multiplier relative to the base (0.5 - 1.2). */
  weight: number;
  /** Suggested opacity (0.25 - 1). */
  opacity: number;
  /** Degrees per full rotation cycle; sign alternates so layers counter-rotate. */
  spin: number;
}

/**
 * Where each layer sits, as a fraction of the outer radius (`size / 2`).
 *
 * These are the whole reason the ornament reads as nested rings rather than
 * four curves fighting over the same circle: a real engraved bezel leaves a
 * visible gap between every pass, and a gap narrower than about 0.06 of the
 * radius closes up at the sizes these cards actually render (56-180px), so
 * the rings smear into one grey band. Hence 0.97 / 0.88 / 0.62 / 0.30 —
 * generous, uneven spacing, widest where the eye lingers.
 */
const LAYER_RADIUS = {
  ticks: 0.97,
  main: 0.88,
  counter: 0.62,
  medallion: 0.3,
  /** The plain circle inside the medallion — a banknote's blank centre. */
  pupil: 0.12,
} as const;

/** Where the short tick marks start, inward from `LAYER_RADIUS.ticks`. */
const TICK_INNER_SHORT = 0.93;
/** Every sixth tick reaches further in, the way a rotary dial marks its fives. */
const TICK_INNER_LONG = 0.875;
/** One long tick in every this-many. */
const TICK_MAJOR_EVERY = 6;

/**
 * Sample a curve, then place it so its own widest point lands exactly on
 * `fraction` of the outer radius.
 *
 * Note what this is NOT: every layer is measured against one shared outer
 * radius (`size / 2`) and then deliberately pushed in to its own fraction of
 * it. Normalizing each layer to fill the box on its own — which is what
 * `guillochePath` does, correctly, for a lone curve — would give four curves
 * all touching the edge and no nesting at all.
 */
function placeClosed(
  points: Array<[number, number]>,
  size: number,
  fraction: number
): { d: string; length: number } {
  let maxRadius = 0;
  for (const [x, y] of points) {
    const radius = Math.sqrt(x * x + y * y);
    if (radius > maxRadius) maxRadius = radius;
  }
  const scale = maxRadius === 0 ? 1 : ((size / 2) * fraction) / maxRadius;
  const cx = size / 2;
  const cy = size / 2;

  const coords: string[] = [];
  let length = 0;
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    coords.push(`${(cx + x * scale).toFixed(2)},${(cy + y * scale).toFixed(2)}`);
    const [nx, ny] = points[(i + 1) % points.length];
    const dx = (nx - x) * scale;
    const dy = (ny - y) * scale;
    length += Math.sqrt(dx * dx + dy * dy);
  }

  return { d: `M${coords[0]} L${coords.slice(1).join(' ')} Z`, length };
}

/** The bezel: one path of disconnected radial ticks, like a rotary index. */
function buildTickRing(seed: string, size: number): { d: string; length: number } {
  // A multiple of 12 keeps two things true at once: the ring divides evenly
  // into TICK_MAJOR_EVERY (so the last tick before the seam is a short one and
  // the major marks stay evenly spaced all the way round), and the count stays
  // in the 60-96 band where ticks read as an index rather than as a solid
  // hairline ring at card size.
  const step = Math.floor(hashToRange(hashString(`${seed}:tickstep`), 0, 4)); // 0..3
  const count = 60 + step * 12; // 60, 72, 84 or 96
  const half = size / 2;
  const outer = half * LAYER_RADIUS.ticks;
  const shortInner = half * TICK_INNER_SHORT;
  const longInner = half * TICK_INNER_LONG;
  // Offset the whole ring so it does not always start at three o'clock —
  // otherwise every card on the floor shares one visible landmark.
  const phase = hashToRange(hashString(`${seed}:tickphase`), 0, Math.PI * 2);

  const parts: string[] = [];
  let length = 0;
  for (let i = 0; i < count; i++) {
    const t = phase + (i / count) * Math.PI * 2;
    const inner = i % TICK_MAJOR_EVERY === 0 ? longInner : shortInner;
    const cos = Math.cos(t);
    const sin = Math.sin(t);
    const x0 = half + cos * inner;
    const y0 = half + sin * inner;
    const x1 = half + cos * outer;
    const y1 = half + sin * outer;
    parts.push(`M${x0.toFixed(2)},${y0.toFixed(2)} L${x1.toFixed(2)},${y1.toFixed(2)}`);
    length += outer - inner;
  }

  return { d: parts.join(' '), length };
}

/**
 * The centre medallion: a tight many-lobed rosette with a plain circle inside
 * it, both in one path so they draw on as a single unit.
 */
function buildMedallion(seed: string, size: number): { d: string; length: number } {
  // 11-18 lobes. Fewer than about 11 at this radius looks like a scaled-down
  // copy of the main rosette rather than a different piece of engraving; more
  // than 18 and the lobes are finer than a 0.9px stroke can separate.
  const lobes = 11 + Math.floor(hashToRange(hashString(`${seed}:medlobes`), 0, 8));
  const rosette = placeClosed(
    sampleSpec(
      {
        petals: lobes,
        // Well under 1: a cusped flower, no crossing inner loops. Loops this
        // small collapse into an ink blot.
        dRatio: hashToRange(hashString(`${seed}:medd`), 0.55, 0.78),
        texFreq: lobes * 2,
        // Half the main curve's texture: at 0.3 radius the same amplitude
        // would be a third of the lobe height and swamp the shape.
        texAmp: hashToRange(hashString(`${seed}:medamp`), 0.04, 0.07),
        texPhase: hashToRange(hashString(`${seed}:medphase`), 0, Math.PI * 2),
        rotation: hashToRange(hashString(`${seed}:medrot`), 0, Math.PI * 2),
      },
      220
    ),
    size,
    LAYER_RADIUS.medallion
  );

  const half = size / 2;
  const pupil = half * LAYER_RADIUS.pupil;
  // Two half-turn arcs, because a single `A` back to its own start point is a
  // degenerate zero-length arc that browsers drop entirely.
  const left = (half - pupil).toFixed(2);
  const right = (half + pupil).toFixed(2);
  const cy = half.toFixed(2);
  const r = pupil.toFixed(2);
  const circle =
    `M${left},${cy} A${r},${r} 0 0 1 ${right},${cy} A${r},${r} 0 0 1 ${left},${cy} Z`;

  return {
    d: `${rosette.d} ${circle}`,
    length: rosette.length + 2 * Math.PI * pupil,
  };
}

/**
 * The full ornament as four concentric layers, all deterministic from `seed`.
 *
 * Unlike `guillocheLength`, every `length` here is measured at the `size`
 * actually asked for — there is nothing for a caller to rescale by hand.
 */
export function guillocheLayers(
  seed: string,
  opts: GuillocheOptions & { layers?: number } = {}
): GuillocheLayer[] {
  const size = opts.size ?? DEFAULT_SIZE;
  const count = opts.points ?? DEFAULT_POINTS;
  const s = seed.toUpperCase();

  const main = deriveParams(seed);

  // The counter rosette must be visibly a different curve, not a slightly
  // wobblier copy of the main one: at 0.62 radius a petal count within 1 of
  // the main reads as a printing misregistration rather than a second pass.
  // Offsets of 3 or 4, either side, guarantee the gap without a retry loop.
  const offsets = [-4, -3, 3, 4] as const;
  const pick = Math.floor(hashToRange(hashString(`${s}:counteroff`), 0, offsets.length));
  const counterPetals = Math.max(4, main.petals + offsets[Math.min(pick, offsets.length - 1)]);

  const ticks = buildTickRing(s, size);
  const mainCurve = placeClosed(sampleRawPoints(seed, count), size, LAYER_RADIUS.main);
  const counterCurve = placeClosed(
    sampleSpec(
      {
        petals: counterPetals,
        dRatio: hashToRange(hashString(`${s}:counterd`), 0.55, 0.85),
        // An odd multiplier keeps the counter curve's texture out of phase
        // with the main curve's even harmonics, so the two do not beat into a
        // moiré where they pass near each other.
        texFreq: counterPetals * 3 + 1,
        texAmp: hashToRange(hashString(`${s}:counteramp`), 0.06, 0.1),
        texPhase: hashToRange(hashString(`${s}:counterphase`), 0, Math.PI * 2),
        rotation: hashToRange(hashString(`${s}:counterrot`), 0, Math.PI * 2),
      },
      count
    ),
    size,
    LAYER_RADIUS.counter
  );
  const medallion = buildMedallion(s, size);

  // Weight and opacity fall away toward the centre so the main rosette stays
  // the subject and the rest reads as supporting engraving. Spin alternates
  // sign — that is the whole point of the counter rosette — and grows inward,
  // since a smaller ring needs more degrees to travel the same arc length.
  const shape: Array<{ weight: number; opacity: number; spin: number }> = [
    { weight: 0.55, opacity: 0.4, spin: -2.2 },
    { weight: 1, opacity: 1, spin: 3 },
    { weight: 0.75, opacity: 0.62, spin: -3.6 },
    { weight: 0.6, opacity: 0.45, spin: 4.4 },
  ];

  const built = [ticks, mainCurve, counterCurve, medallion];
  const wanted = Math.max(1, Math.min(built.length, opts.layers ?? built.length));

  return built.slice(0, wanted).map((layer, index) => ({
    d: layer.d,
    length: layer.length,
    index,
    weight: shape[index].weight,
    opacity: shape[index].opacity,
    spin: shape[index].spin,
  }));
}
