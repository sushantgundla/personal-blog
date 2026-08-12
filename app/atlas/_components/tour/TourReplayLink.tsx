'use client';

import { usePathname } from 'next/navigation';
import { TOUR_KEY, TOUR_START_EVENT, tourRouteFor } from './tour-steps';
import { clearTourResume, clearTourSeen } from './tour-storage';
import styles from './tour.module.css';

/**
 * "Take the tour →" — the way back in once the tour has been seen and its
 * localStorage key written.
 *
 * The same button on both pages, and it starts the walk that belongs to where
 * it is pressed: from /atlas the whole ten, which carries on into the training
 * floor by itself; from /atlas/learn just that page's four. AtlasTour works
 * that out from the route — this button only says "go".
 *
 * It talks to AtlasTour through one DOM event rather than React context or a
 * shared store. The two components can then sit anywhere in the tree (this one
 * lives in a page's own link row, the tour lives in app/atlas/layout.tsx) with
 * nothing between them, and a third caller could start the tour later without
 * either file changing.
 *
 * A <button>, not an <a>: it goes nowhere. It is styled to match whatever link
 * row it is dropped into, via `className`.
 */
export function TourReplayLink({ className }: { className?: string }) {
  const pathname = usePathname();
  const route = tourRouteFor(pathname);

  /* Only /atlas and /atlas/learn have a tour to replay. Rendering nothing
     elsewhere means the link is safe to drop into a shared layout later. */
  if (!route) return null;

  const start = () => {
    clearTourSeen(TOUR_KEY);
    /* Any half-finished walk still noted down is over — this is a fresh one
       from the top, and a stale marker would drag it to the wrong step. */
    clearTourResume();
    window.dispatchEvent(new CustomEvent(TOUR_START_EVENT));
  };

  return (
    <button
      type="button"
      /* `replayReset` only undoes the button chrome a link never wants —
         background, the three borders that are not the bottom one, top/side
         padding. It deliberately leaves border-bottom, colour and font alone,
         because the class the page passes in (.introLink on /atlas, the
         toolbar link class on /atlas/learn) sets exactly those, and a CSS
         module's source order against another module's is not guaranteed. */
      className={`${styles.replayReset} ${className ?? styles.replayLink}`}
      onClick={start}
    >
      Take the tour →
    </button>
  );
}
