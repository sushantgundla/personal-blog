'use client'

import { useEffect, useState } from 'react'

/**
 * Splits text into per-character spans that rise into place on mount,
 * staggered word by word, followed by a one-shot cream highlight sweep.
 * The real text stays available to assistive tech via a sr-only span;
 * the animated characters are aria-hidden.
 */
export function KineticName({
  text,
  className = '',
  accentWordIndex,
}: {
  text: string
  className?: string
  accentWordIndex?: number
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  const words = text.split(' ')
  const accentIdx = accentWordIndex ?? words.length - 1
  let charIndex = 0

  return (
    <span className={`v4-kinetic ${mounted ? 'is-mounted' : ''} ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, wi) => (
          <span
            className={`v4-kinetic-word${wi === accentIdx ? ' v4-name-accent' : ''}`}
            key={wi}
            style={wi === accentIdx ? { color: 'var(--primary)' } : undefined}
          >
            {word.split('').map((ch, ci) => {
              const idx = charIndex++
              return (
                <span key={ci} className="v4-char" style={{ transitionDelay: `${idx * 34}ms` }}>
                  {ch}
                </span>
              )
            })}
            {wi < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </span>
      <span className="v4-sweep" aria-hidden="true" />
    </span>
  )
}
