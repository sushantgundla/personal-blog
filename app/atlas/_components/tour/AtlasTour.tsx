'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { usePathname } from 'next/navigation';
import { TOUR_START_EVENT, tourForPath, type TourStep } from './tour-steps';
import { clearTourSeen, hasSeenTour, markTourSeen } from './tour-storage';
import styles from './tour.module.css';

/**
 * The first-visit tour for /atlas and /atlas/learn.
 *
 * Mounted once, in app/atlas/layout.tsx, for the whole section. It reads the
 * route and picks a step list (tour-steps.ts); on any other /atlas/* route it
 * renders nothing at all. One component, one overlay, one card.
 *
 * It never asks any other component to cooperate. The pages only carry a
 * `data-tour="..."` attribute; everything else — dimming the page, cutting a
 * hole, blocking clicks, tracking the target as the page scrolls — happens
 * inside this file. That is deliberate: a tour is a temporary thing and
 * should not leave "is the tour running?" branches in the map, the rail or
 * the game grid.
 */

/** Breathing room between the target's real edges and the hole. */
const HOLE_PAD = 8;
/** Gap between the hole and the card that points at it. */
const CARD_GAP = 12;
/** The card never comes closer than this to a viewport edge. */
const VIEWPORT_MARGIN = 16;
/** Under this width the card stops chasing the hole and pins to the bottom. */
const NARROW_MAX = 640;
/**
 * How long to wait after mounting before the first step appears. The plate
 * paints a world map, a choropleth sweep and a standings rail on arrival;
 * opening the tour into the middle of that reads as the page glitching.
 */
const SETTLE_MS = 400;
/** How long after the last scroll/resize event the hole is allowed to glide again. */
const TRACKING_SETTLE_MS = 160;

/** A target's position in viewport coordinates. Plain numbers, not a live DOMRect. */
interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Where the card sits and which way its little triangle points. */
interface CardPos {
  top: number;
  left: number;
  side: 'above' | 'below';
  /** The triangle's offset from the card's own left edge, so it aims at the hole's centre. */
  arrowX: number;
}

