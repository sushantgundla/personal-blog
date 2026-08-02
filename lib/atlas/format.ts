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

function isMissing(v: number | null | undefined): v is null | undefined {
  return v === null || v === undefined || typeof v !== 'number' || Number.isNaN(v);
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

  const negative = value < 0;
  const abs = Math.abs(value);
  const allowCompact = opts.compact ?? (format === 'number' || format === 'currency');

  let body: string;
  if (allowCompact && abs >= 1e6) {
    if (abs >= 1e12) {
      body = `${fixed(abs / 1e12, opts.decimals ?? 2)}T`;
    } else if (abs >= 1e9) {
      body = `${fixed(abs / 1e9, opts.decimals ?? 2)}B`;
    } else {
      body = `${fixed(abs / 1e6, opts.decimals ?? 1)}M`;
    }
  } else {
    body = fixed(abs, opts.decimals ?? defaultDecimalsFor(format));
  }

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

/** `formatRank(5, 195)` → `"#5 of 195"`. Missing rank → `"—"`. */
export function formatRank(rank: number | null | undefined, total: number): string {
  if (isMissing(rank)) return DEFAULT_EMPTY;
  const safeTotal = isMissing(total) ? 0 : Math.round(total);
  return `#${Math.round(rank)} of ${new Intl.NumberFormat('en-US').format(safeTotal)}`;
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
