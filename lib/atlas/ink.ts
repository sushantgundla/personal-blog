/**
 * Per-country ink: one muted hue derived from a country's ISO3 code, used to
 * tint that country's guilloché, note edges and section rules. Never the
 * global ember accent, and never candy-bright — every hue is clamped to
 * `hsl(h, 30-38%, 48-56%)`.
 *
 * Accessibility is not optional here: a hash can easily land on a hue that,
 * even inside that clamp, fails contrast against `--note-paper` (#1A1613).
 * `countryInk` asserts contrast at build/render time and adjusts lightness
 * until it passes, falling back to `--note-seal` if nothing safe works.
 */

import { hashString, hashToRange } from './hash';

export interface CountryInk {
  /** Hue in degrees, 0-360. Exposed for debugging / the UV-mode palette swap. */
  hue: number;
  /** The primary ink colour — guaranteed to pass 4.5:1 against --note-paper. */
  hex: string;
  /** A dimmer variant of the same hue, for hairlines and secondary use. */
  hexDim: string;
}

/** --note-paper from atlas.css. Kept in sync with the design tokens by hand. */
const PAPER_HEX = '#1A1613';
/** --note-seal — the accessible fallback when a hue genuinely can't pass. */
const SEAL_HEX = '#B08D57';

const MIN_CONTRAST = 4.5;
const SAT_MIN = 30;
const SAT_MAX = 38;
const LIGHT_MIN = 48;
const LIGHT_MAX = 56;
/** Safe outer bounds to search before giving up — still far from candy-bright. */
const LIGHT_SAFE_MIN = 35;
const LIGHT_SAFE_MAX = 70;

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

function srgbChannelToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const [rl, gl, bl] = [r, g, b].map(srgbChannelToLinear);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/**
 * WCAG 2.x contrast ratio between two hex colours: 1 (identical) to 21 (max,
 * pure black vs. pure white). Exported so callers and tests can check any
 * colour pair, not just the ones this module derives.
 */
export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = s / 100;
  const ll = l / 100;
  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = ll - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh < 60) [r, g, b] = [c, x, 0];
  else if (hh < 120) [r, g, b] = [x, c, 0];
  else if (hh < 180) [r, g, b] = [0, c, x];
  else if (hh < 240) [r, g, b] = [0, x, c];
  else if (hh < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** A visually dimmer variant of an ink hex, for secondary lines and hairlines. */
function dim(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const factor = 0.72;
  const toHex = (v: number) => Math.round(v * factor).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Derive one muted hue for a country and guarantee it is readable on note
 * stock. The hue itself never moves once contrast has been satisfied — only
 * lightness is adjusted, and only within a still-muted range.
 */
export function countryInk(iso3: string): CountryInk {
  const seed = iso3.toUpperCase();
  const hue = Math.round(hashToRange(hashString(`${seed}:hue`), 0, 360));
  const sat = hashToRange(hashString(`${seed}:sat`), SAT_MIN, SAT_MAX);
  const nominalLight = hashToRange(hashString(`${seed}:light`), LIGHT_MIN, LIGHT_MAX);

  const nominal = hslToHex(hue, sat, nominalLight);
  if (contrastRatio(nominal, PAPER_HEX) >= MIN_CONTRAST) {
    return { hue, hex: nominal, hexDim: dim(nominal) };
  }

  // Paper is very dark, so lightening almost always restores contrast.
  // Walk outward from the nominal band toward safe (still muted) extremes.
  for (let l = Math.ceil(LIGHT_MAX); l <= LIGHT_SAFE_MAX; l += 1) {
    const candidate = hslToHex(hue, sat, l);
    if (contrastRatio(candidate, PAPER_HEX) >= MIN_CONTRAST) {
      return { hue, hex: candidate, hexDim: dim(candidate) };
    }
  }
  for (let l = Math.floor(LIGHT_MIN); l >= LIGHT_SAFE_MIN; l -= 1) {
    const candidate = hslToHex(hue, sat, l);
    if (contrastRatio(candidate, PAPER_HEX) >= MIN_CONTRAST) {
      return { hue, hex: candidate, hexDim: dim(candidate) };
    }
  }

  // Nothing safe passes: never ship unreadable colour.
  return { hue, hex: SEAL_HEX, hexDim: dim(SEAL_HEX) };
}
