'use client'

import { useEffect, useRef, useState } from 'react'
import { COUNTRY_PATHS, WORLD_VIEWBOX } from '@/lib/atlas/geo/world-paths'
import { ISO_COUNTRIES } from '@/lib/atlas/iso-countries'
import { useMapTransform } from '@/app/atlas/_components/useMapTransform'
import { describeMissProximity, missProximityLine } from '@/lib/atlas/learn/geo-proximity'
import type { WhereInTheWorldQuestion } from '@/lib/atlas/learn/types'
import styles from './play.module.css'

export interface MapQuestionProps {
  question: WhereInTheWorldQuestion
  /** 0 for a correct click, 1 for any other — see the file header on
   *  lib/atlas/learn/questions/where-in-the-world.ts for why the shared
   *  right/wrong contract only needs two values here. */
  picked: number | null
  disabled: boolean
  onPick: (index: number) => void
}

const [VB_X, VB_Y, VB_W, VB_H] = WORLD_VIEWBOX.split(' ').map(Number)

/**
 * Every clickable shape, alphabetised once at module load — the order the
 * keyboard path (arrow keys, Home/End, type-ahead) walks. Sorting by the
 * name actually painted on the map (world-atlas's own, not the deck's)
 * keeps what a keyboard player reads in sync with what a mouse player sees.
 */
const SORTED_COUNTRIES = COUNTRY_PATHS.slice().sort((a, b) => a.name.localeCompare(b.name))

const NAME_BY_ISO3 = new Map(COUNTRY_PATHS.map((c) => [c.iso3, c.name] as const))
const REGION_BY_ISO3 = new Map(ISO_COUNTRIES.map((c) => [c.iso3, c.region ?? null] as const))
const PATH_BY_ISO3 = new Map(COUNTRY_PATHS.map((c) => [c.iso3, c] as const))

function nameOf(iso3: string): string {
  return NAME_BY_ISO3.get(iso3) ?? iso3
}

/** A keyboard-focused country counts as visible only once it clears this —
 * below it, a shape is too small to tell apart from its neighbours even
 * though it is technically on screen (this is what made Solomon Islands
 * unclickable at the default zoom). Screen px, not viewBox units, since
 * that's what a player actually judges "can I see this" by. */
const MIN_VISIBLE_PX = 26

/**
 * Click the named country on the map. The only game on this floor whose
 * answer surface is the whole plate rather than a short pick-list, so the
 * interaction is built from scratch here rather than reusing any of the
 * other four games' option-button layout — but the map itself is entirely
 * borrowed: the same geometry (`COUNTRY_PATHS`), the same pan/zoom engine
 * (`useMapTransform`) the dossier's own plate uses at app/atlas/_components/
 * Plate.tsx. Nothing under app/atlas/_components/ is edited to get this;
 * everything here is a new, smaller composition of what already exists —
 * including the wheel-to-zoom and two-finger pinch handling below, which
 * mirrors Plate.tsx's own pointer/wheel orchestration built on the same
 * hook primitives (`zoomAt`, `panByScreenDelta`) rather than copying that
 * component itself.
 *
 * Two independent ways to answer:
 *
 *  1. **Click.** Any shape on the map commits immediately — right or wrong.
 *  2. **Keyboard.** The map is one stop in the tab order (`role="listbox"`,
 *     a standard composite widget). Once it has focus: arrow keys / Home /
 *     End walk the alphabetised list of every shape on the plate, typing a
 *     letter jumps to the next name starting with it (the same type-ahead a
 *     native `<select>` gives you), and Enter or Space commits whichever
 *     shape is currently focused. `aria-activedescendant` tracks the
 *     virtual focus so a screen reader always knows which shape is "on".
 *
 * The status line below the map is the plain-language announcement the spec
 * asks for at minimum — it says in words what the highlighting says in
 * colour, both while choosing ("Focused: France") and after ("Correct —
 * France." / "You picked Spain. The answer was France.").
 */
