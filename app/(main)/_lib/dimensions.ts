/**
 * app/v2/_lib/dimensions.ts
 *
 * Framework-free engine for the v2 "DIMENSION" theme system. The entire visual
 * identity of /v2 is one <link id="v2-theme-link"> tag; this module owns
 * picking which stylesheet is loaded, persisting the choice, driving the
 * "drift" auto-cycle, and choreographing the cinematic transition that hides
 * the repaint when the stylesheet swaps.
 *
 * No React here on purpose — DimensionEngine.tsx is the only consumer that
 * knows this is running inside a component tree.
 */

export interface Dimension {
  slug: string;
  name: string;
  blurb: string;
  tier: 'core' | 'more';
}

// Order matches docs/architecture/design-system.md §8 exactly.
export const DIMENSIONS: Dimension[] = [
  { slug: 'ember', name: 'Ember', blurb: 'Dark charcoal, ember orange, editorial serif calm.', tier: 'core' },
  { slug: 'terminal', name: 'Phosphor Terminal', blurb: 'P1 phosphor, 80 columns, no mercy.', tier: 'core' },
  { slug: 'blueprint', name: 'Blueprint', blurb: 'Navy paper, cyan linework, drafted by hand.', tier: 'more' },
  { slug: 'swiss', name: 'Swiss', blurb: 'Helvetica at full volume, one red accent.', tier: 'more' },
  { slug: 'brutalist', name: 'Neo-Brutalism', blurb: "Off-white, black borders, shadows that don't apologize.", tier: 'core' },
  { slug: 'cyberpunk', name: 'Cyberpunk', blurb: 'Acid yellow, cyan glow, corners cut with a knife.', tier: 'core' },
  { slug: 'synthwave', name: 'Synthwave', blurb: 'Magenta horizon, chrome type, sunset forever.', tier: 'core' },
  { slug: 'paper', name: 'Letterpress', blurb: 'Cream stock, deep ink, pressed by a letterpress.', tier: 'more' },
  { slug: 'glass', name: 'Glassmorphism', blurb: 'Frosted panels floating over an aurora wash.', tier: 'core' },
  { slug: 'neontokyo', name: 'Neon Tokyo', blurb: 'Wet asphalt, pink and blue neon, rain on glass.', tier: 'more' },
  { slug: 'matrix', name: 'Matrix', blurb: 'Black void, cascading green, mono, zero mercy.', tier: 'more' },
  { slug: 'vaporwave', name: 'Vaporwave', blurb: 'Pastel chrome, oversized type, eternal mall music.', tier: 'more' },
  { slug: 'nord', name: 'Nord', blurb: 'Arctic blue-grey, quiet confidence, soft edges.', tier: 'more' },
  { slug: 'solarized', name: 'Solarized', blurb: "The editor palette you've stared at for years.", tier: 'more' },
  { slug: 'clay', name: 'Claymorphism', blurb: 'Pastel lilac, fat radius, squeeze it and it gives.', tier: 'more' },
  { slug: 'neumorph', name: 'Neumorphism', blurb: 'Monochrome, no lines, just light and shadow.', tier: 'more' },
  { slug: 'eink', name: 'E-Ink', blurb: 'Greyscale, hairlines, built for reading not looking.', tier: 'more' },
  { slug: 'oscillo', name: 'Oscilloscope', blurb: 'Black screen, cyan waveform, thin phosphor traces.', tier: 'more' },
  { slug: 'latent', name: 'Latent Space', blurb: 'Indigo to violet, embeddings drifting in the dark.', tier: 'core' },
  { slug: 'gold', name: 'Gilded', blurb: 'Black and antique gold, restraint as luxury.', tier: 'more' },
  { slug: 'ascii', name: 'ASCII', blurb: 'Two colours, box-drawing borders, pure monospace.', tier: 'more' },
  { slug: 'bauhaus', name: 'Bauhaus', blurb: 'Ecru canvas, primary shapes, hard geometry.', tier: 'more' },
  { slug: 'attention', name: 'Attention Heads', blurb: 'A transformer heatmap, blue through violet to amber.', tier: 'core' },
  { slug: 'thermal', name: 'Thermal', blurb: 'Ironbow heat vision, no borders, only glowing edges.', tier: 'more' },
  { slug: 'riso', name: 'Risograph', blurb: 'Two fluorescent inks, misregistered, on rough newsprint.', tier: 'more' },
  { slug: 'blackbox', name: 'Black Box', blurb: 'Flight recorder orange, warning stripes, cockpit panel.', tier: 'more' },
  { slug: 'monsoon', name: 'Monsoon', blurb: 'Rain-washed Bengaluru, wet slate, warm window light.', tier: 'more' },
  { slug: 'descent', name: 'Gradient Descent', blurb: 'Loss-landscape contours, cool to warm as loss drops.', tier: 'more' },
  { slug: 'xerox', name: 'Xerox', blurb: 'Fifth-generation photocopy, dithered, punk zine grit.', tier: 'more' },
  { slug: 'chalk', name: 'Chalk', blurb: 'Dark green slate, chalk dust, lecture hall hush.', tier: 'more' },
];

const STORAGE_KEY = 'v2-dimension';
const LINK_ID = 'v2-theme-link';
const DEFAULT_SLUG = 'ember';

// Keep in sync with the class vocabulary driven by transitions.css.
const TRANSITION_TYPES = ['tear', 'shatter', 'scanline', 'pixelate', 'iris', 'rewind', 'collapse'] as const;
type TransitionType = (typeof TRANSITION_TYPES)[number];
const DEFAULT_TRANSITION: TransitionType = 'tear';

