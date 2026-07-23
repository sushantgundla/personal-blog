'use client'

import { useReveal } from './ScrollFx'

/**
 * Fades + rises children into place once they enter the viewport.
 * Falls back to fully-visible/static under prefers-reduced-motion (see v4.css).
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const { ref, visible } = useReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={`v4-reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}
