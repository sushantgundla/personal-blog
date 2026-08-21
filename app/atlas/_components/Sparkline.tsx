'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { TimeSeriesPoint } from '@/lib/atlas/types'

export interface SparklineProps {
  points: readonly TimeSeriesPoint[]
  width?: number
  height?: number
}

// A dossier page mounts ~20 Sparklines. Giving each one its own
// IntersectionObserver is wasteful: they all sit below the fold and fire
// almost immediately on scroll, so one observer shared by every Sparkline
// on the page does the same job — same threshold, same rootMargin, same
// one-shot "reveal once, then stop watching" behaviour — for a fraction of
// the setup cost. Kept local to this file because the sharing is specific
// to Sparkline's own mount pattern.
const SPARKLINE_REVEAL_THRESHOLD = 0.4
let sharedRevealObserver: IntersectionObserver | null = null
const sharedRevealCallbacks = new Map<Element, () => void>()

function getSharedRevealObserver(): IntersectionObserver {
  if (!sharedRevealObserver) {
    sharedRevealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const callback = sharedRevealCallbacks.get(entry.target)
          if (!callback) continue
          sharedRevealCallbacks.delete(entry.target)
          sharedRevealObserver?.unobserve(entry.target)
          callback()
        }
      },
      { threshold: SPARKLINE_REVEAL_THRESHOLD, rootMargin: '0px 0px -8% 0px' }
    )
  }
  return sharedRevealObserver
}

/** Fires once when the element enters the viewport (threshold 0.4), then
 * stops watching it — backed by one shared observer instead of one per
 * call site. */
function useSharedReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = getSharedRevealObserver()
    sharedRevealCallbacks.set(el, () => setVisible(true))
    observer.observe(el)

    return () => {
      sharedRevealCallbacks.delete(el)
      observer.unobserve(el)
    }
  }, [])

  return { ref, visible }
}

/**
 * A 1960->now time series rendered as a security thread rather than a
 * chart: no axes, no gridlines, no legend — just a polyline with a
 * slight sine wobble for the texture of an engraved metallic thread, and
 * an ember dot on the latest value. Draws itself on with
 * stroke-dashoffset once it scrolls into view (via useSharedReveal above);
 * fully visible immediately with JavaScript off or reduced motion, since
 * the base .atlas-sparkline-path class carries no hidden state of its
 * own — only .atlas-sparkline-draw (added here once visible) does, and
 * atlas.css already kills that animation under prefers-reduced-motion.
 */
export function Sparkline({ points, width = 120, height = 32 }: SparklineProps) {
  const { ref, visible } = useSharedReveal<HTMLDivElement>()

  const built = useMemo(() => {
    const valid = points.filter(
      (p): p is TimeSeriesPoint & { value: number } => p.value !== null
    )
    if (valid.length < 2) return null

    const values = valid.map((p) => p.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = max - min || 1
    const padY = height * 0.15

    const coords = valid.map((p, i) => {
      const x = (i / (valid.length - 1)) * width
      const t = (p.value - min) / span
      // Small deterministic wobble, purely textural — not a second data
      // series. Same input always produces the same wobble.
      const wobble = Math.sin(i * 0.9) * 1.1
      const y = height - padY - t * (height - padY * 2) + wobble
      return [x, y] as const
    })

    let length = 0
    for (let i = 1; i < coords.length; i++) {
      const [x0, y0] = coords[i - 1]
      const [x1, y1] = coords[i]
      length += Math.hypot(x1 - x0, y1 - y0)
    }

    return { coords, length, last: coords[coords.length - 1] }
  }, [points, width, height])

  if (!built) {
    return (
      <div style={{ display: 'inline-block', lineHeight: 0 }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          <line
            x1={0}
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke="var(--note-rule)"
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
        </svg>
      </div>
    )
  }

  const { coords, length, last } = built
  const polylinePoints = coords.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')

  return (
    <div ref={ref} style={{ display: 'inline-block', lineHeight: 0 }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <polyline
          points={polylinePoints}
          className={`atlas-sparkline-path ${visible ? 'atlas-sparkline-draw' : ''}`}
          style={{ ['--atlas-dash-length' as string]: length }}
        />
        <circle cx={last[0]} cy={last[1]} r={2} className="atlas-sparkline-dot" />
      </svg>
    </div>
  )
}