/**
 * `useLayoutEffect` warns when React renders a component on the server, and
 * Next renders every client component there first. The card's position is
 * measured and applied in the same frame it is painted, which is exactly what
 * a layout effect is for, so swap in `useEffect` on the server (where it never
 * runs anyway) rather than give up the layout effect on the client.
 */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function readRect(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function findTarget(target: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
}

export function AtlasTour() {
  const pathname = usePathname();
  const tour = useMemo(() => tourForPath(pathname), [pathname]);
  const titleId = useId();
  const bodyId = useId();

  /**
   * The hydration guard.
   *
   * Whether the tour should run depends on localStorage, and the server has
   * no localStorage. If the first client render decided from storage, the
   * server's HTML (always "no tour") and the browser's first paint (sometimes
   * "tour") would disagree and React would throw the subtree away. So this
   * component renders `null` on the server AND on the first client render;
   * only once `mounted` flips in an effect does it read storage and decide.
   * Same pattern as app/atlas/_components/FloorGradeChip.tsx.
   */
  const [mounted, setMounted] = useState(false);

  /**
   * The surviving steps for this route, or `null` when no tour is running.
   * Set once when a tour starts — steps whose target is missing from the DOM
   * are dropped there, so everything downstream (including the "2 of 6"
   * counter) counts only steps that can actually be shown.
   */
  const [steps, setSteps] = useState<readonly TourStep[] | null>(null);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState<CardPos | null>(null);
  const [narrow, setNarrow] = useState(false);
  /** True while the page is actively scrolling, which turns the hole's glide off. */
  const [tracking, setTracking] = useState(false);

  const cardRef = useRef<HTMLDivElement | null>(null);
  /** Whatever had focus before the tour opened, so it can be handed back. */
  const returnFocusRef = useRef<HTMLElement | null>(null);
  /**
   * Held in a ref, not state: it is read inside event handlers and effects
   * that must not re-run just because the visitor changed the setting.
   */
  const reducedRef = useRef(false);

  const step = steps ? (steps[index] ?? null) : null;
  const isLast = steps ? index === steps.length - 1 : false;

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Viewport questions the layout needs answers to, kept in sync with the
     browser rather than sampled once. */
  useEffect(() => {
    const narrowQuery = window.matchMedia(`(max-width: ${NARROW_MAX}px)`);
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setNarrow(narrowQuery.matches);
      reducedRef.current = motionQuery.matches;
    };
    sync();
    narrowQuery.addEventListener('change', sync);
    motionQuery.addEventListener('change', sync);
    return () => {
      narrowQuery.removeEventListener('change', sync);
      motionQuery.removeEventListener('change', sync);
    };
  }, []);

  /* A route change ends whatever was running. Without this, walking from
     /atlas to /atlas/learn mid-tour would leave the plate's card on screen
     pointing at a hole whose target no longer exists. */
  useEffect(() => {
    setSteps(null);
    setIndex(0);
    setRect(null);
    setCardPos(null);
  }, [pathname]);

  /**
   * Start the tour for this route.
   *
   * Steps whose target is not in the DOM are dropped here, before anything is
   * shown. Country of the day can legitimately be absent on a day when
   * nothing clears its bar, so this is a real case rather than defensive
   * padding — and dropping up front is what keeps the counter honest.
   */
  const begin = useCallback(() => {
    if (!tour) return;
    const live = tour.steps.filter((s) => findTarget(s.target) !== null);
    if (live.length === 0) return;
    const active = document.activeElement;
    returnFocusRef.current = active instanceof HTMLElement ? active : null;
    setSteps(live);
    setIndex(0);
    setCardPos(null);
  }, [tour]);

  /**
   * Finish, or skip — the same ending either way. Both write the key: someone
   * who dismisses the tour has said "not again", not "ask me tomorrow".
   */
  const end = useCallback(() => {
    if (tour) markTourSeen(tour.key);
    setSteps(null);
    setIndex(0);
    setRect(null);
    setCardPos(null);
    const back = returnFocusRef.current;
    returnFocusRef.current = null;
    if (back && document.contains(back)) back.focus();
  }, [tour]);

  /* Reads `index` straight rather than through a setState updater: ending the
     tour is a side effect, and React calls updaters twice in development, so
     an updater that ended the tour would write the storage key twice. */
  const goNext = useCallback(() => {
    if (!steps) return;
    if (index >= steps.length - 1) {
      end();
      return;
    }
    setIndex(index + 1);
  }, [steps, index, end]);

  const goBack = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  /* First visit: wait for the page to settle, then run. Nothing happens on a
     route with no tour, or once the key is written. */
  useEffect(() => {
    if (!mounted || !tour) return;
    if (hasSeenTour(tour.key)) return;
    const timer = window.setTimeout(begin, SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [mounted, tour, begin]);

  /* "Take the tour →" anywhere on the page reaches us through one DOM event.
     The link clears the key too, but clearing here as well means the tour
     also restarts if some other code fires the event later. */
  useEffect(() => {
    if (!mounted || !tour) return;
    const onStart = () => {
      clearTourSeen(tour.key);
      begin();
    };
    window.addEventListener(TOUR_START_EVENT, onStart);
    return () => window.removeEventListener(TOUR_START_EVENT, onStart);
  }, [mounted, tour, begin]);

  /**
   * Bring the current step's target into view, measure it, and keep measuring
   * while the page moves.
   *
   * The measurement waits for the next animation frame because
   * `scrollIntoView` has not moved anything yet at the moment it returns. A
   * smooth scroll keeps moving for a few hundred milliseconds after that,
   * which is exactly why the scroll listener is here: each scroll event
   * re-measures, so the hole rides the target all the way down instead of
   * landing on where it used to be.
   *
   * `capture: true` on the window listener catches scrolls inside nested
   * scrollers too — the standings rail scrolls on its own, and scroll events
   * do not bubble, so a plain bubbling listener would miss it.
   */
  useEffect(() => {
    if (!step) return;
    const el = findTarget(step.target);
    /* Vanished between starting the tour and reaching this step. Rare, and
       harmless: no rect means no hole is drawn, the card falls back to its
       unanchored position, and Next still works. */
    if (!el) return;

    setTracking(false);
    el.scrollIntoView({
      block: 'center',
      inline: 'nearest',
      behavior: reducedRef.current ? 'auto' : 'smooth',
    });

    let pending = 0;
    let settle = 0;
    const measure = () => {
      pending = 0;
      setRect(readRect(el));
    };
    const schedule = () => {
      if (!pending) pending = requestAnimationFrame(measure);
    };
    schedule();

    /* Throttled to one measurement per frame — scroll and resize both fire
       far faster than the screen repaints. */
    const onMove = () => {
      setTracking(true);
      window.clearTimeout(settle);
      settle = window.setTimeout(() => setTracking(false), TRACKING_SETTLE_MS);
      schedule();
    };
    window.addEventListener('scroll', onMove, { passive: true, capture: true });
    window.addEventListener('resize', onMove, { passive: true });

    return () => {
      if (pending) cancelAnimationFrame(pending);
      window.clearTimeout(settle);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [step]);

  /**
   * Place the card beside the hole: below it when there is room, otherwise
   * above, always at least VIEWPORT_MARGIN inside every edge. On a narrow
   * screen there is no room to chase anything, so the card pins to the bottom
   * of the viewport (CSS does that part) and this does nothing.
   */
  useIsomorphicLayoutEffect(() => {
    if (!step || narrow) {
      setCardPos(null);
      return;
    }
    const card = cardRef.current;
    if (!card || !rect) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;

    const holeTop = rect.top - HOLE_PAD;
    const holeBottom = rect.top + rect.height + HOLE_PAD;

    const belowTop = holeBottom + CARD_GAP;
    const aboveTop = holeTop - CARD_GAP - ch;

    let side: 'above' | 'below';
    let top: number;
    if (belowTop + ch + VIEWPORT_MARGIN <= vh) {
      side = 'below';
      top = belowTop;
    } else if (aboveTop >= VIEWPORT_MARGIN) {
      side = 'above';
      top = aboveTop;
    } else {
      /* Neither side fits — a target taller than the viewport, usually the
         map. Sit below and let the clamp pull it back on screen; the arrow
         still points the right way. */
      side = 'below';
      top = belowTop;
    }
    top = Math.max(VIEWPORT_MARGIN, Math.min(top, vh - ch - VIEWPORT_MARGIN));

    const centre = rect.left + rect.width / 2;
    const left = Math.max(VIEWPORT_MARGIN, Math.min(centre - cw / 2, vw - cw - VIEWPORT_MARGIN));
    const arrowX = Math.max(14, Math.min(centre - left, cw - 14));

    setCardPos((prev) =>
      prev && prev.top === top && prev.left === left && prev.side === side && prev.arrowX === arrowX
        ? prev
        : { top, left, side, arrowX },
    );
  }, [step, rect, narrow]);

  /**
   * Focus lands on the card itself, not on a button, so a screen reader
   * announces the title and body before the controls.
   *
   * `placed` is in the dependency list for a reason that cost a debugging
   * session on 2026-08-13. A card that has not been positioned yet renders
   * with `visibility: hidden` (it has to be in the DOM to be measured), and
   * **a `visibility: hidden` element cannot take focus** — the `.focus()`
   * call is silently a no-op. Focusing on `[step]` alone therefore never
   * moved focus at all on the first step: it ran in the same commit as the
   * hidden render. Everything that depends on focus being inside the card
   * then quietly did nothing — the Tab trap, the arrow keys, Escape. So wait
   * until the card is actually visible, then focus it.
   */
  const placed = narrow || cardPos !== null;
  useEffect(() => {
    if (step && placed) cardRef.current?.focus();
  }, [step, placed]);

  /**
   * Escape, on the window rather than on the card.
   *
   * The card's own handler covers Escape too, but only while focus is inside
   * it, and focus can leave: clicking a shutter puts it on <body>, and the
   * page behind is unreachable by mouse. Escape is the one key that must work
   * from anywhere — it is the way out.
   */
  useEffect(() => {
    if (!step) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      end();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, end]);

  /**
   * Keys, all handled on the card. Focus is trapped inside it, so the card is
   * guaranteed to be on the path of every keystroke while the tour is up.
   */
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      end();
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goBack();
      return;
    }
    if (event.key !== 'Tab') return;

    /* The trap. Two buttons, so Tab cycles Skip → Next → Skip and Shift+Tab
       runs the other way; from the card itself Tab enters at the first
       button. Without this, Tab would walk straight out of the dialog and
       into the dimmed page behind it, which is unreachable by mouse. */
    const card = cardRef.current;
    if (!card) return;
    const focusable = Array.from(card.querySelectorAll<HTMLElement>('button:not([disabled])'));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (active === card) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }
    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!mounted || !steps || !step) return null;

  /* The hole, padded out from the target and rounded off. */
  const hole = rect
    ? {
        left: rect.left - HOLE_PAD,
        top: rect.top - HOLE_PAD,
        width: rect.width + HOLE_PAD * 2,
        height: rect.height + HOLE_PAD * 2,
      }
    : null;

  const holeStyle: CSSProperties | undefined = hole
    ? { left: hole.left, top: hole.top, width: hole.width, height: hole.height }
    : undefined;

  const cardStyle: CSSProperties | undefined = narrow
    ? undefined
    : cardPos
      ? { top: cardPos.top, left: cardPos.left }
      : /* Rendered but not yet placed: it has to be in the DOM to be measured,
           and hidden so nobody sees it flash in the corner first. */
        { visibility: 'hidden' };

  return (
    <div className={styles.overlay}>
      {hole && holeStyle ? (
        <>
          {/* The dimming is one enormous box-shadow spreading out from a
              transparent box the size of the target. Cheaper and crisper than
              four dark panels, and it moves as one thing between steps. */}
          <div
            className={`${styles.hole} ${tracking ? styles.holeTracking : ''}`}
            style={holeStyle}
          />

          {/* Why four transparent shutters instead of one full-screen catcher:
              a click has to be swallowed everywhere EXCEPT the hole, and
              `pointer-events: none` on a child does not help — the click just
              lands on the parent underneath it, which is still the overlay.
              So nothing covers the hole at all; four panels tile the rest of
              the screen around it and eat the clicks. The page beneath needs
              no idea the tour exists. */}
          <div
            className={styles.shutter}
            style={{ left: 0, right: 0, top: 0, height: Math.max(0, hole.top) }}
          />
          <div
            className={styles.shutter}
            style={{ left: 0, right: 0, top: hole.top + hole.height, bottom: 0 }}
          />
          <div
            className={styles.shutter}
            style={{
              left: 0,
              top: hole.top,
              height: hole.height,
              width: Math.max(0, hole.left),
            }}
          />
          <div
            className={styles.shutter}
            style={{
              left: hole.left + hole.width,
              right: 0,
              top: hole.top,
              height: hole.height,
            }}
          />

          {/* The fifth panel, over the hole itself, exists only for steps
              where a real click would navigate away and end the tour. */}
          {!step.allowTargetClick ? <div className={styles.shutter} style={holeStyle} /> : null}
        </>
      ) : null}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={`${styles.card} ${narrow ? styles.cardPinned : ''}`}
        style={cardStyle}
      >
        <p className={styles.counter}>
          {index + 1} of {steps.length}
        </p>
        <h2 id={titleId} className={styles.title}>
          {step.title}
        </h2>
        <p id={bodyId} className={styles.body}>
          {step.body}
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.skip} onClick={end}>
            Skip the tour
          </button>
          <button type="button" className={styles.next} onClick={goNext}>
            {isLast ? 'Done' : 'Next'}
          </button>
        </div>

        {!narrow && cardPos ? (
          <span
            aria-hidden="true"
            className={styles.arrow}
            data-side={cardPos.side}
            style={{ '--tour-arrow-x': `${cardPos.arrowX}px` } as CSSProperties}
          />
        ) : null}
      </div>
    </div>
  );
}
