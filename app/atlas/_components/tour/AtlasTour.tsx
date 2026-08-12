'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  TOUR_KEY,
  TOUR_START_EVENT,
  TOUR_STEPS,
  queueForStart,
  tourRouteFor,
  type TourRoute,
  type TourStep,
} from './tour-steps';
import {
  clearTourResume,
  clearTourSeen,
  hasSeenTour,
  markTourSeen,
  readTourResume,
  writeTourResume,
} from './tour-storage';
import styles from './tour.module.css';

/**
 * The first-visit tour for /atlas and /atlas/learn — one walk across both.
 *
 * Mounted once, in app/atlas/layout.tsx, for the whole section. On any other
 * /atlas/* route it renders nothing at all. One component, one overlay, one
 * card.
 *
 * The walk spans two pages. Started on /atlas it is ten steps: six on the
 * plate, then **Next** on the last of them navigates to /atlas/learn and the
 * remaining four carry on there, with the counter running straight through
 * "1 of 10" to "10 of 10". Started on /atlas/learn by somebody who arrived
 * there directly, it is just that page's four. Crossing the page is the only
 * genuinely awkward part of this file, and it is handled in one place: `cross`
 * writes down where to pick up, `router.push`es, and the resume effect puts
 * the next card up once the new page has something to point at.
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
/**
 * How long to wait after arriving on the other page before looking for the
 * step we walked over to show. Shorter than SETTLE_MS: this is a client-side
 * navigation into a page whose data Next has usually already fetched, not a
 * cold arrival, and the walk should not feel like it stalled at the seam.
 */
const ARRIVE_MS = 140;
/** Gap between attempts at finding that step's target, and how many to make. */
const ARRIVE_RETRY_MS = 100;
const ARRIVE_TRIES = 12;

/** A target's position in viewport coordinates. Plain numbers, not a live DOMRect. */
interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * A walk that is waiting for its page — set while crossing between /atlas and
 * /atlas/learn, and set again on arrival if a hard reload landed in that gap.
 *
 * `at` is a step **id** rather than a number on purpose. The queue is
 * re-filtered when the new page arrives (country of the day can be absent),
 * so a number could point at a different step by the time it is read; an id
 * either finds its step or honestly does not.
 */
