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
    const LERP = 0.15

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

    function tick() {
      outerX += (targetX - outerX) * LERP
      outerY += (targetY - outerY) * LERP
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
      <style>{`
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
      `}</style>
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
