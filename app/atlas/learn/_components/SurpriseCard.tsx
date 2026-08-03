'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { guillochePath, guillocheLength } from '@/lib/atlas/guilloche'
import { countryInk } from '@/lib/atlas/ink'
import { SurpriseModal } from './SurpriseModal'
import floor from './floor.module.css'
import styles from './surprise.module.css'

const SEED = 'surprise'
const ROSETTE_SIZE = 260

function hexToRgbString(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

/**
 * The fourth card on the floor. Not a game — one press deals a single
 * country's most remarkable fact.
 *
 * This component is now only the door. It holds no card, fetches nothing
 * and knows nothing about the mint: pressing it opens SurpriseModal, which
 * darkens the floor behind it and brings one banknote forward that can be
 * turned over and dealt again. Everything that happens after the press
 * lives there.
 *
 * The card the visitor sees before pressing is plain markup, so the floor
 * still renders and reads with the network down — the button simply does
 * nothing with JavaScript off, which is the honest behaviour for a control
 * whose whole job is to fetch.
 */
export function SurpriseCard() {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  /** Tracks whether the room was ever open, so focus is only sent back to
   *  the button after a real close — not on first render. */
  const wasOpen = useRef(false)

  const close = useCallback(() => setOpen(false), [])

  // Focus returns to the button that opened the room. Done in an effect,
  // after React has removed the dialog, rather than inside the close
  // handler — focus set while the dialog is still mounted is lost the
  // moment the element holding it is torn down.
  useEffect(() => {
    if (open) {
      wasOpen.current = true
      return
    }
    if (!wasOpen.current) return
    wasOpen.current = false
    buttonRef.current?.focus()
  }, [open])

  const ink = countryInk(SEED)
  const path = guillochePath(SEED, { size: ROSETTE_SIZE })
  // guillocheLength assumes the 200x200 default sampling — scale it for the
  // size actually rendered (see lib/atlas/guilloche.ts).
  const length = guillocheLength(SEED) * (ROSETTE_SIZE / 200)

  return (
    <>
      <section
        className={`atlas-note ${floor.card}`}
        aria-label="Surprise me"
        style={{
          ['--note-ink' as string]: ink.hex,
          ['--note-ink-rgb' as string]: hexToRgbString(ink.hex),
        }}
      >
        <svg
          viewBox={`0 0 ${ROSETTE_SIZE} ${ROSETTE_SIZE}`}
          aria-hidden="true"
          focusable="false"
          className={`atlas-guilloche ${floor.cardRosette}`}
        >
          <path
            d={path}
            className="atlas-guilloche-path"
            style={{ ['--atlas-dash-length' as string]: length }}
          />
        </svg>

        <div className={floor.cardBody}>
          <h3 className={floor.cardTitle}>Surprise me</h3>
          <p className={floor.cardLine}>
            Not a game. One country&rsquo;s most remarkable fact, dealt face up on the table.
          </p>

          <div className={styles.openRow}>
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={open}
              className={styles.openButton}
            >
              Deal me a card
            </button>
          </div>
        </div>
      </section>

      {/* Outside the note above, not inside it. The note sets
          `isolation: isolate` and `overflow: hidden`, and a fixed overlay
          within it would be painted under the sections further down the
          floor. As a sibling it is still inside `.atlas-root`, so it keeps
          every design token and the UV lamp. It is fixed-position, so the
          grid it technically sits in never allocates it a cell. */}
      {open && <SurpriseModal onClose={close} />}
    </>
  )
}
