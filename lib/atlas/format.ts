/**
 * Formatting for the Atlas dossier, where every number is a "denomination" —
 * a big engraved figure that must never render as `NaN`, `undefined` or
 * `$NaN` no matter how broken the underlying source data is.
 *
 * All formatting is locale-pinned to `en-US` on purpose: the page must look
 * identical everywhere, regardless of the visitor's browser locale.
 */

export type ValueFormat = 'number' | 'currency' | 'percent' | 'years' | 'per1000';

export interface FormatValueOptions {
  /**
   * Compact big numbers to T / B / M suffixes (3.55T, 1.43B, 142.5M).
   * Defaults to `true` for 'number' and 'currency', `false` otherwise —
   * percents, year counts and per-1000 rates are never large enough to need it.
   */
  compact?: boolean;
  /** Decimal places. Overrides the per-format default below. */
  decimals?: number;
  /** String printed for `null`, `undefined` or `NaN`. Defaults to '—'. */
  empty?: string;
  /** Prefix a '+' on positive values, e.g. for year-over-year change figures. */
  showSign?: boolean;
}

/** The em dash used everywhere a number is missing, not zero. */
const DEFAULT_EMPTY = '—';

/**
 * Wikidata serialises every image/audio URL as literal `http://`, even
 * though Commons and Wikipedia are https-only — that is just how Wikidata
 * stores the property, regardless of the real scheme. `next/image`'s
 * `remotePatterns` in `next.config.js` is (correctly) https-only, so passing
 * an `http://` value straight through throws instead of degrading, taking
 * the whole page down with it (confirmed live: Gandhi's portrait on
 * `/atlas/ind`, Chiang Kai-shek's on `/atlas/twn`).
 *
 * One shared fix, applied at the source in `lib/atlas/sources/wikidata.ts`
 * so every field it returns is already normalised, and reused by any
 * component that renders a URL from elsewhere (e.g. the static
 * `content/atlas/famous-people.json`) as a second line of defence.
 */
export function toHttps(url: string): string;
export function toHttps(url: string | null): string | null;
export function toHttps(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith('http://') ? `https://${url.slice(7)}` : url;
}

/**
 * A Commons `Special:FilePath/<file>` URL — every image field Wikidata
 * returns (flags, coats of arms, portraits, landmark photos) — 301-redirects
 * to `upload.wikimedia.org` and serves the original file verbatim. For an
 * SVG (every flag) that throws inside `next/image`, which is https-only and
 * deliberately does not enable `dangerouslyAllowSVG` (arbitrary remote SVG
 * can carry a `<script>`). Confirmed live: the bare URL for India's flag
 * 301s straight to a `.svg`; the same URL with `?width=320` appended instead
 * redirects through Commons' own thumbnailer to a 200 `image/png` response.
 *
 * Appending `?width=N` fixes three things at once, for any Special:FilePath
 * URL: it rasterises SVGs to PNG, it caps the byte size of full-resolution
 * portrait/landmark photos (some are several megabytes), and it collapses
 * what was an inconsistent redirect chain into one Commons handles the same
 * way every time — the portrait watermark rendering once and not the next
 * traced back to exactly this.
 *
 * A non-Commons URL (or one already carrying a query string this function
 * doesn't recognise) is returned unchanged.
 */
