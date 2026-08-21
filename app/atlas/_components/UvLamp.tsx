'use client'

import { useEffect, useState } from 'react'
import { MagneticButton } from '@/components/MagneticButton'
import styles from './dossier.module.css'

const STORAGE_KEY = 'atlas-uv-lamp'

/**
 * The dossier's signature toy: flips .uv-on on the shared .atlas-root
 * element that app/atlas/layout.tsx renders around every /atlas page.
 * Reached via the DOM rather than a prop, since there's exactly one
 * .atlas-root per page and no shared client context to lift state into.
 * Every custom-property swap and the .atlas-remarkable glow are already
 * wired in atlas.css — this component only ever toggles the one class
 * and remembers the visitor's choice.
 *
 * Waits for the saved value to load before writing anything back, so a
 * previously-saved "on" is never clobbered by an initial "off" write.
 */
export function UvLamp() {
  const [on, setOn] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setOn(window.localStorage.getItem(STORAGE_KEY) === '1')
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    document.querySelector('.atlas-root')?.classList.toggle('uv-on', on)
    window.localStorage.setItem(STORAGE_KEY, on ? '1' : '0')
  }, [on, hydrated])

  return (
    <MagneticButton className="atlas-magnetic" strength={0.2}>
      <button
        type="button"
        onClick={() => setOn((v) => !v)}
        aria-pressed={on}
        className={`${styles.uvButton} ${on ? styles.uvButtonOn : ''}`}
      >
        {on ? '◉ UV LAMP ON' : '○ UV LAMP'}
      </button>
    </MagneticButton>
  )
}
