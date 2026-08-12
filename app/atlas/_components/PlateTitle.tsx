'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import styles from './plate.module.css'

/**
 * The word, kept here as one constant rather than as a prop or a literal in
 * two places: the letters below are rendered from it *and* the heading's
 * accessible name is set from it, and those two silently drifting apart —
 * a screen reader announcing something the page doesn't say — is the one
 * bug this component could ship without anybody noticing.
 */
const WORD = 'Atlas'

/**
 * How far outside the word, in CSS pixels, the pointer still counts as being
 * "on" the title. Deliberately generous: the word itself is a small line of
 * spaced capitals in a bar barely taller than it, so a band the exact size of
 * the glyphs would mean the light only ever appeared if you landed the cursor
 * dead on a letter. These numbers are the reach of the effect, not a hit
 * target — nothing here is clickable.
 */
const BAND_X = 140
const BAND_Y = 90

/**
 * How much of the remaining distance the light closes each frame. 0.18 at
 * 60fps settles in roughly a fifth of a second: fast enough that the glow
 * feels attached to the cursor while it moves, slow enough that it visibly
 * *eases* back to the middle when the pointer leaves instead of snapping.
 */
const CHASE = 0.18

/**
 * The plate's own heading — the word ATLAS, lit by a warm ember light that
 * follows the pointer, with the letters nearest the light lifting a couple
 * of pixels and warming towards --note-ember.
 *
 * Why this is a component at all: the heading used to be a plain `<h1>` in
 * page.tsx carrying a static two-stop `text-shadow`. Live, the owner said he
 * could not see any effect whatsoever — a faint halo behind small text on a
 * near-black bar reads as nothing. This replaces it with something that
 * moves, and gives the resting state a halo strong enough to be seen without
 * a pointer anywhere near it.
 *
 * Why the pointer drives CSS custom properties instead of React state:
 * a pointermove fires up to once per frame, and putting those coordinates in
 * `useState` would re-render this subtree — and diff and re-commit all five
 * letter spans — sixty times a second, for a change that is pure paint. The
 * numbers are written straight onto the word's `style` object instead, so
 * React renders exactly once and the browser's style/paint pipeline does the
 * rest. Everything that actually *looks* like anything (the falloff per
 * letter, the lift, the two glow layers) is declared in plate.module.css and
 * merely reads those numbers; this file only ever answers "where is the
 * pointer, and how lit are we".
 *
 * The four properties it writes, all set on the word wrapper so they inherit
 * down to every letter:
 *   --tx   pointer position along the word, measured in letters (0 = the
 *          first letter's centre, WORD.length - 1 = the last). Letter space,
 *          not pixels, because that is the space each letter's own --cx is
 *          in — see .introTitleLetter, which does the distance falloff in
 *          plain calc() with no abs() and no JS help.
 *   --px   pointer x relative to the word's box, in px (bare number).
 *   --py   pointer y relative to the word's box, in px (bare number).
 *   --lit  0 when the pointer is away, 1 when it is inside the band. This is
 *          what keeps the resting state honest: at 0 there is no lift and no
 *          pointer glow at all, only the static halo the CSS paints anyway.
 */
