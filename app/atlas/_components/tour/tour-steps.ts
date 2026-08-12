/**
 * The tour's script — one ordered step list and the one localStorage key, and
 * nothing else. Plain data with no React and no `window` touch, so both
 * AtlasTour.tsx (which runs the tour) and TourReplayLink.tsx (which restarts
 * it) can import it without either one owning the other.
 *
 * The copy here is the whole point of the tour, so it lives in one file
 * rather than being scattered through the JSX: changing what the Atlas says
 * about itself should be a one-file edit.
 *
 * There used to be two lists here and two keys — a six-step tour on /atlas and
 * a separate four-step tour on /atlas/learn, each starting on its own page's
 * first visit. That meant most people saw the first one and never the second,
 * because nothing walked them across. It is one walk now: ten steps, and the
 * step that spotlights the training floor band hands you over to the floor
 * itself. The `route` field on each step is what makes that possible.
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

/**
 * The two Atlas pages the tour walks through, in the order it walks them.
 *
 * Every other /atlas/* route — a dossier, a comparison, a rankings table, a
 * single game — has no tour at all. Those pages are one thing each and explain
 * themselves.
 */
export type TourRoute = '/atlas' | '/atlas/learn';

export interface TourStep {
  /** Stable key for React and for reading the code; never shown. */
  id: string;
  /**
   * Which page this step lives on.
   *
   * Two jobs, both load-bearing. It tells AtlasTour that pressing **Next**
   * here has to walk the visitor to another page before the next card can go
   * up. And it protects the steps of the page you are not standing on yet
   * from the "drop steps whose target is missing" filter, which would
   * otherwise delete the whole second half of the tour the moment it started.
   */
  route: TourRoute;
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
   *
   * The floor band stays inert even though **Next** now goes to that same
   * page: a real click would navigate without the tour knowing, so the tour
   * would find itself on /atlas/learn with no idea it had moved.
   */
  allowTargetClick: boolean;
}

/**
 * The one key. The `v2` suffix is a version, not decoration: it deliberately
 * does not match either of the two `v1` keys the old split tours wrote, so
 * everybody who saw the old pair of tours is shown this single walk once, and
 * no migration code is needed to do it. Rewriting the steps again later means
 * bumping to `v3`.
 */
export const TOUR_KEY = 'atlas.tour.v2';

/**
 * The event TourReplayLink fires and AtlasTour listens for. A plain DOM
 * CustomEvent rather than React context on purpose — the link can then sit
 * anywhere in the tree (or in a future page that has no shared provider with
 * the tour) and still start it.
 */
export const TOUR_START_EVENT = 'atlas:tour:start';

/**
 * The whole walk — ten stops across two pages, in the order they are shown.
 *
 * `/atlas`, following the page's own reading order, top to bottom and left
 * before right where two things share a row:
 *
 *   ways-in  the intro links row, at the very top
 *   floor    the training floor band, just under it
 *   rail     the standings, top of the left column
 *   dial     paint the world, top of the map column
 *   map      the map itself
 *   search   the box in the map's bottom-right corner
 *
 * Ordered this way on 2026-08-13. It used to open on the map and then jump
 * back up to the search, the dial, the rail and the links, which meant the
 * page scrolled up and down under you and you never got a sense of how it
 * is laid out. Following the page instead means each step is next to the
 * one before it, so by the end you have been walked down the page once and
 * know where everything sits.
 *
 * Then `/atlas/learn`, the training floor:
 *
 *   grade    your grade seal
 *   cotd     country of the day
 *   games    the grid of five
 *   wall     the runs you have finished
 *
 * The seam is between `plate-search` and `floor-grade`. Pressing Next on the
 * last /atlas step is what carries you over; the `plate-floor` card earlier on
 * is the one that warns you it is coming.
 */
export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: 'plate-ways-in',
    route: '/atlas',
    target: 'ways-in',
    title: 'Two more ways in',
    body: 'Put countries side by side, or read a full ranked table.',
    allowTargetClick: false,
  },
  {
    id: 'plate-floor',
    route: '/atlas',
    target: 'floor',
    title: 'The training floor',
    body: 'Five games built from this same data, with a grade to climb. This tour walks you in there at the end.',
    allowTargetClick: false,
  },
  {
    id: 'plate-rail',
    route: '/atlas',
    target: 'rail',
    title: 'The standings',
    body: 'Every country ranked by whatever the dial is showing. Click a row to open it.',
    allowTargetClick: false,
  },
  {
    id: 'plate-dial',
    route: '/atlas',
    target: 'dial',
    title: 'The dial',
    body: 'Paint the world by one measure — population, income, life expectancy. The map recolours.',
    allowTargetClick: true,
  },
  {
    id: 'plate-map',
    route: '/atlas',
    target: 'map',
    title: 'The world, engraved',
    body: 'Hover a country to see its name, drag to move, scroll to zoom. Click any country to open its note.',
    allowTargetClick: false,
  },
  {
    id: 'plate-search',
    route: '/atlas',
    target: 'search',
    title: 'Search',
    body: 'Know the country already? Type its name here.',
    allowTargetClick: true,
  },
  {
    id: 'floor-grade',
    route: '/atlas/learn',
    target: 'grade',
    title: 'Your grade',
    body: 'It climbs as you answer correctly, across every game.',
    allowTargetClick: false,
  },
  {
    id: 'floor-cotd',
    route: '/atlas/learn',
    target: 'cotd',
    title: 'Country of the day',
    body: 'One country picked out every day. Worth a look before you start.',
    allowTargetClick: false,
  },
  {
    id: 'floor-games',
    route: '/atlas/learn',
    target: 'games',
    title: 'The five games',
    body: 'Best first. Ten questions a run.',
    allowTargetClick: false,
  },
  {
    id: 'floor-wall',
    route: '/atlas/learn',
    target: 'wall',
    title: 'The wall',
    body: 'Every run you finish hangs here.',
    allowTargetClick: false,
  },
];

/**
 * Is there a tour on this route, and if so which page is it?
 *
 * Exact matches only. A dossier (`/atlas/USA`), a comparison, a rankings
 * table or a single game gets nothing. Returning `null` is what makes
 * AtlasTour render nothing on them even though it is mounted once for the
 * whole section in app/atlas/layout.tsx, and what makes TourReplayLink
 * disappear there too.
 */
export function tourRouteFor(pathname: string | null | undefined): TourRoute | null {
  if (pathname === '/atlas') return '/atlas';
  if (pathname === '/atlas/learn') return '/atlas/learn';
  return null;
}

/**
 * Which steps a run gets, given where it was started.
 *
 * Start on /atlas and you get all ten — the walk crosses into the training
 * floor half-way through and the counter reads "1 of 10" the whole way.
 *
 * Start on /atlas/learn and you get only that page's four, numbered "1 of 4".
 * Somebody who arrived at the training floor directly has never seen the
 * plate, so walking them backwards through it would be strange, and numbering
 * their first card "7 of 10" would be stranger still.
 */
export function queueForStart(route: TourRoute): readonly TourStep[] {
  if (route === '/atlas') return TOUR_STEPS;
  return TOUR_STEPS.filter((step) => step.route === route);
}
