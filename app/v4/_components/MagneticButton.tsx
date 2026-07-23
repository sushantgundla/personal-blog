'use client'

import { useRef } from 'react'

/**
 * Wraps a CTA so it gently pulls toward the cursor while hovered,
 * then eases back to rest on mouse-leave. Transform only. No-ops
 * under prefers-reduced-motion.
 */
export function MagneticButton({
  children,
  className = '',
  strength = 0.35,
}: {
  children: React.ReactNode
  className?: string
  strength?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) * strength
    const y = (e.clientY - rect.top - rect.height / 2) * strength
    el.style.transform = `translate(${x}px, ${y}px)`
  }

  const handleLeave = () => {
    const el = ref.current
    if (el) el.style.transform = 'translate(0, 0)'
  }

  return (
    <div ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave} className={`v4-magnetic ${className}`}>
      {children}
    </div>
  )
}
