// A cheap, honest "how far off was that guess" for Where in the world
// (app/atlas/learn/_components/MapQuestion.tsx).
//
// The map is projected with d3-geo's geoNaturalEarth1 (see
// scripts/atlas/build-geo.mjs) — a compromise projection, not a plain linear
// longitude/latitude grid. Turning the on-screen pixel gap between a click
// and the true answer into a real-world kilometre figure would mean
// inverting that projection, and the map's own file header is explicit that
// neither d3-geo nor topojson-client ever ship to the browser. Rather than
// print a distance that is quietly wrong away from the equator, this reports
// the two facts the deck actually stands behind: whether the click landed on
// a country that borders the answer, and whether it landed in the same
// region. Both are exact, sourced facts, not an estimate.
export type MissProximity = 'neighbour' | 'same-region' | 'far';

/**
 * How far off a wrong click was, honestly. `answerNeighbours` and
 * `answerRegion` come from the question's own `country` field (straight from
 * the deck); `clickedRegion` is looked up client-side from
 * lib/atlas/iso-countries.ts, the same static table already used elsewhere
 * on this page.
 */
export function describeMissProximity(
  clickedIso3: string,
  answerNeighbours: readonly string[],
  answerRegion: string | null,
  clickedRegion: string | null
): MissProximity {
  if (answerNeighbours.includes(clickedIso3)) return 'neighbour';
  if (answerRegion !== null && clickedRegion !== null && answerRegion === clickedRegion) {
    return 'same-region';
  }
  return 'far';
}

/** The plain-English line MapQuestion prints under a wrong click. */
export function missProximityLine(
  proximity: MissProximity,
  clickedName: string,
  answerName: string,
  answerRegion: string | null
): string {
  switch (proximity) {
    case 'neighbour':
      return `Right next door — ${clickedName} shares a border with ${answerName}.`;
    case 'same-region':
      return `Same region${answerRegion ? ` (${answerRegion})` : ''}, wrong country.`;
    case 'far':
      return `A different part of the world from ${answerName}.`;
  }
}