export function commonsThumbnail(url: string, width: number): string;
export function commonsThumbnail(url: string | null, width: number): string | null;
export function commonsThumbnail(url: string | null, width: number): string | null {
  if (!url) return null;
  if (!url.includes('/Special:FilePath/')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}width=${width}`;
}

/** `Infinity` counts as missing too: it is never a real measurement, and
 * left alone it would engrave as `∞T` / `$∞T`. */
function isMissing(v: number | null | undefined): v is null | undefined {
  return v === null || v === undefined || typeof v !== 'number' || !Number.isFinite(v);
}

/** Compact suffixes, smallest first, with each one's default decimals. */
const COMPACT_UNITS: ReadonlyArray<{ div: number; suffix: string; decimals: number }> = [
  { div: 1e6, suffix: 'M', decimals: 1 },
  { div: 1e9, suffix: 'B', decimals: 2 },
  { div: 1e12, suffix: 'T', decimals: 2 },
];

/**
 * `abs` (already >= 1e6) as a compact figure. Picks the unit from the
 * magnitude, then steps up one unit whenever rounding alone would carry the
 * figure to 1,000 — so 999,960,000 reads `1.00B`, not `1,000.0M`.
 */
function compact(abs: number, decimals: number | undefined): string {
  let i = COMPACT_UNITS.length - 1;
  while (i > 0 && abs < COMPACT_UNITS[i].div) i--;
  for (; i < COMPACT_UNITS.length; i++) {
    const unit = COMPACT_UNITS[i];
    const d = decimals ?? unit.decimals;
    const rounded = Number((abs / unit.div).toFixed(d));
    if (rounded < 1000 || i === COMPACT_UNITS.length - 1) {
      return `${fixed(abs / unit.div, d)}${unit.suffix}`;
    }
  }
  return fixed(abs, decimals ?? 0); // unreachable: the last unit always returns
}

/** Fixed-decimal, `en-US`-grouped formatting. Safe at any magnitude. */
function fixed(n: number, decimals: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

function defaultDecimalsFor(format: ValueFormat): number {
  switch (format) {
    case 'percent':
    case 'years':
    case 'per1000':
      return 1;
    case 'currency':
    case 'number':
    default:
      return 0;
  }
}

/**
 * Format a single denomination value. Never throws, never prints `NaN`.
 *
 * Examples: `formatValue(3.554e12, 'currency')` → `"$3.55T"`,
 * `formatValue(2485, 'number')` → `"2,485"`,
 * `formatValue(null, 'number')` → `"—"`,
 * `formatValue(0, 'number')` → `"0"` (zero is a real value, not "no data").
 */
export function formatValue(
  value: number | null | undefined,
  format: ValueFormat,
  opts: FormatValueOptions = {}
): string {
  const empty = opts.empty ?? DEFAULT_EMPTY;
  if (isMissing(value)) return empty;

  const abs = Math.abs(value);
  const allowCompact = opts.compact ?? (format === 'number' || format === 'currency');

  const body =
    allowCompact && abs >= 1e6
      ? compact(abs, opts.decimals)
      : fixed(abs, opts.decimals ?? defaultDecimalsFor(format));

  // A tiny negative that rounds to zero (-0.04 → "0.0") must not keep its
  // minus sign: "-0.0%" reads as a real, if small, decline.
  const negative = value < 0 && /[1-9]/.test(body);

  let prefix = '';
  let suffix = '';
  switch (format) {
    case 'currency':
      prefix = '$';
      break;
    case 'percent':
      suffix = '%';
      break;
    case 'years':
      suffix = ' yrs';
      break;
    case 'per1000':
      suffix = ' /1,000';
      break;
    case 'number':
    default:
      break;
  }

  const sign = negative ? '-' : opts.showSign ? '+' : '';
  return `${sign}${prefix}${body}${suffix}`;
}

/** `formatRank(5, 195)` → `"#5 of 195"`. Missing rank → `"—"`. A missing
 * or zero total drops the "of" rather than claiming `"#5 of 0"`. */
export function formatRank(rank: number | null | undefined, total: number | null | undefined): string {
  if (isMissing(rank)) return DEFAULT_EMPTY;
  if (isMissing(total) || total <= 0) return `#${Math.round(rank)}`;
  return `#${Math.round(rank)} of ${new Intl.NumberFormat('en-US').format(Math.round(total))}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * A Wikidata date ("1947-08-15T00:00:00Z") as an engraved date:
 * `"15 Aug 1947"`. A padded 01-01 is how Wikidata stores a year-only
 * value, so it prints the bare year rather than a false "01 Jan".
 * The year's xsd:dateTime zero-padding is stripped in both branches —
 * France's P571 is "0481-01-01" and must read `"481"`, not `"0481"`.
 * Anything that doesn't parse is returned unchanged.
 */
export function formatWikidataDate(iso: string): string {
  const m = /^([+-]?)(\d{1,6})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, sign, digits, month, day] = m;
  const year = `${sign === '-' ? '-' : ''}${Number(digits)}`;
  if (month === '01' && day === '01') return year;
  const mi = Number(month) - 1;
  return mi >= 0 && mi < 12 ? `${day} ${MONTHS[mi]} ${year}` : year;
}

/**
 * `formatYear(2025)` → `"2025"`. Every number on the dossier is paired with
 * the year it came from, since World Bank data can lag 3-5 years.
 */
export function formatYear(year: number | null | undefined): string {
  if (isMissing(year)) return DEFAULT_EMPTY;
  return String(Math.round(year));
}

/**
 * `formatComparison(61, 100)` → `"61% of world average"`.
 * Guards against a missing or zero world average, which would otherwise
 * divide by zero and print `Infinity% of world average`.
 */
export function formatComparison(
  value: number | null | undefined,
  worldAverage: number | null | undefined
): string {
  if (isMissing(value) || isMissing(worldAverage) || worldAverage === 0) {
    return DEFAULT_EMPTY;
  }
  const pct = Math.round((value / worldAverage) * 100);
  return `${pct}% of world average`;
}
