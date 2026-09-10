/**
 * The two things every figure in the kit has to do with a number,
 * written once so seven components cannot drift into seven house
 * styles for the same value.
 *
 * Everything is formatted on the server — every figure but <Dial> and
 * <Steps> is a server component, and those two format on both sides
 * from the same function — so there is no locale to disagree about.
 * The separator is a plain comma, chosen rather than inherited: this
 * site is written in English and Intl.NumberFormat would hand a
 * different string to a reader in Berlin than the one the caption
 * beside it was written against.
 */

/** 128000 -> "128,000". Decimals are kept as written. */
export function fmt(value: number): string {
  if (!Number.isFinite(value)) return '—'

  const negative = value < 0
  const [whole, fraction] = Math.abs(value).toString().split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return `${negative ? '-' : ''}${grouped}${fraction ? `.${fraction}` : ''}`
}

/** A value and its unit, with the space only where there should be one. */
export function withUnit(value: number, unit?: string): string {
  if (!unit) return fmt(value)
  // A leading symbol sits against the figure; a word stands off it.
  if (/^[^\w\s]/.test(unit)) return `${unit}${fmt(value)}`
  return `${fmt(value)} ${unit}`
}

/**
 * A share of a whole, as a percentage for an inline width. Rounded to
 * four places, because a raw division writes 61.86000000000001% into
 * the markup and that lands in the page a reader downloads.
 */
export function share(value: number, total: number): number {
  if (!(total > 0) || !Number.isFinite(value) || value <= 0) return 0
  return Math.round(Math.min(100, (value / total) * 100) * 10000) / 10000
}

/** One decimal place at most, and no trailing ".0". */
export function round1(value: number): string {
  return String(Math.round(value * 10) / 10)
}
