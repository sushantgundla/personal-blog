// A seeded pseudo-random generator for the training floor.
//
// Every question the learning section asks is generated, not authored, and
// §7 of docs/superpowers/specs/2026-08-03-atlas-learn-design.md promises that
// `/atlas/learn/api/round?seed=abc` returns the same ten questions every time
// it is called. That promise is the only reason the generators are testable at
// all: scripts/atlas/learn-selfcheck.mjs builds the same round twice and
// compares them byte for byte. `Math.random()` cannot appear anywhere under
// lib/atlas/learn/ — this module is the single source of randomness.
//
// The algorithm is mulberry32: one 32-bit state word, three multiply-shift
// rounds, no dependencies. It is not cryptographic and does not need to be.
// What it does need is to be *stable forever* — the same seed must give the
// same sequence in Node, in the browser, and in five years' time — which is
// why it is written out here in full rather than pulled from a package that
// could change its mixing constants in a patch release. Everything is done
// through `Math.imul` and `>>>` so the arithmetic stays a correctly-wrapped
// unsigned 32-bit integer in every JS engine, exactly as lib/atlas/hash.ts
// does for the guilloché seeds.
import { hashString } from "../hash";

/** The handful of draws every generator here needs. Nothing else. */
export interface Rng {
  /** A float in [0, 1). The primitive everything else is built from. */
  next(): number;
  /** An integer in [min, max], both ends inclusive. */
  int(min: number, max: number): number;
  /** One item. Throws on an empty array rather than returning `undefined`. */
  pick<T>(items: readonly T[]): T;
  /** Up to `n` distinct items, in random order, without replacement. */
  sample<T>(items: readonly T[], n: number): T[];
  /** A shuffled copy. The input array is never mutated. */
  shuffle<T>(items: readonly T[]): T[];
}

/**
 * Turn any seed into the 32-bit state word mulberry32 starts from.
 *
 * String seeds go through `hashString` (FNV-1a) rather than a second hash
 * written for this file — one hash function in the Atlas, reused. A numeric
 * seed is taken as-is, which is what lets a generator derive an independent
 * sub-stream from an existing draw.
 */
function toState(seed: string | number): number {
  return (typeof seed === "number" ? seed : hashString(seed)) >>> 0;
}

/**
 * A deterministic generator. The same seed always produces the same sequence.
 *
 * ```ts
 * const rng = makeRng("forgery:2026-08-03");
 * rng.pick(deck.countries);
 * ```
 */
export function makeRng(seed: string | number): Rng {
  let state = toState(seed);

  function next(): number {
    // mulberry32, verbatim. `| 0` and `>>> 0` keep every intermediate inside
    // 32 bits; dividing by 2^32 gives a float in [0, 1) that can never be 1.
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function int(min: number, max: number): number {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    if (hi < lo) {
      throw new Error(`makeRng().int: empty range [${min}, ${max}]`);
    }
    return lo + Math.floor(next() * (hi - lo + 1));
  }

  function pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      // Silently returning `undefined` here would sail past TypeScript (the
      // signature says `T`) and surface much later as a question with a blank
      // country name. Fail where the mistake is.
      throw new Error("makeRng().pick: cannot pick from an empty array");
    }
    return items[int(0, items.length - 1)] as T;
  }

  function shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    // Fisher-Yates, walking backwards. Unbiased, and it touches the generator
    // exactly `length - 1` times, which keeps the sequence predictable.
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(0, i);
      const swap = out[i] as T;
      out[i] = out[j] as T;
      out[j] = swap;
    }
    return out;
  }

  function sample<T>(items: readonly T[], n: number): T[] {
    const wanted = Math.max(0, Math.min(Math.floor(n), items.length));
    if (wanted === 0) return [];
    // A partial Fisher-Yates: only the first `wanted` slots are resolved, so
    // sampling 3 flags out of 244 costs three draws, not 243.
    const pool = items.slice();
    const out: T[] = [];
    for (let i = 0; i < wanted; i++) {
      const j = int(i, pool.length - 1);
      const swap = pool[i] as T;
      pool[i] = pool[j] as T;
      pool[j] = swap;
      out.push(pool[i] as T);
    }
    return out;
  }

  return { next, int, pick, sample, shuffle };
}
