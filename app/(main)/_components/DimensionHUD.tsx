'use client';

import { useCallback, useEffect, useState } from 'react';
import { DIMENSIONS, getDimension, shuffleDimension, subscribe } from '../_lib/dimensions';
import './hud.css';

/**
 * The only control on the page.
 *
 * Deliberately one small button in the bottom-left corner, not a control panel.
 * The page has 30 designs; a visitor does not need a menu, an index readout, a
 * shortcut legend and a progress bar to enjoy that — they need one inviting
 * thing to press. Each press = exactly one new design, with its transition.
 *
 * There is no auto-rotate. A page that repaints itself on a timer while you are
 * trying to read it is hostile; the visitor asks for every change.
 *
 * The button keeps its own dark-glass look instead of using the theme tokens,
 * so it stays legible across all 30 dimensions.
 */
function DimensionHUD() {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const nameFor = (slug: string) => DIMENSIONS.find((d) => d.slug === slug)?.name ?? '';
    setMounted(true);
    setName(nameFor(getDimension()));
    return subscribe((slug) => setName(nameFor(slug)));
  }, []);

  const onClick = useCallback(() => {
    // The transition runs ~640ms. Swallow clicks during it so an impatient
    // double-tap cannot stack two swaps and strand the page mid-distortion.
    setBusy((isBusy) => {
      if (isBusy) return isBusy;
      shuffleDimension();
      window.setTimeout(() => setBusy(false), 700);
      return true;
    });
  }, []);

  return (
    <div id="v2-hud">
      <button
        type="button"
        className={`v2-hud-btn${busy ? ' is-busy' : ''}`}
        onClick={onClick}
        aria-label="Change this page's design"
      >
        <span className="v2-hud-btn-spark" aria-hidden="true" />
        <span className="v2-hud-btn-text">
          <span className="v2-hud-btn-label">Design curious?</span>
          {/* Reserve the line before mount so the button never changes size. */}
          <span className="v2-hud-btn-sub">{mounted && name ? name : ' '}</span>
        </span>
      </button>
    </div>
  );
}

// app/v2/layout.tsx imports this as a named import.
export { DimensionHUD };
export default DimensionHUD;
