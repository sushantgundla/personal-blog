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

  // localStorage throws outright when site data is blocked (and in some
  // private windows) — a remembered lamp is a nicety, never worth an
  // error boundary over.
  useEffect(() => {
    try {
      setOn(window.localStorage.getItem(STORAGE_KEY) === '1')
    } catch {
      // keep the default: off
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    document.querySelector('.atlas-root')?.classList.toggle('uv-on', on)
    try {
      window.localStorage.setItem(STORAGE_KEY, on ? '1' : '0')
    } catch {
      // not remembered this time; the lamp itself still works
    }
  }, [on, hydrated])

  // .atlas-root belongs to app/atlas/layout.tsx, which stays mounted across
  // client navigations. Without this, leaving a dossier with the lamp on
  // (the "Back to the plate" link) kept the map lit with no lamp to switch
  // it off. The saved choice is untouched, so the next dossier relights it.
  useEffect(() => {
    return () => {
      document.querySelector('.atlas-root')?.classList.remove('uv-on')
    }
  }, [])

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