export function MapQuestion({ question, picked, disabled, onPick }: MapQuestionProps) {
  const answered = picked !== null
  const correctIso3 = question.country.iso3
  const correctName = question.country.name

  const [clickedIso3, setClickedIso3] = useState<string | null>(null)
  const [focusedIso3, setFocusedIso3] = useState<string | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const {
    transform,
    zoomAt,
    zoomStep,
    panByScreenDelta,
    reset,
    beginDrag,
    dragTo,
    endDrag,
    wasDragged,
    clearDragged,
    worldToClient,
    isDragging,
    minScale,
    maxScale,
  } = useMapTransform(svgRef, VB_W, VB_H)

  // A fresh card: nothing clicked, nothing focused, the view reset. Same
  // reset-on-question.id pattern GuessCountryQuestion uses for its own
  // per-question state.
  useEffect(() => {
    setClickedIso3(null)
    setFocusedIso3(null)
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id])

  function focusIndexOf(iso3: string | null): number {
    if (!iso3) return -1
    return SORTED_COUNTRIES.findIndex((c) => c.iso3 === iso3)
  }

  /** Pan/zoom the plate so `iso3` is actually visible — not just technically
   * on screen. Fixes the bug where tabbing to a small country (e.g. Solomon
   * Islands) left it either off the current pan, or too small at the
   * default zoom to make out at all. Only moves the view when the country
   * genuinely needs it: already-visible, reasonably sized countries (most
   * of them, at the default zoom) don't cause the map to jump on every
   * arrow-key press. */
  function ensureVisible(iso3: string) {
    const country = PATH_BY_ISO3.get(iso3)
    const wrap = wrapRef.current
    if (!country || !wrap) return
    const rect = wrap.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const client = worldToClient(country.centroid[0], country.centroid[1])
    if (!client) return

    const [minX, minY, maxX, maxY] = country.bbox
    const pxPerUnitX = (rect.width / VB_W) * transform.scale
    const pxPerUnitY = (rect.height / VB_H) * transform.scale
    const screenW = (maxX - minX) * pxPerUnitX
    const screenH = (maxY - minY) * pxPerUnitY

    const edge = 20
    const offscreen =
      client.x < rect.left + edge ||
      client.x > rect.right - edge ||
      client.y < rect.top + edge ||
      client.y > rect.bottom - edge
    const tiny = screenW < MIN_VISIBLE_PX && screenH < MIN_VISIBLE_PX
    if (!offscreen && !tiny) return

    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    // Centre the country first — panByScreenDelta works in current screen
    // pixels regardless of scale, same primitive Plate.tsx's own drag-to-pan
    // uses.
    panByScreenDelta(cx - client.x, cy - client.y)

    if (tiny) {
      const bboxW = Math.max(maxX - minX, 0.0001)
      const bboxH = Math.max(maxY - minY, 0.0001)
      const scaleForW = MIN_VISIBLE_PX / ((rect.width / VB_W) * bboxW)
      const scaleForH = MIN_VISIBLE_PX / ((rect.height / VB_H) * bboxH)
      const targetScale = Math.min(maxScale, Math.max(transform.scale, scaleForW, scaleForH))
      const factor = targetScale / transform.scale
      // zoomAt anchors on (cx, cy) — the same point the plate was just
      // centred on above — so the country stays centred as it zooms in.
      if (factor > 1.02) zoomAt(cx, cy, factor)
    }
  }

  function moveFocus(delta: number) {
    const n = SORTED_COUNTRIES.length
    const cur = focusIndexOf(focusedIso3)
    const next = cur === -1 ? (delta > 0 ? 0 : n - 1) : (cur + delta + n) % n
    const iso3 = SORTED_COUNTRIES[next]!.iso3
    setFocusedIso3(iso3)
    ensureVisible(iso3)
  }

  function typeAhead(letter: string) {
    const n = SORTED_COUNTRIES.length
    const cur = focusIndexOf(focusedIso3)
    const lower = letter.toLowerCase()
    for (let step = 1; step <= n; step++) {
      const idx = (cur + step + n) % n
      if (SORTED_COUNTRIES[idx]!.name.toLowerCase().startsWith(lower)) {
        const iso3 = SORTED_COUNTRIES[idx]!.iso3
        setFocusedIso3(iso3)
        ensureVisible(iso3)
        return
      }
    }
  }

  function commit(iso3: string) {
    if (disabled || answered) return
    setClickedIso3(iso3)
    setFocusedIso3(iso3)
    onPick(iso3 === correctIso3 ? 0 : 1)
  }

  // Seeding a focused country is for keyboard players: Tab lands on the map
  // with nothing selected, so arrows would have nowhere to start. A MOUSE
  // click also focuses this wrapper, and doing it there was a real bug — it
  // jumped the selection to a fixed country and `ensureVisible` then panned
  // and zoomed the map onto it, so clicking anywhere looked like a phantom
  // click landing in the middle of the map, on the same country every time.
  //
  // :focus-visible is exactly this distinction — the browser sets it for
  // keyboard focus and withholds it for a pointer. Guarded because it is
  // matched against a selector, and an old engine that does not know it
  // throws rather than returning false; on that path we simply do nothing,
  // which leaves the mouse behaving correctly.
  function handleMapFocus() {
    if (disabled || answered || focusedIso3) return
    const wrap = wrapRef.current
    if (!wrap) return
    let viaKeyboard = false
    try {
      viaKeyboard = wrap.matches(':focus-visible')
    } catch {
      viaKeyboard = false
    }
    if (!viaKeyboard) return
    const iso3 = SORTED_COUNTRIES[0]!.iso3
    setFocusedIso3(iso3)
    ensureVisible(iso3)
  }

  function handleMapKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    // Zoom is reachable from the keyboard even after answering — the same
    // three keys Plate.tsx's own map binds (+/-/0), chosen because the
    // listbox pattern here already owns the arrow keys for moving between
    // countries.
    if (e.key === '+' || e.key === '=') {
      e.preventDefault()
      zoomStep(1)
      return
    }
    if (e.key === '-' || e.key === '_') {
      e.preventDefault()
      zoomStep(-1)
      return
    }
    if (e.key === '0') {
      e.preventDefault()
      reset()
      return
    }
    if (disabled || answered) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      moveFocus(1)
      return
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      moveFocus(-1)
      return
    }
    if (e.key === 'Home') {
      e.preventDefault()
      const iso3 = SORTED_COUNTRIES[0]!.iso3
      setFocusedIso3(iso3)
      ensureVisible(iso3)
      return
    }
    if (e.key === 'End') {
      e.preventDefault()
      const iso3 = SORTED_COUNTRIES[SORTED_COUNTRIES.length - 1]!.iso3
      setFocusedIso3(iso3)
      ensureVisible(iso3)
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (focusedIso3) commit(focusedIso3)
      return
    }
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      e.preventDefault()
      typeAhead(e.key)
    }
  }

  // Wheel-to-zoom needs a non-passive native listener — React's own onWheel
  // prop is registered passive, so calling preventDefault() there is
  // silently ignored and the page would scroll instead of the map zooming.
  // Same reasoning, same code shape as Plate.tsx's own wheel effect.
  useEffect(() => {
    const node = wrapRef.current
    if (!node) return
    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      const factor = Math.exp(-e.deltaY * 0.0015)
      zoomAt(e.clientX, e.clientY, factor)
    }
    node.addEventListener('wheel', handleWheel, { passive: false })
    return () => node.removeEventListener('wheel', handleWheel)
  }, [zoomAt])

  // Every finger/pointer currently down. One finger drags to pan, two
  // fingers pinch to zoom — the same plain-pointer-events approach (no
  // gesture library) Plate.tsx uses for its own map.
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStartDist = useRef<number | null>(null)
  // Which pointerIds this element currently holds capture for — see the
  // capture-on-move comment in handlePointerMove for why this can't just be
  // "every pointerId that went down".
  const capturedPointers = useRef<Set<number>>(new Set())

  function pinchDistance(): number | null {
    if (activePointers.current.size !== 2) return null
    const [a, b] = Array.from(activePointers.current.values())
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    // No setPointerCapture here on purpose — see handlePointerMove. Capturing
    // the very first pointerdown (the old code did this unconditionally) is
    // what broke a plain click: once this wrapper holds capture, Chrome can
    // retarget the click that follows pointerup to the wrapper itself
    // instead of whatever was actually under the finger — a zoom button or a
    // country shape — so that element's own onClick never runs. A single
    // click never needs capture; only a drag that leaves the element does.
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (activePointers.current.size === 1) {
      beginDrag(e.clientX, e.clientY)
    } else if (activePointers.current.size === 2) {
      // A second finger down is already an unambiguous pinch, never a click
      // on a button or shape, so it's safe to capture immediately — this
      // keeps the gesture tracking even if a finger drifts off the wrapper.
      e.currentTarget.setPointerCapture(e.pointerId)
      capturedPointers.current.add(e.pointerId)
      pinchStartDist.current = pinchDistance()
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!activePointers.current.has(e.pointerId)) return
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (activePointers.current.size === 2) {
      const [a, b] = Array.from(activePointers.current.values())
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      if (pinchStartDist.current) zoomAt(mid.x, mid.y, dist / pinchStartDist.current)
      pinchStartDist.current = dist
    } else if (activePointers.current.size === 1 && e.buttons === 1) {
      dragTo(e.clientX, e.clientY)
      // The pointer has now moved past the hook's own drag threshold — this
      // is a real drag, not a click, so it's safe (and necessary, to keep
      // tracking a fast drag that leaves the wrapper's bounds) to capture
      // from here on.
      if (wasDragged() && !capturedPointers.current.has(e.pointerId)) {
        e.currentTarget.setPointerCapture(e.pointerId)
        capturedPointers.current.add(e.pointerId)
      }
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    activePointers.current.delete(e.pointerId)
    if (capturedPointers.current.has(e.pointerId)) {
      capturedPointers.current.delete(e.pointerId)
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    }

    if (activePointers.current.size === 0) {
      endDrag()
    } else if (activePointers.current.size === 1) {
      pinchStartDist.current = null
      // One finger lifted out of a pinch — restart the drag baseline from
      // the remaining finger so panning doesn't jump.
      const [remaining] = Array.from(activePointers.current.values())
      beginDrag(remaining.x, remaining.y)
    }
  }

  // A drag or pinch that moved the map shouldn't also commit an answer on
  // release — same guard Plate.tsx uses for its own country links.
  function handleClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (wasDragged()) {
      e.preventDefault()
      e.stopPropagation()
      clearDragged()
    }
  }

  const clickedRegion = clickedIso3 ? (REGION_BY_ISO3.get(clickedIso3) ?? null) : null
  const proximity =
    answered && clickedIso3 && clickedIso3 !== correctIso3
      ? describeMissProximity(clickedIso3, question.country.neighbours, question.country.region, clickedRegion)
      : null

  let statusLine: string
  if (answered) {
    statusLine =
      clickedIso3 === correctIso3
        ? `Correct — ${correctName}.`
        : `You picked ${clickedIso3 ? nameOf(clickedIso3) : 'nothing'}. The answer was ${correctName}.`
  } else if (focusedIso3) {
    statusLine = `Focused: ${nameOf(focusedIso3)}`
  } else {
    statusLine = 'Click a country, or press Tab to reach the map and use the arrow keys.'
  }

  function stateOf(iso3: string): 'idle' | 'focused' | 'right' | 'wrong' {
    if (answered) {
      if (iso3 === correctIso3) return 'right'
      if (iso3 === clickedIso3) return 'wrong'
      return 'idle'
    }
    return iso3 === focusedIso3 ? 'focused' : 'idle'
  }

  return (
    <div className={styles.question}>
      <p className={styles.prompt}>{question.prompt}</p>

      <div className={styles.mapStage}>
        <div
          ref={wrapRef}
          className={`${styles.mapWrap} ${isDragging ? styles.mapWrapDragging : ''}`}
          data-answered={answered}
          role="listbox"
          aria-label="World map. Arrow keys move between countries, type a letter to jump to a name, Enter or Space answers. Plus, minus and zero zoom and reset. Click, scroll or pinch to zoom, and drag to pan."
          aria-activedescendant={focusedIso3 ? `wiw-opt-${focusedIso3}` : undefined}
          tabIndex={0}
          onFocus={handleMapFocus}
          onKeyDown={handleMapKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClickCapture={handleClickCapture}
        >
          <svg ref={svgRef} viewBox={WORLD_VIEWBOX} className={styles.mapSvg}>
            <rect x={VB_X} y={VB_Y} width={VB_W} height={VB_H} className={styles.mapPlate} />
            <g transform={`translate(${transform.tx} ${transform.ty}) scale(${transform.scale})`}>
              {COUNTRY_PATHS.map((c) => {
                const state = stateOf(c.iso3)
                // atlas.css's highlight rule is the compound selector
                // .atlas-hatch.is-active — it needs both classes on the
                // same element to fire at all. Dropping atlas-hatch on
                // 'focused' (the previous code) meant is-active alone never
                // matched anything, so the keyboard cursor had no visible
                // fill highlight — only a thin 1.5px stroke, easy to miss
                // on a small country. atlas-hatch now stays for every state
                // except right/wrong, which get their own inline fill below.
                const classNames = [
                  styles.mapPath,
                  state === 'right' || state === 'wrong' ? '' : 'atlas-hatch',
                  state === 'focused' ? 'is-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
                // Inline, not a CSS class, for the right/wrong fill — the
                // one place this must win regardless of stylesheet load
                // order, the same reason Plate.tsx paints its own ranked
                // countries inline rather than through a class.
                const fill = state === 'right' ? 'var(--note-ember)' : state === 'wrong' ? 'var(--note-rust)' : undefined
                // No <title> here, deliberately. SVG <title> is what the
                // browser draws as a native tooltip, so hovering any shape
                // used to pop up that country's name — which hands over the
                // answer to a game whose whole instruction is "find the
                // shape, not a name on a list". It also flickers on click,
                // and because a tooltip is browser chrome rather than page
                // content it never shows up in a screenshot, which is why it
                // survived several rounds of testing. aria-label below is
                // what a screen reader reads; it draws nothing.
                return (
                  <path
                    key={c.iso3}
                    id={`wiw-opt-${c.iso3}`}
                    role="option"
                    aria-selected={focusedIso3 === c.iso3}
                    aria-label={c.name}
                    d={c.d}
                    className={classNames}
                    data-state={state}
                    style={{ fill, vectorEffect: 'non-scaling-stroke' } as React.CSSProperties}
                    onClick={() => commit(c.iso3)}
                  />
                )
              })}
            </g>
          </svg>

          <div className={styles.mapZoom} role="group" aria-label="Zoom map">
            <button
              type="button"
              className={styles.mapZoomButton}
              onClick={() => zoomStep(1)}
              disabled={transform.scale >= maxScale}
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              className={styles.mapZoomButton}
              onClick={() => zoomStep(-1)}
              disabled={transform.scale <= minScale}
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              type="button"
              className={styles.mapZoomButton}
              onClick={reset}
              disabled={transform.scale === 1 && transform.tx === 0 && transform.ty === 0}
              aria-label="Reset map zoom and position"
            >
              Reset
            </button>
          </div>
        </div>

        <p className={styles.mapStatus} aria-live="polite">
          {statusLine}
        </p>

        {proximity && (
          <p className={styles.mapProximity}>
            {missProximityLine(proximity, clickedIso3 ? nameOf(clickedIso3) : 'that', correctName, question.country.region)}
          </p>
        )}
      </div>
    </div>
  )
}
