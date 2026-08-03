'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { DIMENSIONS, getDimension, setDimension, shuffleDimension, subscribe } from '../_lib/dimensions';
import './hud.css';

/**
 * The two controls on the page.
 *
 * `Design curious?` is deliberately a single small button in the bottom-left
 * corner — one press, one new design, its transition plays. That is the
 * whole idea and it stays exactly as it was.
 *
 * Next to it sits a second, smaller button that opens a gallery of all 30
 * designs, for a visitor who wants to browse and pick rather than gamble.
 * The gallery is additive: it does not touch the shuffle button's behaviour,
 * and it stays closed until asked for.
 *
 * There is no auto-rotate anywhere here. A page that repaints itself on a
 * timer while you are trying to read it is hostile; the visitor asks for
 * every change.
 *
 * Both controls keep their own dark-glass look instead of using the theme
 * tokens, so they stay legible across all 30 dimensions.
 */

type ThemeColors = { bg: string; accent: string; accent2: string };

// Resolved swatch colours per dimension, cached module-wide so re-opening the
// gallery (or mounting a second HUD, in dev's strict-mode double-render)
// never re-fetches a theme file it has already read.
const swatchCache = new Map<string, Promise<ThemeColors | null>>();

function extractVar(css: string, varName: string): string | null {
  // Matching the literal `varName:` substring is enough to avoid
  // `--v2-accent` picking up `--v2-accent-2` — the dash before the colon
  // makes those two substrings distinct.
  const match = css.match(new RegExp(`${varName}:\\s*([^;]+);`, 'i'));
  return match ? match[1].trim() : null;
}

async function fetchThemeColors(slug: string): Promise<ThemeColors | null> {
  if (typeof fetch !== 'function') return null;
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const timeoutId = controller ? window.setTimeout(() => controller.abort(), 2500) : undefined;
    const res = await fetch(`/v2/themes/${slug}.css`, { signal: controller?.signal });
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    if (!res.ok) return null;
    const text = await res.text();
    const bg = extractVar(text, '--v2-bg');
    const accent = extractVar(text, '--v2-accent');
    const accent2 = extractVar(text, '--v2-accent-2');
    if (!bg || !accent || !accent2) return null;
    return { bg, accent, accent2 };
  } catch {
    // Offline, aborted, or the theme file is malformed — the gallery just
    // falls back to name + blurb for that row.
    return null;
  }
}

function getThemeColors(slug: string): Promise<ThemeColors | null> {
  const cached = swatchCache.get(slug);
  if (cached) return cached;
  const promise = fetchThemeColors(slug);
  swatchCache.set(slug, promise);
  return promise;
}

/**
 * Labels the shuffle button rotates through. Three words or fewer each, so the
 * pill never changes width enough to jump around.
 *
 * Index 0 renders on the server and on the first client paint; rotation only
 * starts after mount. Picking a random one during render would make the server
 * and client HTML disagree and React would throw away the whole page.
 */
const BUTTON_LABELS = [
  'Design curious?',
  'Dimension shift',
  'Shift reality',
  'Another dimension',
  'Try another look',
  'Change the mood',
  'Repaint this page',
  'Reskin this page',
  'Break the theme',
  'Shuffle the design',
  'Roll the dice',
  'Thirty looks',
  'Pick a reality',
  'Feeling adventurous?',
  'Nothing is fixed',
] as const

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function DimensionHUD() {
  const [mounted, setMounted] = useState(false);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [labelIndex, setLabelIndex] = useState(0);

  const galleryTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dimFor = (s: string) => DIMENSIONS.find((d) => d.slug === s);
    setMounted(true);
    const current = getDimension();
    setSlug(current);
    setName(dimFor(current)?.name ?? '');
    return subscribe((s) => {
      setSlug(s);
      setName(dimFor(s)?.name ?? '');
    });
  }, []);

  // Pick a random label once, after mount. It then only changes when pressed —
  // a label cycling on a timer moves in your peripheral vision while you are
  // reading the page, which is distracting for no benefit.
  //
  // The randomising has to happen here rather than during render: the server
  // always emits index 0, and choosing randomly while rendering would make the
  // server and client HTML disagree and React would discard the page.
  useEffect(() => {
    if (!mounted) return;
    setLabelIndex(Math.floor(Math.random() * BUTTON_LABELS.length));
  }, [mounted]);

  const onShuffle = useCallback(() => {
    // The transition runs ~640ms. Swallow clicks during it so an impatient
    // double-tap cannot stack two swaps and strand the page mid-distortion.
    setBusy((isBusy) => {
      if (isBusy) return isBusy;
      shuffleDimension();
      // New label on every press, never the same one twice in a row.
      setLabelIndex((i) => {
        const next = Math.floor(Math.random() * (BUTTON_LABELS.length - 1));
        return next >= i ? next + 1 : next;
      });
      window.setTimeout(() => setBusy(false), 700);
      return true;
    });
  }, []);

  const openGallery = useCallback(() => setGalleryOpen(true), []);
  const closeGallery = useCallback(() => {
    setGalleryOpen(false);
    galleryTriggerRef.current?.focus();
  }, []);

  const handlePick = useCallback((pickedSlug: string) => {
    setDimension(pickedSlug);
  }, []);

  return (
    <div id="v2-hud">
      <button
        type="button"
        className={`v2-hud-btn${busy ? ' is-busy' : ''}`}
        onClick={onShuffle}
        aria-label="Change this page's design"
      >
        <span className="v2-hud-btn-spark" aria-hidden="true" />
        <span className="v2-hud-btn-text">
          <span className="v2-hud-btn-label" key={labelIndex}>
            {BUTTON_LABELS[labelIndex]}
          </span>
          {/* Reserve the line before mount so the button never changes size. */}
          <span className="v2-hud-btn-sub">{mounted && name ? name : ' '}</span>
        </span>
      </button>

      <button
        type="button"
        ref={galleryTriggerRef}
        className="v2-hud-gallery-trigger"
        onClick={openGallery}
        aria-label="Browse all 30 designs"
        aria-haspopup="dialog"
        aria-expanded={galleryOpen}
        aria-controls="v2-hud-gallery-dialog"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
        </svg>
      </button>

      {galleryOpen && (
        <DesignGallery
          currentSlug={mounted ? slug : ''}
          onPick={handlePick}
          onClose={closeGallery}
        />
      )}
    </div>
  );
}

