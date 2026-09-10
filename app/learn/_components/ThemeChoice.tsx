'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import styles from './ThemeChoice.module.css'

/**
 * The light/dark switch in the section's header rail.
 *
 * Until this existed the section had no way to change theme at all: the
 * palette is driven by `.light` on <html>, which next-themes sets from
 * the reader's operating system, so a reader whose machine is set one way
 * could not read the publication the other way. Two settings, not a
 * toggle: LIGHT and DARK, spelled out, the twin of the NARROW / WIDE pair
 * beside it. Light is not a lesser mode here — it is the whiteprint, the
 * same cold drawing positive instead of negative — so it is named rather
 * than implied by a sun.
 *
 * next-themes owns the storage and the blocking script; this component
 * only reports the current setting and asks for a new one. That is the
 * one difference from ViewWidth.tsx, which keeps its own key in
 * localStorage and writes its own attribute onto <html>.
 */

type Choice = 'light' | 'dark'

export function ThemeChoice() {
  // useTheme knows nothing on the server and nothing on the first client
  // render — next-themes reads storage in an effect — so the first paint
  // has to be something fixed, or the markup React renders would not
  // match the markup it hydrates. It starts at the provider's own
  // defaultTheme ('dark', set in components/ThemeProvider.tsx) and the
  // real value arrives a frame later. This is the same pre-mount
  // placeholder ViewWidth.tsx uses, and it costs the same thing: on a
  // machine set to light, DARK is briefly the lit label. Nothing on the
  // page flashes — next-themes' own blocking script has already put the
  // right class on <html> — only which of these two words is at full ink.
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  // resolvedTheme, not theme: with enableSystem on the provider, `theme`
  // can be the string 'system', which is not one of the two things this
  // switch can show. resolvedTheme is always 'light' or 'dark'.
  const current: Choice = mounted && resolvedTheme === 'light' ? 'light' : 'dark'

  return (
    <div className={styles.group} role="group" aria-label="Colour theme">
      <button
        type="button"
        className={`sign-quiet ${styles.option} ${current === 'light' ? styles.on : ''}`.trim()}
        aria-pressed={current === 'light'}
        onClick={() => setTheme('light')}
      >
        Light
      </button>
      <button
        type="button"
        className={`sign-quiet ${styles.option} ${current === 'dark' ? styles.on : ''}`.trim()}
        aria-pressed={current === 'dark'}
        onClick={() => setTheme('dark')}
      >
        Dark
      </button>
    </div>
  )
}
