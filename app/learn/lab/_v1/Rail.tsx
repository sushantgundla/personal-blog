'use client'

import { useEffect, useState } from 'react'
import type { Section } from './sections'
import s from './specimen.module.css'

interface Props {
  sections: Section[]
  /** Whether the sheet has a check band and a notes band to point at. */
  hasCheck: boolean
  hasNotes: boolean
}

/**
 * The standing margin rail — the piece this sheet exists for.
 *
 * A drawing office numbers what is on a sheet down the margin, and a lesson
 * is already numbered. The rail lists those items as callouts — a numeral, a
 * leader, the section's own name — and stays with the reader as they scroll,
 * so the sheet always answers "which part of this am I in" without them
 * scrolling back to find out. Below 62rem it is a ruled contents list under
 * the title block instead: the same items, the same links, in the one place
 * on a phone where a reader is deciding whether to stay.
 *
 * It is a client component for exactly one reason: which item the reader is
 * standing in is a fact about the scroll position, and nothing but the
 * browser knows it. Everything else here is static.
 *
 * The measurement is a plain rect test rather than an IntersectionObserver:
 * a section is often taller than the viewport, and an observer watching only
 * the headings goes quiet in the middle of a long one. The last heading that
 * has passed the reading line is the section you are in, whether or not it
 * is still on screen.
 */

/** How far below the top of the window the reading line sits, in px. */
const READING_LINE = 120

export function Rail({ sections, hasCheck, hasNotes }: Props) {
  const [active, setActive] = useState('')

  // A string, not the array: the prop is rebuilt on every render of the
  // page above and would restart the effect for no reason.
  const idKey = sections.map((section) => section.id).join('|')

  useEffect(() => {
    const ids = idKey === '' ? [] : idKey.split('|')
    if (ids.length === 0) return

    let frame = 0

    const measure = () => {
      frame = 0
      let current = ids[0]
      for (const id of ids) {
        const element = document.getElementById(id)
        if (!element) continue
        if (element.getBoundingClientRect().top > READING_LINE) break
        current = id
      }
      setActive(current)
    }

    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [idKey])

  if (sections.length === 0 && !hasCheck && !hasNotes) return null

  return (
    <nav className={`${s.margin} ${s.sticks} ${s.rail}`} aria-label="Items on this sheet">
      <p className="sign-quiet">SECTIONS</p>

      <ol className={s.railList}>
        {sections.map((section) => {
          const here = section.id === active

          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={s.railItem}
                aria-current={here ? 'true' : undefined}
              >
                <span className={`num ${s.railN}`}>{section.n}</span>

                {/* The leader, and the you-are-here ring at the end of it on
                    the item being read. The box is the same size either way,
                    so nothing in the margin moves while the reader scrolls. */}
                <svg
                  className={s.railLeader}
                  viewBox="0 0 34 12"
                  aria-hidden="true"
                  focusable="false"
                >
                  <line
                    className={s.railLeaderLine}
                    x1={0}
                    y1={6}
                    x2={here ? 24 : 34}
                    y2={6}
                  />
                  {here && <circle className={s.railRing} cx={28.5} cy={6} r={3.4} />}
                </svg>

                <span className={s.railName}>{section.text}</span>
              </a>
            </li>
          )
        })}
      </ol>

      {(hasCheck || hasNotes) && (
        <ul className={s.railEnds}>
          {hasCheck && (
            <li>
              <a href="#lesson-recall" className={`sign-quiet ${s.railEnd}`}>
                RECALL
              </a>
            </li>
          )}
          {hasNotes && (
            <li>
              <a href="#lesson-notes" className={`sign-quiet ${s.railEnd}`}>
                NOTES
              </a>
            </li>
          )}
        </ul>
      )}
    </nav>
  )
}
