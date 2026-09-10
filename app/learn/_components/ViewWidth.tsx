'use client'

import { useEffect, useState } from 'react'
import styles from './ViewWidth.module.css'

/**
 * The reading-width switch in the section's header rail.
 *
 * On a large screen a 70ch column leaves most of the window empty, and
 * some readers want the prose to cover more of it. Two settings, not a
 * slider: NARROW is the measure the lessons were typeset for, WIDE opens
 * it to 104ch. Both are character counts — the section never has a fixed
 * pixel max-width — so a phone still gets the whole window either way and
 * only the gutter decides.
 *
 * The choice is a data attribute on <html>, which the .measure rule in
 * app/learn/learn.css keys off. A blocking script in app/learn/layout.tsx
 * sets it from localStorage before first paint, so a reader who chose wide
 * never sees the narrow column flash; this component only has to keep the
 * buttons in step with it afterwards.
 */

export const WIDTH_KEY = 'learn:width:v1'
export const WIDTH_ATTR = 'data-ln-width'

type Width = 'narrow' | 'wide'

/**
 * Every access is wrapped: Safari private mode throws on localStorage,
 * and a hand-edited value must not take the rail down. Same shape as
 * useProgress.ts, which stores under `learn:progress:v1`.
 */
function read(): Width {
  if (typeof window === 'undefined') return 'narrow'

  try {
    return window.localStorage.getItem(WIDTH_KEY) === 'wide' ? 'wide' : 'narrow'
  } catch {
    return 'narrow'
  }
}

function write(width: Width): void {
  try {
    window.localStorage.setItem(WIDTH_KEY, width)
  } catch {
    // Storage full or blocked. The switch still works for this page load;
    // the choice just won't survive a reload.
  }
}

export function ViewWidth() {
  // The first render has to match the server's, which knows nothing about
  // localStorage — so it always starts narrow and the real value is read
  // after hydration. On a normal lesson the page is already at the right
  // width by then, because the blocking script set the attribute; this
  // state only drives which of the two buttons is lit.
  const [width, setWidth] = useState<Width>('narrow')

  useEffect(() => {
    const saved = read()
    setWidth(saved)

    // The blocking script does not always get to run. On the learn 404 the
    // layout's markup is inserted by the client rather than parsed from the
    // initial HTML, and a script node added that way never executes — so
    // the attribute would stay unset and the column render narrow even
    // though the switch says WIDE. Setting it here covers that route and
    // any other one like it, and costs a frame of narrow column only where
    // the script did not run.
    document.documentElement.setAttribute(WIDTH_ATTR, saved)
  }, [])

  function choose(next: Width) {
    setWidth(next)
    write(next)
    document.documentElement.setAttribute(WIDTH_ATTR, next)
  }

  return (
    <div className={styles.group} role="group" aria-label="Reading width">
      <button
        type="button"
        className={`sign-quiet ${styles.option} ${width === 'narrow' ? styles.on : ''}`.trim()}
        aria-pressed={width === 'narrow'}
        onClick={() => choose('narrow')}
      >
        Narrow
      </button>
      <button
        type="button"
        className={`sign-quiet ${styles.option} ${width === 'wide' ? styles.on : ''}`.trim()}
        aria-pressed={width === 'wide'}
        onClick={() => choose('wide')}
      >
        Wide
      </button>
    </div>
  )
}
