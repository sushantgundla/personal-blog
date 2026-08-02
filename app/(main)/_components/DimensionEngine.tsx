'use client';

import { useEffect } from 'react';
import { initDimensions } from '../_lib/dimensions';
import '../transitions.css';

/**
 * Mounts the DIMENSION theme engine once for the whole /v2 page. Renders
 * nothing visible — just the effect that wires up dimensions.ts, and the
 * hidden SVG filter definitions the "tear" transition needs.
 */
/**
 * Relative luminance of a CSS colour, per WCAG. Handles #rgb, #rrggbb and
 * rgb()/rgba(). Returns null for anything it cannot parse.
 */
function luminance(color: string): number | null {
  let rgb: number[] | null = null;

  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1];
    rgb =
      h.length === 3
        ? h.split('').map((c) => parseInt(c + c, 16))
        : [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  } else {
    const nums = color.match(/[\d.]+/g);
    if (nums && nums.length >= 3) rgb = nums.slice(0, 3).map(Number);
  }

  if (!rgb || rgb.some((n) => Number.isNaN(n))) return null;

  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export default function DimensionEngine() {
  useEffect(() => {
    const cleanup = initDimensions();
    return cleanup;
  }, []);

  /**
   * Keep `color-scheme` in step with the active dimension.
   *
   * next-themes puts `class="dark"` and `color-scheme: dark` on <html> for the
   * whole site. Chrome uses that to paint the scrollbar track — so on /v2 the
   * scrollbar stays dark grey even in a light dimension like `swiss`,
   * `brutalist` or `clay`, showing up as a grey band down the right edge (and
   * along the bottom whenever a horizontal scrollbar appears).
   *
   * Deriving the scheme from the resolved --v2-bg means every dimension gets
   * the right scrollbar automatically, including any added later — no per-theme
   * token to forget.
   */
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.colorScheme;

    const sync = () => {
      const bg = getComputedStyle(root).getPropertyValue('--v2-bg');
      const l = luminance(bg);
      if (l === null) return;
      root.style.colorScheme = l > 0.4 ? 'light' : 'dark';
    };

    // Timing matters here. --v2-bg only holds the new value once the theme
    // stylesheet has actually parsed, which is *after* both the attribute
    // change and the next animation frame. Reading too early leaves a light
    // dimension stuck on colorScheme:dark — a dark grey scrollbar down the
    // right edge of a white page. So: read on the link's load event (the
    // reliable signal), and re-read on a few short delays as a safety net for
    // cached sheets, where `load` can fire before this effect attaches.
    const timers: number[] = [];
    const scheduleSync = () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
      requestAnimationFrame(sync);
      [80, 250, 700].forEach((ms) => timers.push(window.setTimeout(sync, ms)));
    };

    scheduleSync();

    const link = document.getElementById('v2-theme-link');
    link?.addEventListener('load', sync);

    const observer = new MutationObserver(scheduleSync);
    observer.observe(root, { attributes: true, attributeFilter: ['data-v2-dimension'] });

    return () => {
      timers.forEach(clearTimeout);
      observer.disconnect();
      link?.removeEventListener('load', sync);
      root.style.colorScheme = previous;
    };
  }, []);

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        <filter id="v2-tear" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.7"
            numOctaves={1}
            seed={7}
            result="v2-tear-noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="v2-tear-noise"
            scale={40}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
