/**
 * Deterministic string hashing for the Atlas.
 *
 * Pure, dependency-free, and stable forever: the same input must always
 * produce the same output, on the server and in the browser, across Node
 * versions and years. Everything derived from a country's ISO3 code (the
 * guilloché rosette, the per-country ink) is seeded from this.
 *
 * Implementation is FNV-1a, 32-bit. It is not cryptographic — it only needs
 * to be a fast, well-distributed, reproducible fingerprint.
 */

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * Hash a string to an unsigned 32-bit integer via FNV-1a.
 */
export function hashString(input: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // Multiply by the FNV prime using Math.imul so the result stays a
    // correctly-wrapped 32-bit integer in both Node and browser JS engines.
    hash = Math.imul(hash, FNV_PRIME);
  }
  // Force unsigned 32-bit range.
  return hash >>> 0;
}

/**
 * Hash a string to a float in [0, 1). Convenient for driving continuous
 * parameters (angles, radii, offsets) from a seed.
 */
export function hashToUnitFloat(input: string): number {
  return hashString(input) / 0xffffffff;
}

/**
 * Derive a sequence of independent-looking unsigned 32-bit integers from one
 * seed, by re-hashing the seed with an incrementing salt. Use this whenever
 * more than one parameter must vary independently from the same seed (e.g.
 * radius vs. petal count vs. phase) — hashing `seed + ':' + index` avoids the
 * correlated output that reusing a single hash across several `% N` reductions
 * would produce.
 */
export function hashSequence(seed: string, count: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    out.push(hashString(`${seed}:${i}`));
  }
  return out;
}

/**
 * Map a hash-derived integer into an inclusive numeric range [min, max].
 */
export function hashToRange(value: number, min: number, max: number): number {
  const t = (value >>> 0) / 0xffffffff;
  return min + t * (max - min);
}
