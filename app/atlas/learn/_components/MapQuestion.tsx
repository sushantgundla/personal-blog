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

function nameOf(iso3: string): string {
  return NAME_BY_ISO3.get(iso3) ?? iso3
}

/**
 * Click the named country on the map. The only game on this floor whose
 * answer surface is the whole plate rather than a short pick-list, so the
 * interaction is built from scratch here rather than reusing any of the
 * other four games' option-button layout — but the map itself is entirely
 * borrowed: the same geometry (`COUNTRY_PATHS`), the same pan/zoom engine
 * (`useMapTransform`) the dossier's own plate uses at app/atlas/_components/
 * Plate.tsx. Nothing under app/atlas/_components/ is edited to get this;
 * everything here is a new, smaller composition of what already exists.
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
  const { transform, zoomStep, reset, beginDrag, dragTo, endDrag, wasDragged, clearDragged, isDragging, minScale, maxScale } =
    useMapTransform(svgRef, VB_W, VB_H)

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

  function moveFocus(delta: number) {
    const n = SORTED_COUNTRIES.length
    const cur = focusIndexOf(focusedIso3)
    const next = cur === -1 ? (delta > 0 ? 0 : n - 1) : (cur + delta + n) % n
    setFocusedIso3(SORTED_COUNTRIES[next]!.iso3)
  }

  function typeAhead(letter: string) {
    const n = SORTED_COUNTRIES.length
    const cur = focusIndexOf(focusedIso3)
    const lower = letter.toLowerCase()
    for (let step = 1; step <= n; step++) {
      const idx = (cur + step + n) % n
      if (SORTED_COUNTRIES[idx]!.name.toLowerCase().startsWith(lower)) {
        setFocusedIso3(SORTED_COUNTRIES[idx]!.iso3)
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

  function handleMapFocus() {
    if (!disabled && !answered && !focusedIso3) setFocusedIso3(SORTED_COUNTRIES[0]!.iso3)
  }

  function handleMapKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
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
      setFocusedIso3(SORTED_COUNTRIES[0]!.iso3)
      return
    }
    if (e.key === 'End') {
      e.preventDefault()
      setFocusedIso3(SORTED_COUNTRIES[SORTED_COUNTRIES.length - 1]!.iso3)
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

  // Single-pointer drag-to-pan, mirroring Plate.tsx's own pointer handlers
  // (beginDrag/dragTo/endDrag come straight from the shared useMapTransform
  // hook). Pinch-zoom is left out — the zoom buttons below cover the same
  // need with far less code, and this card is small enough that dragging
  // one finger is all panning it needs.
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    e.currentTarget.setPointerCapture(e.pointerId)
    beginDrag(e.clientX, e.clientY)
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.buttons === 1) dragTo(e.clientX, e.clientY)
  }
  function handlePointerUp() {
    endDrag()
  }
  // A drag that moved the map shouldn't also commit an answer on release —
  // same guard Plate.tsx uses for its own country links.
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
          aria-label="World map. Arrow keys move between countries, type a letter to jump to a name, Enter or Space answers. Click a country to answer directly."
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
                const classNames = [styles.mapPath, state === 'idle' ? 'atlas-hatch' : '', state === 'focused' ? 'is-active' : '']
                  .filter(Boolean)
                  .join(' ')
                // Inline, not a CSS class, for the right/wrong fill — the
                // one place this must win regardless of stylesheet load
                // order, the same reason Plate.tsx paints its own ranked
                // countries inline rather than through a class.
                const fill = state === 'right' ? 'var(--note-ember)' : state === 'wrong' ? 'var(--note-rust)' : undefined
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
                  >
                    <title>{c.name}</title>
                  </path>
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
