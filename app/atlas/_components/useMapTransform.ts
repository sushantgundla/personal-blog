'use client'

import { useCallback, useMemo, useRef, useState } from 'react'

/**
 * Zoom and pan for the plate's inline SVG map — no mapping library, ever
 * (see docs spec §5). The map itself never changes its `viewBox`; instead a
 * `<g transform="translate(tx,ty) scale(scale)">` wraps every path, so a
 * frame is one CSS-transform-equivalent repaint, not a re-layout.
 *
 * All screen <-> map-space conversions go through the root `<svg>`'s
 * `getScreenCTM()` rather than hand-rolled aspect-ratio math, so this stays
 * correct however the SVG is actually laid out on screen (letterboxed,
 * stretched, whatever `.mapWrap` / `.svg` in plate.module.css do).
 */

export interface MapTransform {
  scale: number
  tx: number
  ty: number
}

const MIN_SCALE = 1
const MAX_SCALE = 8
const WHEEL_ZOOM_FACTOR = 1.15
const STEP_ZOOM_FACTOR = 1.4
/** Fraction of the current viewBox width/height an arrow-key press pans by —
 * dividing by `scale` keeps it a constant fraction of what's visible, not a
 * constant map-space distance, so a press feels the same at any zoom. */
const KEY_PAN_FRACTION = 0.06

function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

export function useMapTransform(
  svgRef: React.RefObject<SVGSVGElement | null>,
  viewBoxW: number,
  viewBoxH: number
) {
  const [transform, setTransform] = useState<MapTransform>({ scale: 1, tx: 0, ty: 0 })

  // Drag bookkeeping lives in refs, not state — every pointermove would
  // otherwise trigger a render just to update "am I dragging".
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const dragMoved = useRef(false)
  const [isDragging, setIsDragging] = useState(false)

  /** Keeps some of the map on screen at any zoom/pan — a safety rail, not a
   * tight fit-to-content clamp. */
  const clampTranslate = useCallback(
    (tx: number, ty: number, scale: number) => ({
      tx: Math.min(viewBoxW, Math.max(-viewBoxW * scale, tx)),
      ty: Math.min(viewBoxH, Math.max(-viewBoxH * scale, ty)),
    }),
    [viewBoxW, viewBoxH]
  )

  /** Screen (client) coordinates -> the map's own pre-transform user space. */
  const screenToViewBox = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return null
    const ctm = svg.getScreenCTM()
    if (!ctm) return null
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const mapped = pt.matrixTransform(ctm.inverse())
    return { x: mapped.x, y: mapped.y }
  }, [svgRef])

  /** The inverse — a world/map-space point (e.g. a country's centroid) ->
   * client (screen) coordinates, accounting for the current zoom/pan. Used
   * to keep the hover cartouche pinned over a country reached by keyboard
   * focus, not just the mouse. */
  const worldToClient = useCallback(
    (worldX: number, worldY: number) => {
      const svg = svgRef.current
      if (!svg) return null
      const ctm = svg.getScreenCTM()
      if (!ctm) return null
      const pt = svg.createSVGPoint()
      pt.x = worldX * transform.scale + transform.tx
      pt.y = worldY * transform.scale + transform.ty
      const mapped = pt.matrixTransform(ctm)
      return { x: mapped.x, y: mapped.y }
    },
    [svgRef, transform]
  )

  const zoomAt = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      setTransform((prev) => {
        const p = screenToViewBox(clientX, clientY)
        if (!p) return prev
        const newScale = clampScale(prev.scale * factor)
        if (newScale === prev.scale) return prev
        const worldX = (p.x - prev.tx) / prev.scale
        const worldY = (p.y - prev.ty) / prev.scale
        const { tx, ty } = clampTranslate(p.x - worldX * newScale, p.y - worldY * newScale, newScale)
        return { scale: newScale, tx, ty }
      })
    },
    [screenToViewBox, clampTranslate]
  )

  /** Zoom step centred on the map's own viewport (the +/- buttons and the
   * keyboard's `+`/`-`, as opposed to the wheel, which zooms at the cursor). */
  const zoomStep = useCallback(
    (direction: 1 | -1) => {
      const svg = svgRef.current
      const factor = direction > 0 ? STEP_ZOOM_FACTOR : 1 / STEP_ZOOM_FACTOR
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor)
    },
    [svgRef, zoomAt]
  )

  const panByScreenDelta = useCallback(
    (dxScreen: number, dyScreen: number) => {
      const svg = svgRef.current
      if (!svg) return
      const ctm = svg.getScreenCTM()
      if (!ctm) return
      const inv = ctm.inverse()
      // A vector, not a point — no translation term, just the matrix's
      // linear (scale/skew) part, so a drag of N screen px moves the map by
      // the equivalent distance in its own user-space units.
      const dx = dxScreen * inv.a + dyScreen * inv.c
      const dy = dxScreen * inv.b + dyScreen * inv.d
      setTransform((prev) => {
        const { tx, ty } = clampTranslate(prev.tx + dx, prev.ty + dy, prev.scale)
        return { ...prev, tx, ty }
      })
    },
    [svgRef, clampTranslate]
  )

  /** Arrow-key panning — a fixed fraction of the current viewBox per press,
   * scaled down as you zoom in so it always covers the same visible span. */
  const panByKeys = useCallback(
    (dxDirection: number, dyDirection: number) => {
      setTransform((prev) => {
        const stepX = (viewBoxW * KEY_PAN_FRACTION) / prev.scale
        const stepY = (viewBoxH * KEY_PAN_FRACTION) / prev.scale
        const { tx, ty } = clampTranslate(
          prev.tx - dxDirection * stepX * prev.scale,
          prev.ty - dyDirection * stepY * prev.scale,
          prev.scale
        )
        return { ...prev, tx, ty }
      })
    },
    [viewBoxW, viewBoxH, clampTranslate]
  )

  const reset = useCallback(() => setTransform({ scale: 1, tx: 0, ty: 0 }), [])

  const beginDrag = useCallback((clientX: number, clientY: number) => {
    dragStart.current = { x: clientX, y: clientY }
    dragMoved.current = false
    setIsDragging(true)
  }, [])

  const dragTo = useCallback(
    (clientX: number, clientY: number) => {
      const start = dragStart.current
      if (!start) return
      const dx = clientX - start.x
      const dy = clientY - start.y
      // A few px of jitter shouldn't count as a drag — that's how a click
      // is told apart from a pan once the pointer settles.
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved.current = true
      panByScreenDelta(dx, dy)
      dragStart.current = { x: clientX, y: clientY }
    },
    [panByScreenDelta]
  )

  const endDrag = useCallback(() => {
    dragStart.current = null
    setIsDragging(false)
    // Left true for the click handler that fires right after pointerup to
    // read (and clear) — see Plate.tsx's onClickCapture.
    return dragMoved.current
  }, [])

  return useMemo(
    () => ({
      transform,
      isDragging,
      zoomAt,
      zoomStep,
      panByScreenDelta,
      panByKeys,
      reset,
      beginDrag,
      dragTo,
      endDrag,
      wasDragged: () => dragMoved.current,
      clearDragged: () => {
        dragMoved.current = false
      },
      worldToClient,
      minScale: MIN_SCALE,
      maxScale: MAX_SCALE,
    }),
    [transform, isDragging, zoomAt, zoomStep, panByScreenDelta, panByKeys, reset, beginDrag, dragTo, endDrag, worldToClient]
  )
}