// Total choreography length. transitions.css beats are authored against this
// same 640ms so the stylesheet swap below lands at each animation's peak
// distortion frame.
const TRANSITION_DURATION_MS = 640;
const SWAP_AT_RATIO = 0.45;

let currentSlug: string = DEFAULT_SLUG;
const subscribers = new Set<(slug: string) => void>();
// Caches the resolved --v2-enter value per theme so repeat visits to a
// dimension don't re-fetch its stylesheet just to read one custom property.
const enterTypeCache = new Map<string, Promise<TransitionType>>();

function isValidSlug(slug: string): boolean {
  return DIMENSIONS.some((d) => d.slug === slug);
}

function themeHref(slug: string): string {
  return `/v2/themes/${slug}.css`;
}

function ensureLinkEl(): HTMLLinkElement {
  let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  return link;
}

function notify(): void {
  subscribers.forEach((cb) => cb(currentSlug));
}

function persist(slug: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, slug);
  } catch {
    // Private browsing / storage disabled — the theme just won't survive reload.
  }
}

/** Swaps the stylesheet, updates state + the dataset attribute, notifies subscribers. */
function applyImmediate(slug: string): void {
  ensureLinkEl().href = themeHref(slug);
  currentSlug = slug;
  persist(slug);
  document.documentElement.dataset.v2Dimension = slug;
  notify();
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

async function fetchEnterType(slug: string): Promise<TransitionType> {
  if (typeof fetch !== 'function') return DEFAULT_TRANSITION;
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const timeoutId = controller ? window.setTimeout(() => controller.abort(), 400) : undefined;
    const res = await fetch(themeHref(slug), { signal: controller?.signal });
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    if (!res.ok) return DEFAULT_TRANSITION;
    const text = await res.text();
    const match = text.match(/--v2-enter:\s*([a-z]+)/i);
    const value = match?.[1]?.toLowerCase();
    if (value && (TRANSITION_TYPES as readonly string[]).includes(value)) {
      return value as TransitionType;
    }
    return DEFAULT_TRANSITION;
  } catch {
    return DEFAULT_TRANSITION;
  }
}

function resolveEnterType(slug: string): Promise<TransitionType> {
  const cached = enterTypeCache.get(slug);
  if (cached) return cached;
  const promise = fetchEnterType(slug);
  enterTypeCache.set(slug, promise);
  return promise;
}

/** Reduced-motion path: instant swap masked by a 200ms opacity crossfade only. */
function applyReduced(slug: string): void {
  const shell = document.getElementById('v2-shell');
  if (!shell) {
    applyImmediate(slug);
    return;
  }
  shell.style.transition = 'opacity 200ms ease';
  shell.style.opacity = '0';
  window.setTimeout(() => {
    applyImmediate(slug);
    window.setTimeout(() => {
      shell.style.opacity = '1';
    }, 20);
  }, 200);
}

/** Full choreography: play the target theme's --v2-enter effect, swap the
 * link at its peak-distortion beat, then let the animation settle. */
async function performTransition(slug: string): Promise<void> {
  const enterType = await resolveEnterType(slug);
  const fxClass = `v2-fx-${enterType}`;
  document.body.classList.add(fxClass);
  const swapDelay = Math.round(TRANSITION_DURATION_MS * SWAP_AT_RATIO);
  window.setTimeout(() => {
    applyImmediate(slug);
  }, swapDelay);
  window.setTimeout(() => {
    document.body.classList.remove(fxClass);
  }, TRANSITION_DURATION_MS);
}

function runTransition(slug: string): void {
  void performTransition(slug);
}

export function getDimension(): string {
  return currentSlug;
}

export function setDimension(slug: string): void {
  if (!isValidSlug(slug) || slug === currentSlug) return;
  if (prefersReducedMotion()) {
    applyReduced(slug);
  } else {
    runTransition(slug);
  }
}

/**
 * Jump to a random other dimension. ONE shift per call — there is deliberately
 * no timer here. An auto-rotating loop hijacks the page while you are trying to
 * read it; the visitor asks for each change.
 */
export function shuffleDimension(): void {
  const options = DIMENSIONS.filter((d) => d.slug !== currentSlug);
  const pick = options[Math.floor(Math.random() * options.length)];
  if (pick) setDimension(pick.slug);
}

export function subscribe(cb: (slug: string) => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

function stepDimension(direction: 1 | -1): void {
  const index = DIMENSIONS.findIndex((d) => d.slug === currentSlug);
  const base = index === -1 ? 0 : index;
  const next = DIMENSIONS[(base + direction + DIMENSIONS.length) % DIMENSIONS.length];
  if (next) setDimension(next.slug);
}

function resolveStartSlug(): string {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('dimension');
  if (fromUrl && isValidSlug(fromUrl)) return fromUrl;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isValidSlug(stored)) return stored;
  } catch {
    // localStorage unavailable — fall through to the default.
  }

  return DEFAULT_SLUG;
}

export function initDimensions(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  ensureLinkEl();

  // First paint: apply directly, no transition choreography.
  const startSlug = resolveStartSlug();
  applyImmediate(startSlug);

  const onKeydown = (event: KeyboardEvent): void => {
    if (isEditableTarget(event.target)) return;
    if (event.key === '[') {
      event.preventDefault();
      stepDimension(-1);
    } else if (event.key === ']') {
      event.preventDefault();
      stepDimension(1);
    } else if (event.key === '\\') {
      event.preventDefault();
      shuffleDimension();
    }
  };
  window.addEventListener('keydown', onKeydown);

  return () => {
    window.removeEventListener('keydown', onKeydown);
  };
}
