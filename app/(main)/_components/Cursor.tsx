'use client'

import { useEffect, useRef, useState } from 'react'

type CursorMode = 'default' | 'ring' | 'square' | 'block' | 'crosshair'

const HOVER_SELECTOR = 'a, button, [role="button"], input, .prism-card, .prism-chip'

function readCursorMode(): CursorMode {
  const styles = getComputedStyle(document.documentElement)
  const raw = styles.getPropertyValue('--prism-cursor').trim()
  if (raw === 'ring' || raw === 'square' || raw === 'block' || raw === 'crosshair') return raw
  return 'default'
}

function readAccent(): string {
  const styles = getComputedStyle(document.documentElement)
  return styles.getPropertyValue('--prism-accent').trim() || '#ff6b35'
}

export default function Cursor() {
  const outerRef = useRef<HTMLDivElement | null>(null)
  const innerRef = useRef<HTMLDivElement | null>(null)
  const [shouldRender, setShouldRender] = useState(false)
  const [mode, setMode] = useState<CursorMode>('default')
  const [accent, setAccent] = useState('#ff6b35')
  const [hovering, setHovering] = useState(false)

  // decide once, client-side, whether a custom cursor makes sense here at all
  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const narrow = window.innerWidth < 900
    setShouldRender(!coarse && !reduceMotion && !narrow)
  }, [])

  useEffect(() => {
    if (!shouldRender) return

    function applyTheme() {
      setMode(readCursorMode())
      setAccent(readAccent())
    }

    applyTheme()
    const raf = requestAnimationFrame(applyTheme)

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-prism-dimension') {
          applyTheme()
        }
      }
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-prism-dimension'] })

    return () => {
      cancelAnimationFrame(raf)
      mo.disconnect()
    }
  }, [shouldRender])

  // toggle native cursor hiding, always restored on unmount / mode change
  useEffect(() => {
    if (!shouldRender) return
    const active = mode !== 'default'
    if (active) {
      document.documentElement.classList.add('prism-cursor-hidden')
    }
    return () => {
      document.documentElement.classList.remove('prism-cursor-hidden')
    }
  }, [shouldRender, mode])

  // position loop: rAF-driven transform, never React state per move
  useEffect(() => {
    if (!shouldRender || mode === 'default') return

    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let outerX = targetX
    let outerY = targetY
    let rafId: number | null = null
    let lastT = 0

    /**
     * Time constant for the ring's follow, in seconds — the time it takes to
     * close ~63% of the gap to the pointer.
     *
     * This was a flat `outer += (target - outer) * 0.15` applied once per
     * frame, which had two problems. It was simply too heavy: at 60fps it
     * needs ~18 frames, about 300ms, to catch up, so the ring visibly trails
     * the pointer rather than tracking it. And because the step was per-frame
     * rather than per-second, the cursor moved at twice the speed on a 120Hz
     * display and crawled whenever the frame rate dropped.
     *
     * Exponential smoothing against real elapsed time fixes both: identical
     * feel at any refresh rate, and ~40ms is enough lag to read as a soft
     * follow instead of a rigid attachment.
     */
    const FOLLOW_TAU = 0.04

    function onMove(e: PointerEvent) {
      targetX = e.clientX
      targetY = e.clientY
      if (innerRef.current) {
        innerRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`
      }
    }

    function onOver(e: PointerEvent) {
      const target = e.target as Element | null
      setHovering(!!target?.closest(HOVER_SELECTOR))
    }

    function tick(now: number) {
      // Clamp the delta so a backgrounded tab or a long frame doesn't produce
      // one huge jump when it resumes.
      const dt = lastT ? Math.min((now - lastT) / 1000, 0.1) : 1 / 60
      lastT = now
      const k = 1 - Math.exp(-dt / FOLLOW_TAU)
      outerX += (targetX - outerX) * k
      outerY += (targetY - outerY) * k
      // Snap the last fraction of a pixel so the ring settles instead of
      // asymptotically creeping toward the pointer forever.
      if (Math.abs(targetX - outerX) < 0.1) outerX = targetX
      if (Math.abs(targetY - outerY) < 0.1) outerY = targetY
      if (outerRef.current) {
        outerRef.current.style.transform = `translate3d(${outerX}px, ${outerY}px, 0) translate(-50%, -50%)`
      }
      rafId = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    rafId = requestAnimationFrame(tick)

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
    }
  }, [shouldRender, mode])

  if (!shouldRender || mode === 'default') return null

  const innerSize = hovering ? 8 : 6
  const outerBaseSize = mode === 'block' ? 22 : 32
  const outerSize = hovering ? outerBaseSize * 1.4 : outerBaseSize

  return (
    <>
      {/* dangerouslySetInnerHTML, not a text child — see design-system.md §6.
          React escapes the apostrophes in `content: ''` below on the server but
          not on the client, and the mismatch makes React throw the whole tree
          away. This component happens to render null on the server today, so
          the bug is dormant rather than live, but the rule is absolute. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .prism-cursor-hidden,
        .prism-cursor-hidden * {
          cursor: none !important;
        }
        .prism-cursor-outer,
        .prism-cursor-inner {
          position: fixed;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 9999;
          will-change: transform;
        }
        .prism-cursor-inner {
          border-radius: 50%;
          transition: width 0.15s ease, height 0.15s ease, background 0.15s ease;
        }
        .prism-cursor-outer {
          transition: width 0.2s ease, height 0.2s ease, opacity 0.2s ease;
        }
        .prism-cursor-outer--ring {
          border-radius: 50%;
          border: 1.5px solid var(--prism-cursor-accent);
          mix-blend-mode: difference;
        }
        .prism-cursor-outer--square {
          border-radius: 2px;
          border: 1.5px solid var(--prism-cursor-accent);
          mix-blend-mode: difference;
        }
        .prism-cursor-outer--block {
          border-radius: 1px;
          background: var(--prism-cursor-accent);
          opacity: 0.85;
          mix-blend-mode: difference;
          animation: prism-cursor-blink 1s steps(1) infinite;
        }
        .prism-cursor-outer--crosshair {
          background: transparent;
        }
        .prism-cursor-outer--crosshair::before,
        .prism-cursor-outer--crosshair::after {
          content: '';
          position: absolute;
          background: var(--prism-cursor-accent);
          mix-blend-mode: difference;
        }
        .prism-cursor-outer--crosshair::before {
          left: 50%;
          top: 0;
          bottom: 0;
          width: 1px;
          transform: translateX(-50%);
        }
        .prism-cursor-outer--crosshair::after {
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          transform: translateY(-50%);
        }
        @keyframes prism-cursor-blink {
          0%, 49% { opacity: 0.85; }
          50%, 100% { opacity: 0.15; }
        }
        @media (prefers-reduced-motion: reduce) {
          .prism-cursor-outer--block {
            animation: none;
          }
        }
      `,
        }}
      />
      <div
        ref={innerRef}
        className="prism-cursor-inner"
        style={{
          width: innerSize,
          height: innerSize,
          background: accent,
          ['--prism-cursor-accent' as string]: accent,
        }}
      />
      <div
        ref={outerRef}
        className={`prism-cursor-outer prism-cursor-outer--${mode}`}
        style={{
          width: outerSize,
          height: outerSize,
          ['--prism-cursor-accent' as string]: accent,
        }}
      />
    </>
  )
}