interface PendingResume {
  at: string;
  /** Where the walk was started, which is what decides how long it is. */
  startRoute: TourRoute;
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

/**
 * Drop the steps that have nothing to point at — but only ever the ones
 * belonging to the page being shown right now.
 *
 * That restriction is what lets the walk span two pages at all. A missing
 * target is a real case rather than defensive padding: country of the day can
 * legitimately be absent on a day when nothing clears its bar, and dropping it
 * up front is what keeps the "3 of 9" counter honest. But a step on the *other*
 * page is missing for a completely different reason — its page has not been
 * visited yet — and treating that the same way would silently delete the whole
 * second half of the walk the moment it started. So a step is only a candidate
 * for dropping while you are standing on its own page, and the filter runs
 * again on arrival at the second page for exactly that reason.
 */
function dropMissing(queue: readonly TourStep[], route: TourRoute): readonly TourStep[] {
  return queue.filter((step) => step.route !== route || findTarget(step.target) !== null);
}

export function AtlasTour() {
  const pathname = usePathname();
  const router = useRouter();
  const route = useMemo(() => tourRouteFor(pathname), [pathname]);
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
   * The steps queued for this run, or `null` when no tour is running.
   *
   * Set when a walk starts and set again when it arrives on the second page.
   * Steps whose target is missing are dropped there (see `dropMissing`), so
   * everything downstream — including the "2 of 10" counter — counts only
   * steps that can actually be shown. It holds the steps for *both* pages
   * during a full walk, which is what makes the counter run straight through
   * the page boundary instead of restarting at one.
   */
  const [steps, setSteps] = useState<readonly TourStep[] | null>(null);
  const [index, setIndex] = useState(0);
  /** Set while the walk is between pages; no card is shown until it clears. */
  const [pending, setPending] = useState<PendingResume | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState<CardPos | null>(null);
  const [narrow, setNarrow] = useState(false);
  /** True while the page is actively scrolling, which turns the hole's glide off. */
  const [tracking, setTracking] = useState(false);

  const cardRef = useRef<HTMLDivElement | null>(null);
  /** Whatever had focus before the tour opened, so it can be handed back. */
  const returnFocusRef = useRef<HTMLElement | null>(null);
  /**
   * Which page this walk was started on. A ref rather than state because
   * nothing renders from it — it is only read when writing down where to
   * resume, and re-rendering the overlay because of it would be pointless.
   */
  const startRouteRef = useRef<TourRoute | null>(null);
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

  /**
   * A route change takes down whatever was on screen — and then decides
   * whether the walk itself is over.
   *
   * The card and the hole always go. They were measured against a page that
   * is no longer there, and leaving them up would point a hole at a target
   * that has gone.
   *
   * What survives is the walk, and only when the resume marker says this
   * arrival was the walk's own doing: a marker naming a step that lives on the
   * page we have just landed on means `cross` put it there a moment ago (or a
   * hard reload interrupted exactly that). Anything else is ordinary
   * navigation — somebody clicking away, or the browser going back — and that
   * ends the walk and tears the marker up, so it cannot resurrect itself on a
   * page it was never meant to reach.
   */
  useEffect(() => {
    setSteps(null);
    setIndex(0);
    setRect(null);
    setCardPos(null);

    const resume = readTourResume();
    const heading = resume ? TOUR_STEPS.find((s) => s.id === resume.at) : undefined;
    if (heading && route && heading.route === route) return;

    clearTourResume();
    setPending(null);
    startRouteRef.current = null;
  }, [pathname, route]);

  /**
   * Start a walk here, from the top.
   *
   * How many steps it gets depends on where "here" is — all ten from the
   * plate, the training floor's own four from the training floor. See
   * `queueForStart`.
   */
  const begin = useCallback(() => {
    if (!route) return;
    const queue = dropMissing(queueForStart(route), route);
    /* Nothing on *this* page to point at. The steps for the other page are
       still in the queue at this moment, so counting the queue would say
       "plenty" and open the tour onto a card with no target. */
    if (!queue.some((step) => step.route === route)) return;
    const active = document.activeElement;
    returnFocusRef.current = active instanceof HTMLElement ? active : null;
    startRouteRef.current = route;
    clearTourResume();
    setPending(null);
    setSteps(queue);
    setIndex(0);
    setCardPos(null);
  }, [route]);

  /**
   * Finish, or skip — the same ending either way. Both write the key: someone
   * who dismisses the tour has said "not again", not "ask me tomorrow". Both
   * also tear up the resume marker, so a walk abandoned half-way across the
   * seam does not come back on the next page load.
   */
  const end = useCallback(() => {
    markTourSeen(TOUR_KEY);
    clearTourResume();
    setPending(null);
    setSteps(null);
    setIndex(0);
    setRect(null);
    setCardPos(null);
    startRouteRef.current = null;
    const back = returnFocusRef.current;
    returnFocusRef.current = null;
    if (back && document.contains(back)) back.focus();
  }, []);

  /**
   * Walk to the other page and carry on at `step`.
   *
   * The marker goes to sessionStorage *before* navigating, not after: if the
   * visitor hard-reloads in the gap, or the navigation itself is a full page
   * load, the note is already written and the walk is picked back up rather
   * than dying at the seam. Everything after this is the resume effect's job,
   * which the pending flag hands over to.
   */
  const cross = useCallback(
    (step: TourStep) => {
      const from = startRouteRef.current ?? step.route;
      writeTourResume({ at: step.id, from });
      setPending({ at: step.id, startRoute: from });
      router.push(step.route);
    },
    [router],
  );

  /* Reads `index` straight rather than through a setState updater: ending the
     tour, and navigating, are both side effects, and React calls updaters
     twice in development — an updater that ended the tour would write the
     storage key twice, and one that navigated would push twice. */
  const goNext = useCallback(() => {
    if (!steps) return;
    if (index >= steps.length - 1) {
      end();
      return;
    }
    const next = steps[index + 1];
    if (route && next.route !== route) {
      cross(next);
      return;
    }
    setIndex(index + 1);
  }, [steps, index, end, route, cross]);

  /* Back crosses the seam too, the same way. Without it, stepping back from
     the first training-floor card would show a card pointing at the plate,
     which is not on screen. */
  const goBack = useCallback(() => {
    if (!steps || index === 0) return;
    const prev = steps[index - 1];
    if (route && prev.route !== route) {
      cross(prev);
      return;
    }
    setIndex(index - 1);
  }, [steps, index, route, cross]);

  /**
   * Two ways a walk begins on this page: picking one back up mid-crossing, or
   * a genuine first visit.
   *
   * Resume wins, and has to. Mid-walk the "seen" key is not written yet — it
   * is only written at the end — so a hard reload on /atlas/learn during a
   * ten-step walk would otherwise look exactly like a first visit and start a
   * fresh four-step one, throwing away where the visitor had got to.
   */
  useEffect(() => {
    if (!mounted || !route) return;
    if (pending || steps) return;

    const resume = readTourResume();
    if (resume) {
      const at = TOUR_STEPS.find((s) => s.id === resume.at);
      const from = tourRouteFor(resume.from);
      if (at && from && at.route === route) {
        setPending({ at: resume.at, startRoute: from });
        return;
      }
      /* It names a step that is not on this page, or a build ago. Not ours. */
      clearTourResume();
    }

    if (hasSeenTour(TOUR_KEY)) return;
    const timer = window.setTimeout(begin, SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [mounted, route, begin, pending, steps]);

  /**
   * Arrive on the other page and put the next card up.
   *
   * The queue is rebuilt from scratch here rather than carried over, so the
   * steps of the page we have just landed on get their missing-target check —
   * the only moment they can have one. The steps of the page behind us pass
   * through untouched; `dropMissing` will not look at them, which matters
   * because their targets are certainly gone by now.
   *
   * The retries are for the gap between the route changing and the new page
   * actually being painted. A step that is still not there after all of them
   * is treated as genuinely absent, and the walk carries on at whatever
   * survived after it — or ends, if nothing did.
   */
  useEffect(() => {
    if (!pending || !route) return;

    /* `cross` sets the pending flag and asks the router to move in the same
       breath, but the move is a fetch and takes a moment, so this effect runs
       once while we are still standing on the old page. Waiting for the step's
       own page to be the page we are on is what stops the training floor's
       first card being drawn over the plate. */
    const heading = TOUR_STEPS.find((step) => step.id === pending.at);
    if (!heading || heading.route !== route) return;

    let tries = 0;
    let timer = 0;

    const attempt = () => {
      timer = 0;
      const full = queueForStart(pending.startRoute);
      const queue = dropMissing(full, route);
      let at = queue.findIndex((step) => step.id === pending.at);

      if (at === -1 && tries < ARRIVE_TRIES) {
        tries += 1;
        timer = window.setTimeout(attempt, ARRIVE_RETRY_MS);
        return;
      }

      if (at === -1) {
        const wanted = full.findIndex((step) => step.id === pending.at);
        at = wanted === -1 ? -1 : queue.findIndex((step) => full.indexOf(step) >= wanted);
      }

      setPending(null);
      clearTourResume();

      if (at === -1) {
        /* Nothing left worth showing. That is the end of the walk, and the
           key gets written — the visitor has been shown what there was. */
        end();
        return;
      }

      const active = document.activeElement;
      returnFocusRef.current = active instanceof HTMLElement ? active : null;
      startRouteRef.current = pending.startRoute;
      setSteps(queue);
      setIndex(at);
      setRect(null);
      setCardPos(null);
    };

    timer = window.setTimeout(attempt, ARRIVE_MS);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [pending, route, end]);

  /* "Take the tour →" anywhere on the page reaches us through one DOM event.
     The link clears the key too, but clearing here as well means the tour
     also restarts if some other code fires the event later. */
  useEffect(() => {
    if (!mounted || !route) return;
    const onStart = () => {
      clearTourSeen(TOUR_KEY);
      begin();
    };
    window.addEventListener(TOUR_START_EVENT, onStart);
    return () => window.removeEventListener(TOUR_START_EVENT, onStart);
  }, [mounted, route, begin]);

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
        {/* Position within the steps queued for *this* walk, not within the
            master list. A walk started on the plate has all ten queued and
            counts "1 of 10" straight across the page boundary; one started on
            the training floor by somebody who arrived there directly has four
            and counts "1 of 4". Either way the number the visitor sees always
            matches the number of cards they are actually going to get. */}
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
