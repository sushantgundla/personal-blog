'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Fires once when the observed element enters the viewport.
 * Used to trigger the reveal-on-scroll effect for below-the-fold content.
 */
export function useReveal<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, visible }
}

/**
 * Tracks 0→1 scroll progress of an element through the viewport.
 * Powers the hero band's parallax/scale-fade. Transform + opacity only,
 * updated via rAF so it never triggers layout. Disabled entirely under
 * prefers-reduced-motion, leaving progress pinned at 0 (static).
 */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0

    const update = () => {
      const rect = el.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, -rect.top / (rect.height || 1)))
      setProgress(p)
      raf = 0
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return { ref, progress }
}
