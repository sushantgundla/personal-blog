// Pairs of sovereign states whose flags are too alike to sit in the same
// question.
//
// This lives here rather than in types.ts on purpose: types.ts is the
// contract from §4 of the design doc, copied verbatim and shared by half a
// dozen files. This is editable data — a judgement call about what is unfair
// at thumbnail size — and it will grow. Keeping it separate means adding a
// pair never touches the file everyone else is compiling against.
//
// `sovereign` on DeckCountry already removes the outright broken cases
// (Bouvet Island flying Norway's flag, and so on). What is left is the
// harder problem: two real countries whose flags a fair player genuinely
// cannot tell apart in a 320px thumbnail. Indonesia and Monaco differ only
// in aspect ratio — as images they are the same flag. Romania and Chad
// differ only in the exact shade of blue, and even vexillologists argue
// about that one.
//
// The flag generator's rule: never offer both members of a pair as options
// in the same question. It does NOT mean either country is unusable — each
// is a perfectly good answer on its own, just not against its twin.
//
// Pairs are unordered. Use `areConfusableFlags` rather than scanning the
// array by hand, so the direction never matters at the call site.

/** Each entry is two ISO3 codes, with why it is here. Order within a pair is meaningless. */
export const CONFUSABLE_FLAG_PAIRS: ReadonlyArray<readonly [string, string]> = [
  // The three the design review called out.
  ["IDN", "MCO"], // identical red-over-white; only the aspect ratio differs
  ["ROU", "TCD"], // identical blue-yellow-red tricolour bar a shade of blue
  ["NLD", "LUX"], // same three bands; Luxembourg's blue is lighter and its ratio longer

  // Mirror images — same three colours, reversed. Readable side by side, a
  // coin toss from memory.
  ["IRL", "CIV"], // green-white-orange vs orange-white-green
  ["MLI", "GIN"], // green-yellow-red vs red-yellow-green
  ["NOR", "ISL"], // same Nordic cross, colours swapped

  // Inverted two-band flags. Poland is white over red; both of these are red
  // over white.
  ["POL", "IDN"],
  ["POL", "MCO"],

  // Same layout, small distinguishing detail that a thumbnail loses.
  ["SVK", "SVN"], // white-blue-red with a shield at the hoist, different shields
  ["LIE", "HTI"], // blue over red, different emblem in the middle
  ["COL", "ECU"], // yellow-blue-red; Ecuador adds a coat of arms, Colombia is plain
  ["AUS", "NZL"], // Union Jack plus the Southern Cross, differing star count and colour
];

/** ISO3 -> the ISO3 codes it must never share a flag question with. */
const CONFUSABLE_BY_ISO3 = new Map<string, Set<string>>();
for (const [a, b] of CONFUSABLE_FLAG_PAIRS) {
  if (!CONFUSABLE_BY_ISO3.has(a)) CONFUSABLE_BY_ISO3.set(a, new Set());
  if (!CONFUSABLE_BY_ISO3.has(b)) CONFUSABLE_BY_ISO3.set(b, new Set());
  CONFUSABLE_BY_ISO3.get(a)!.add(b);
  CONFUSABLE_BY_ISO3.get(b)!.add(a);
}

/** True if these two flags must not appear as options in the same question. */
export function areConfusableFlags(a: string, b: string): boolean {
  return CONFUSABLE_BY_ISO3.get(a)?.has(b) ?? false;
}

/** Every ISO3 that must not share a question with this one. Empty for most countries. */
export function confusableWith(iso3: string): readonly string[] {
  // Array.from, not spread — tsconfig targets ES5 lib semantics here and
  // spreading a Set needs downlevelIteration.
  return Array.from(CONFUSABLE_BY_ISO3.get(iso3) ?? []);
}
