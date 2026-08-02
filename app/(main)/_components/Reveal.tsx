'use client'

import { createElement, useEffect, useRef, useState } from 'react'
import type { JSX, ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  delay?: number
  as?: keyof JSX.IntrinsicElements
  className?: string
}

/**
 * Wraps children in an element that fades/rises into place once it enters
 * the viewport. Uses one IntersectionObserver per instance and unobserves
 * itself after firing. Respects prefers-reduced-motion by revealing
 * immediately with no transition delay.
 */
export function Reveal({ children, delay = 0, as = 'div', className }: RevealProps): JSX.Element {
  const ref = useRef<HTMLElement | null>(null)
  const [isIn, setIsIn] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setIsIn(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsIn(true)
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const classes = ['v2-reveal', isIn ? 'v2-in' : '', className].filter(Boolean).join(' ')

  return createElement(
    as,
    {
      ref,
      className: classes,
      style: { transitionDelay: `${delay}ms` },
    },
    children
  )
}
