/**
 * The tour's script — two step lists and the two localStorage keys, and
 * nothing else. Plain data with no React and no `window` touch, so both
 * AtlasTour.tsx (which runs the tour) and TourReplayLink.tsx (which restarts
 * it) can import it without either one owning the other.
 *
 * The copy here is the whole point of the tour, so it lives in one file
 * rather than being scattered through the JSX: changing what the Atlas says
 * about itself should be a one-file edit.
 */

/**
 * The `data-tour` attribute values the Atlas pages carry. Typed as a union
 * rather than a bare `string` so a typo in a step below is a build error
 * instead of a step that silently never finds its target and gets dropped.
 *
 * Where each one lives (added by the pages themselves, not by this
 * directory):
 *
 *   map      app/atlas/_components/Plate.tsx  — the map wrapper
 *   search   app/atlas/_components/Plate.tsx  — the corner cluster
 *   dial     app/atlas/_components/Plate.tsx  — the furniture row
 *   rail     app/atlas/_components/Plate.tsx  — the standings aside
 *   ways-in  app/atlas/page.tsx               — the intro links nav
 *   floor    app/atlas/_components/FloorBand.tsx
 *   grade    app/atlas/learn/page.tsx         — around <GradeSeal />
 *   cotd     app/atlas/learn/page.tsx         — around <CountryOfDayCard />
 *   games    app/atlas/learn/page.tsx         — the game grid
 *   wall     app/atlas/learn/page.tsx         — around <ResultsWall />
 */
export type TourTarget =
  | 'map'
  | 'search'
  | 'dial'
  | 'rail'
  | 'ways-in'
  | 'floor'
  | 'grade'
  | 'cotd'
  | 'games'
  | 'wall';

export interface TourStep {
  /** Stable key for React and for reading the code; never shown. */
  id: string;
  /** Which `[data-tour="..."]` element this step spotlights. */
  target: TourTarget;
  /** The card's heading — three or four words. */
  title: string;
  /** One or two plain sentences under the heading. */
  body: string;
  /**
   * Whether a real click on the spotlit element reaches the page.
   *
   * True for exactly two targets — the search box and the metric dial —
   * because those are the only ones where a click changes something you can
   * undo on the spot. Everywhere else a click navigates away (the map, the
   * standings rail, the ways-in links, the floor band) and would abandon the
   * tour half-way through, so the hole is inert and only **Next** moves you
   * on. See the shutter comment in AtlasTour.tsx for how that is enforced.
   */
  allowTargetClick: boolean;
}

export interface TourDefinition {
  /** The localStorage key that remembers this tour was seen. */
  key: string;
  steps: readonly TourStep[];
}

/**
 * The two keys. The `v1` suffix is a version, not decoration: rewriting the
 * steps later means bumping to `v2`, which re-runs the tour for everyone who
 * already saw the old one, without needing any migration code.
 */
export const PLATE_TOUR_KEY = 'atlas.tour.plate.v1';
export const FLOOR_TOUR_KEY = 'atlas.tour.floor.v1';

/**
 * The event TourReplayLink fires and AtlasTour listens for. A plain DOM
 * CustomEvent rather than React context on purpose — the link can then sit
 * anywhere in the tree (or in a future page that has no shared provider with
 * the tour) and still start it.
 */
export const TOUR_START_EVENT = 'atlas:tour:start';

/** `/atlas` — the plate itself. Six stops. */
export const PLATE_STEPS: readonly TourStep[] = [
  {
    id: 'plate-map',
    target: 'map',
    title: 'The world, engraved',
    body: 'Hover a country to see its name, drag to move, scroll to zoom. Click any country to open its note.',
    allowTargetClick: false,
  },
  {
    id: 'plate-search',
    target: 'search',
    title: 'Search',
    body: 'Know the country already? Type its name here.',
    allowTargetClick: true,
  },
  {
    id: 'plate-dial',
    target: 'dial',
    title: 'The dial',
    body: 'Paint the world by one measure — population, income, life expectancy. The map recolours.',
    allowTargetClick: true,
  },
  {
    id: 'plate-rail',
    target: 'rail',
    title: 'The standings',
    body: 'Every country ranked by whatever the dial is showing. Click a row to open it.',
    allowTargetClick: false,
  },
  {
    id: 'plate-ways-in',
    target: 'ways-in',
    title: 'Two more ways in',
    body: 'Put countries side by side, or read a full ranked table.',
    allowTargetClick: false,
  },
  {
    id: 'plate-floor',
    target: 'floor',
    title: 'The training floor',
    body: 'Five games built from this same data, with a grade to climb.',
    allowTargetClick: false,
  },
];

/** `/atlas/learn` — the training floor. Four stops. */
export const FLOOR_STEPS: readonly TourStep[] = [
  {
    id: 'floor-grade',
    target: 'grade',
    title: 'Your grade',
    body: 'It climbs as you answer correctly, across every game.',
    allowTargetClick: false,
  },
  {
    id: 'floor-cotd',
    target: 'cotd',
    title: 'Country of the day',
    body: 'One country picked out every day. Worth a look before you start.',
    allowTargetClick: false,
  },
  {
    id: 'floor-games',
    target: 'games',
    title: 'The five games',
    body: 'Best first. Ten questions a run.',
    allowTargetClick: false,
  },
  {
    id: 'floor-wall',
    target: 'wall',
    title: 'The wall',
    body: 'Every run you finish hangs here.',
    allowTargetClick: false,
  },
];

/**
 * Which tour, if any, belongs to a route.
 *
 * Exact matches only. A dossier (`/atlas/USA`), a comparison, a rankings
 * table or a single game gets no tour at all — those pages are one thing
 * each and explain themselves. Returning `null` is what makes AtlasTour
 * render nothing on them even though it is mounted once for the whole
 * section in app/atlas/layout.tsx.
 */
export function tourForPath(pathname: string | null | undefined): TourDefinition | null {
  if (pathname === '/atlas') return { key: PLATE_TOUR_KEY, steps: PLATE_STEPS };
  if (pathname === '/atlas/learn') return { key: FLOOR_TOUR_KEY, steps: FLOOR_STEPS };
  return null;
}