interface DesignGalleryProps {
  currentSlug: string;
  onPick: (slug: string) => void;
  onClose: () => void;
}

function DesignGallery({ currentSlug, onPick, onClose }: DesignGalleryProps) {
  const [filter, setFilter] = useState('');
  const [colors, setColors] = useState<Record<string, ThemeColors | null>>({});

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return DIMENSIONS;
    return DIMENSIONS.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.blurb.toLowerCase().includes(q) ||
        d.slug.includes(q)
    );
  }, [filter]);

  // Focus the filter field on open, and fetch every theme's swatch colours
  // once. 30 tiny stylesheets is cheap, and this only runs when a visitor
  // has deliberately opened the gallery.
  useEffect(() => {
    inputRef.current?.focus();
    let cancelled = false;
    DIMENSIONS.forEach((d) => {
      getThemeColors(d.slug).then((result) => {
        if (cancelled) return;
        setColors((prev) => (d.slug in prev ? prev : { ...prev, [d.slug]: result }));
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Lock background scroll while the gallery is open.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Escape closes from anywhere inside; Tab is trapped inside the panel.
  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [onClose]);

  const focusOptionAt = useCallback(
    (index: number) => {
      const target = filtered[index];
      if (!target) return;
      optionRefs.current.get(target.slug)?.focus();
    },
    [filtered]
  );

  const onListKeydown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const activeSlug = (document.activeElement as HTMLElement | null)?.dataset.slug;
      const index = activeSlug ? filtered.findIndex((d) => d.slug === activeSlug) : -1;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        focusOptionAt(index === -1 ? 0 : Math.min(index + 1, filtered.length - 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (index <= 0) {
          inputRef.current?.focus();
        } else {
          focusOptionAt(index - 1);
        }
      } else if (event.key === 'Home') {
        event.preventDefault();
        focusOptionAt(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        focusOptionAt(filtered.length - 1);
      }
    },
    [filtered, focusOptionAt]
  );

  const onInputKeydown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        focusOptionAt(0);
      } else if (event.key === 'Enter') {
        const top = filtered[0];
        if (top) {
          event.preventDefault();
          onPick(top.slug);
        }
      }
    },
    [filtered, focusOptionAt, onPick]
  );

  return (
    <div
      className="v2-hud-gallery-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        id="v2-hud-gallery-dialog"
        className="v2-hud-gallery-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Browse all designs"
      >
        <div className="v2-hud-gallery-head">
          <input
            ref={inputRef}
            type="text"
            className="v2-hud-gallery-filter"
            placeholder="Filter designs…"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            onKeyDown={onInputKeydown}
            aria-label="Filter designs by name"
          />
          <button
            type="button"
            className="v2-hud-gallery-close"
            onClick={onClose}
            aria-label="Close design gallery"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>

        <p className="v2-hud-gallery-count">
          {filtered.length} of {DIMENSIONS.length} designs
        </p>

        <div className="v2-hud-gallery-list" onKeyDown={onListKeydown}>
          {filtered.length === 0 && (
            <p className="v2-hud-gallery-empty">No designs match &ldquo;{filter}&rdquo;.</p>
          )}
          {filtered.map((d) => {
            const isCurrent = d.slug === currentSlug;
            const c = colors[d.slug];
            const swatchStyle = c
              ? ({
                  '--v2-hud-swatch-bg': c.bg,
                  '--v2-hud-swatch-a1': c.accent,
                  '--v2-hud-swatch-a2': c.accent2,
                } as CSSProperties)
              : undefined;
            return (
              <button
                key={d.slug}
                type="button"
                ref={(el) => {
                  if (el) optionRefs.current.set(d.slug, el);
                  else optionRefs.current.delete(d.slug);
                }}
                data-slug={d.slug}
                className={`v2-hud-gallery-option${isCurrent ? ' is-current' : ''}`}
                onClick={() => onPick(d.slug)}
                aria-current={isCurrent ? 'true' : undefined}
              >
                <span
                  className={`v2-hud-gallery-swatch${c ? '' : ' is-empty'}`}
                  aria-hidden="true"
                  style={swatchStyle}
                />
                <span className="v2-hud-gallery-option-text">
                  <span className="v2-hud-gallery-option-name">
                    {d.name}
                    {isCurrent && <span className="v2-hud-gallery-option-tag">current</span>}
                  </span>
                  <span className="v2-hud-gallery-option-blurb">{d.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// app/v2/layout.tsx imports this as a named import.
export { DimensionHUD };
export default DimensionHUD;