export function PlateTitle() {
  const wordRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const word = wordRef.current
    if (!word) return

    // Two visitors get nothing attached at all, rather than attached and then
    // neutralised. On a touch screen there is no hover, so a pointermove
    // listener would either never fire or fire once mid-tap and leave the
    // title stuck lit under a finger that has gone. And a visitor who has
    // asked for reduced motion has asked for exactly this not to happen. Both
    // fall back to the resting halo, which is pure CSS and needs no
    // JavaScript to appear.
    if (!window.matchMedia('(hover: hover)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lastLetter = WORD.length - 1
    const restTx = lastLetter / 2

    // The word's box on screen. Cached rather than read inside the animation
    // loop: getBoundingClientRect forces the browser to flush layout, and this
    // page has a full world map in it, so doing that every frame while the
    // mouse moves is a real cost for a number that only changes when the page
    // reflows.
    let box = word.getBoundingClientRect()
    const measure = () => {
      box = word.getBoundingClientRect()
    }

    // Where the light is heading...
    let targetTx = restTx
    let targetPx = box.width / 2
    let targetPy = box.height / 2
    let targetLit = 0
    // ...and where it actually is. The gap between the two, closed a fraction
    // at a time in step(), is the whole easing model: there is no CSS
    // transition involved because unregistered custom properties do not
    // interpolate, so the smoothing has to happen to the numbers themselves.
    let tx = targetTx
    let px = targetPx
    let py = targetPy
    let lit = 0

    let frame = 0

    const write = () => {
      word.style.setProperty('--tx', tx.toFixed(3))
      word.style.setProperty('--px', px.toFixed(1))
      word.style.setProperty('--py', py.toFixed(1))
      word.style.setProperty('--lit', lit.toFixed(3))
    }

    const step = () => {
      frame = 0
      tx += (targetTx - tx) * CHASE
      px += (targetPx - px) * CHASE
      py += (targetPy - py) * CHASE
      lit += (targetLit - lit) * CHASE
      write()

      // Stop as soon as the numbers stop being worth writing — a loop that
      // ran forever would keep the page's compositor awake (and a laptop fan
      // with it) for a heading that is sitting perfectly still. The next
      // pointermove wakes it back up.
      const settled =
        Math.abs(targetTx - tx) < 0.002 &&
        Math.abs(targetPx - px) < 0.4 &&
        Math.abs(targetPy - py) < 0.4 &&
        Math.abs(targetLit - lit) < 0.004
      if (settled) {
        tx = targetTx
        px = targetPx
        py = targetPy
        lit = targetLit
        write()
        return
      }
      frame = requestAnimationFrame(step)
    }

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(step)
    }

    const rest = () => {
      targetTx = restTx
      targetPx = box.width / 2
      targetPy = box.height / 2
      targetLit = 0
      wake()
    }

    /**
     * The rAF throttle asked for, in the shape this loop wants: the handler
     * itself does no writing and no layout reading at all. It records where
     * the pointer is and makes sure the frame loop is running; the loop is
     * what touches the DOM, once per frame at most, however many events the
     * browser coalesced into that frame.
     */
    const onMove = (event: PointerEvent) => {
      const x = event.clientX - box.left
      const y = event.clientY - box.top
      const inBand =
        x > -BAND_X && x < box.width + BAND_X && y > -BAND_Y && y < box.height + BAND_Y

      if (!inBand) {
        rest()
        return
      }

      targetLit = 1
      targetPx = x
      targetPy = y
      // Deliberately not clamped to the word: letting --tx run past either end
      // is what makes the outermost letter fade out as the pointer carries on
      // away from it, instead of the last letter staying pinned at full
      // brightness while the cursor is halfway across the bar.
      targetTx = box.width > 0 ? (x / box.width) * lastLetter : restTx
      wake()
    }

    // Leaving the window stops firing pointermove, so without this the title
    // would keep whatever lit state it had when the cursor crossed the edge.
    const onLeaveDocument = () => rest()

    write()

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('resize', measure, { passive: true })
    // The landing plate is a fixed, non-scrolling shell above 900px, but it
    // falls back to a normally scrolling page below that (see the page-shell
    // comment in plate.module.css), and a narrow window can still have a
    // mouse. Cheap to keep correct either way.
    window.addEventListener('scroll', measure, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeaveDocument)

    // Bodoni Moda is a webfont: the first measurement is almost always of the
    // fallback serif, and the word changes width the moment the real face
    // lands. Without this the letter-space mapping stays subtly wrong for the
    // life of the page.
    document.fonts?.ready.then(measure).catch(() => {})

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure)
      document.documentElement.removeEventListener('pointerleave', onLeaveDocument)
    }
  }, [])

  return (
    // aria-label carries the accessible name, so the heading announces the
    // single word "Atlas" rather than five separate letters; the spans are
    // hidden from assistive tech in one go on the wrapper. The DOM text is
    // still exactly "Atlas", which is what a crawler reads, so splitting the
    // word costs nothing in search.
    <h1 className={styles.introTitle} aria-label={WORD}>
      <span ref={wordRef} className={styles.introTitleWord} aria-hidden="true">
        {WORD.split('').map((letter, index) => (
          <span
            key={index}
            className={styles.introTitleLetter}
            // Each letter's own position along the word, in the same "letters"
            // unit as --tx. A string, not a number: React appends "px" to bare
            // numeric style values, and this one is unitless on purpose.
            style={{ '--cx': String(index) } as CSSProperties}
          >
            {letter}
          </span>
        ))}
      </span>
    </h1>
  )
}
