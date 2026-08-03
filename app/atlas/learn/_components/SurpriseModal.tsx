'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react'
import Link from 'next/link'
import type { SurpriseCard as SurpriseCardData } from '@/lib/atlas/learn/types'
import { guillochePath, guillocheLength } from '@/lib/atlas/guilloche'
import { countryInk } from '@/lib/atlas/ink'
import styles from './surprise.module.css'

const ENDPOINT = '/atlas/learn/api/round?game=surprise'
const ROSETTE_SIZE = 420

/** Everything that can hold focus inside the dialog.
 *
 *  Every branch excludes `[tabindex="-1"]`, including the anchor one. That
 *  is not belt-and-braces: the reverse's dossier link is a perfectly real
 *  `a[href]` even while the card is face up, and `backface-visibility`
 *  does not remove it from the layout — so parking it at -1 is the only
 *  thing keeping it out of the tab order, and this selector has to respect
 *  that rather than match it anyway. */
const FOCUSABLE = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * The country's own guilloché rosette. Defined at module scope, not inside
 * the modal: a component declared during render is a new type on every
 * render, so React would tear this SVG down and rebuild it every time the
 * card is turned — and the draw-on animation would restart mid-flip.
 */
function Rosette({
  path,
  length,
  watermark,
}: {
  path: string
  length: number
  watermark?: boolean
}) {
  return (
    <svg
      viewBox={`0 0 ${ROSETTE_SIZE} ${ROSETTE_SIZE}`}
      aria-hidden="true"
      focusable="false"
      className={`atlas-guilloche ${styles.rosette} ${watermark ? styles.rosetteWatermark : ''}`}
    >
      <path
        d={path}
        className="atlas-guilloche-path"
        style={{ ['--atlas-dash-length' as string]: length }}
      />
    </svg>
  )
}

function hexToRgbString(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

function readString(raw: unknown): string | null {
  return typeof raw === 'string' && raw.trim() !== '' ? raw : null
}

function readStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
}

/** How many neighbouring ISO3 codes the reverse prints before it stops.
 *  Russia has 17; a row of seventeen three-letter codes is a wall, not a
 *  fact, and the dossier is one press away for the full list. */
const MAX_NEIGHBOURS = 8

/** "Drives on the" — the deck stores a bare "left" / "right". */
function drivingSideText(raw: string): string {
  const side = raw.trim().toLowerCase()
  if (side !== 'left' && side !== 'right') return raw
  return `${side[0].toUpperCase()}${side.slice(1)}`
}

/**
 * The round route is written by someone else and may wrap the card, so this
 * accepts either the card itself or `{ card: ... }` and checks the fields it
 * actually renders before trusting any of them. A malformed body is treated
 * exactly like a failed request: a plain message and a retry, never a
 * half-drawn card.
 *
 * The reverse's fine print — `region`, `capital`, `drivingSide`, `tld`,
 * `neighbours` — is read the same defensive way and every field is allowed
 * to be missing. A payload without them prints fewer rows rather than
 * printing "undefined".
 */
export function readCard(body: unknown): SurpriseCardData | null {
  if (!body || typeof body !== 'object') return null
  const outer = body as Record<string, unknown>
  const raw = (outer.card && typeof outer.card === 'object' ? outer.card : outer) as Record<
    string,
    unknown
  >
  if (typeof raw.name !== 'string' || typeof raw.headline !== 'string') return null
  if (typeof raw.href !== 'string' || typeof raw.iso3 !== 'string') return null
  const provenance = (raw.provenance ?? {}) as Record<string, unknown>
  return {
    iso3: raw.iso3,
    name: raw.name,
    flagUrl: readString(raw.flagUrl),
    headline: raw.headline,
    detail: typeof raw.detail === 'string' ? raw.detail : '',
    href: raw.href,
    region: readString(raw.region),
    capital: readString(raw.capital),
    drivingSide: readString(raw.drivingSide),
    tld: readString(raw.tld),
    neighbours: readStringArray(raw.neighbours),
    provenance: {
      source: provenance.source === 'Wikidata' ? 'Wikidata' : 'World Bank',
      year: readString(provenance.year),
      href: readString(provenance.href) ?? raw.href,
    },
  }
}

export interface SurpriseModalProps {
  /** Closes the room and hands focus back to the button that opened it. */
  onClose: () => void
}

/** One row of the reverse's fine print. */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.factRow}>
      <span className={`atlas-label ${styles.factLabel}`}>{label}</span>
      <span className={styles.factValue}>{value}</span>
    </div>
  )
}

/**
 * The dealt card, presented properly: the floor goes dark and blurred
 * behind it, and one banknote comes forward that can be turned over and
 * dealt again without leaving.
 *
 * Mounted only while open — SurpriseCard.tsx renders it on press and drops
 * it on close — so all of the below (the fetch, the scroll lock, the key
 * handlers) is set up and torn down with the room itself, and none of it
 * costs anything on a floor nobody has pressed the button on.
 *
 * No portal, deliberately. SurpriseCard renders this as a *sibling* of its
 * own note rather than inside it, which is all the escape the overlay
 * needs: the note sets `isolation: isolate` and `overflow: hidden`, and a
 * fixed overlay inside it would be trapped under the sections below.
 * Staying inside `.atlas-root` also matters — every colour here is a custom
 * property defined on that element and the UV lamp is a class on it, so a
 * card rendered outside it would print unstyled and would not dim with the
 * lamp.
 */
export function SurpriseModal({ onClose }: SurpriseModalProps) {
  const [card, setCard] = useState<SurpriseCardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flipped, setFlipped] = useState(false)

  const dialogRef = useRef<HTMLDivElement>(null)
  /** Guards against a slow first deal landing after a fast second one and
   *  putting the older card back on the table. */
  const requestId = useRef(0)
  const titleId = useId()

  const deal = useCallback(async () => {
    const id = requestId.current + 1
    requestId.current = id
    setLoading(true)
    setError(null)
    setFlipped(false)
    try {
      const res = await fetch(ENDPOINT, { cache: 'no-store' })
      const body: unknown = await res.json().catch(() => null)
      if (id !== requestId.current) return
      if (!res.ok) {
        const message =
          body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string'
            ? (body as { error: string }).error
            : `The mint didn't answer (${res.status}).`
        setError(message)
        return
      }
      const dealt = readCard(body)
      if (!dealt) {
        setError('That card came back blank. Try again.')
        return
      }
      setCard(dealt)
    } catch {
      if (id !== requestId.current) return
      setError("Couldn't reach the mint. Check your connection and try again.")
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  // The first card, dealt the moment the room opens.
  useEffect(() => {
    void deal()
  }, [deal])

  // Lock the page behind, and put it back exactly as it was. The padding
  // compensates for the scrollbar this removes — without it the whole page
  // jumps sideways under the blur as the room opens.
  useEffect(() => {
    const body = document.body
    const previousOverflow = body.style.overflow
    const previousPadding = body.style.paddingRight
    const gap = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (gap > 0) body.style.paddingRight = `${gap}px`
    return () => {
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPadding
    }
  }, [])

  // Esc, from anywhere — including from inside the card, and including
  // when focus has somehow escaped the dialog.
  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  // Focus moves into the dialog as it opens. The dialog itself takes it
  // rather than a control, so a screen reader reads the room's name and
  // then the card, instead of starting halfway down at "Deal another".
  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  /** Tab and Shift+Tab wrap inside the dialog and never reach the page. */
  const trapFocus = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return
    const dialog = dialogRef.current
    if (!dialog) return
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      // A control on the hidden face of the card has no boxes at all, so
      // this is what keeps the reverse's link out of the loop while the
      // front is showing.
      (el) => el.getClientRects().length > 0
    )
    if (focusable.length === 0) {
      event.preventDefault()
      dialog.focus()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement
    if (event.shiftKey && (active === first || active === dialog)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }, [])

  const turn = useCallback(() => setFlipped((current) => !current), [])

  /** A press anywhere on the paper turns the card — but a press on the
   *  dossier link is a press on the link, not on the card. */
  const onCardClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest('a, button')) return
      turn()
    },
    [turn]
  )

  const onCardKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return
      if ((event.target as HTMLElement).closest('a, button')) return
      // Space would otherwise scroll the room out from under the card.
      event.preventDefault()
      turn()
    },
    [turn]
  )

  const onBackdrop = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return
      onClose()
    },
    [onClose]
  )

  // The rosette and the ink are the country's own, seeded from its ISO3
  // through exactly the machinery every country note uses — so the dealt
  // card carries the same ornament its dossier does. Before the first card
  // lands there is no country yet, so the room's own seed stands in.
  const seed = card?.iso3 ?? 'surprise'
  const ink = countryInk(seed)
  const rosette = guillochePath(seed, { size: ROSETTE_SIZE })
  // guillocheLength assumes the 200x200 default sampling — scale it for the
  // size actually rendered (see lib/atlas/guilloche.ts).
  const rosetteLength = guillocheLength(seed) * (ROSETTE_SIZE / 200)

  const provenanceLine = card
    ? `${card.provenance.source}${card.provenance.year ? ` · ${card.provenance.year}` : ''}`
    : ''

  // An island has none; Russia has seventeen. Both print sensibly: the row
  // is dropped entirely at zero, and truncated with a count past the cap.
  const neighbours = card?.neighbours ?? []
  const shown = neighbours.slice(0, MAX_NEIGHBOURS)
  const neighboursText =
    neighbours.length > shown.length
      ? `${shown.join(' · ')} + ${neighbours.length - shown.length} more`
      : shown.join(' · ')

  return (
    <div className={styles.overlay} onClick={onBackdrop}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={styles.dialog}
        onKeyDown={trapFocus}
        style={{
          ['--note-ink' as string]: ink.hex,
          ['--note-ink-rgb' as string]: hexToRgbString(ink.hex),
        }}
      >
        <div className={styles.dialogHead}>
          <h2 id={titleId} className={styles.dialogTitle}>
            A card from the mint
          </h2>
          <button type="button" onClick={onClose} className={styles.close} aria-label="Close the card">
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {/* One live region for the whole stage: the loading line, any
            error and the dealt card all announce from here, so nothing
            has to move focus to be heard. */}
        <div className={styles.stage} aria-live="polite" aria-busy={loading}>
          {loading && (
            <div className={styles.panel}>
              <div className={styles.waiting} aria-hidden="true">
                <div className={styles.waitingRule} />
                <div className={styles.waitingRule} />
                <div className={styles.waitingRule} />
              </div>
              <p className={styles.notice}>Dealing a card&hellip;</p>
            </div>
          )}

          {!loading && error && (
            <div className={styles.panel}>
              <p className={`${styles.notice} ${styles.noticeError}`}>{error}</p>
              <button type="button" onClick={() => void deal()} className={styles.control}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && card && (
            <div
              className={`${styles.flipper} ${flipped ? styles.isFlipped : ''}`}
              tabIndex={0}
              role="group"
              aria-label={`${card.name} — ${flipped ? 'the reverse' : 'the face'} of the card. Press Enter to turn it over.`}
              onClick={onCardClick}
              onKeyDown={onCardKeyDown}
            >
              {/* ------------------------------------------- the face */}
              <div className={styles.face} aria-hidden={flipped}>
                <Rosette path={rosette} length={rosetteLength} />
                <div className={styles.faceScroll}>
                  <div className={styles.faceTop}>
                    <span className="atlas-serial">SERIAL · {card.iso3}</span>
                    <span className="atlas-serial">SURPRISE ME</span>
                  </div>

                  <div className={styles.head}>
                    {card.flagUrl && (
                      <span className={`atlas-ornament ${styles.flag}`}>
                        {/* Plain <img>, like the face note's flag seal: these are
                            Commons thumbnails behind a redirect chain that
                            next/image's optimizer handles inconsistently. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={card.flagUrl} alt="" className={styles.flagImg} />
                      </span>
                    )}
                    <h3 className={styles.name}>{card.name}</h3>
                  </div>

                  <div className={styles.faceMiddle}>
                    <p className={styles.headline}>{card.headline}</p>
                    {card.detail && <p className={styles.detail}>{card.detail}</p>}
                  </div>

                  <div className={styles.faceFoot}>
                    <span className="atlas-serial">{provenanceLine}</span>
                    <p className={styles.hint} aria-hidden="true">
                      Turn it over ↻
                    </p>
                  </div>

                  <p aria-hidden="true" className={`atlas-microtext ${styles.microStrip}`}>
                    {Array(10).fill(`${card.name.toUpperCase()} · THE MINT`).join('  ·  ')}
                  </p>
                </div>
              </div>

              {/* ---------------------------------------- the reverse */}
              <div className={`${styles.face} ${styles.back}`} aria-hidden={!flipped}>
                <Rosette path={rosette} length={rosetteLength} watermark />
                <div className={styles.faceScroll}>
                  <div className={styles.faceTop}>
                    <span className="atlas-serial">THE REVERSE</span>
                    <span className="atlas-serial">{card.iso3}</span>
                  </div>

                  <h3 className={styles.backTitle}>{card.name}</h3>

                  {/* No ISO row: the code is already engraved top-right of
                      this face, the way a serial is. Every other row is
                      only printed when the deck actually has it, so a
                      sparse country's reverse is short rather than a
                      column of em dashes. */}
                  <div className={styles.facts}>
                    {card.region && <Fact label="Region" value={card.region} />}
                    {card.capital && <Fact label="Capital" value={card.capital} />}
                    {card.drivingSide && (
                      <Fact label="Drives on the" value={drivingSideText(card.drivingSide)} />
                    )}
                    {card.tld && <Fact label="Domain" value={card.tld} />}
                    {neighbours.length > 0 && (
                      <Fact label="Borders" value={neighboursText} />
                    )}
                    <Fact
                      label="Source"
                      value={
                        card.provenance.year
                          ? `${card.provenance.source} · ${card.provenance.year}`
                          : card.provenance.source
                      }
                    />
                  </div>

                  <div className={styles.faceFoot}>
                    <Link
                      href={card.href}
                      className={styles.dossierLink}
                      // Face down, this link is not reachable by eye and must
                      // not be reachable by Tab either.
                      tabIndex={flipped ? 0 : -1}
                    >
                      Open {card.name}&rsquo;s note →
                    </Link>
                    <p className={styles.hint} aria-hidden="true">
                      Turn it back ↺
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            onClick={turn}
            disabled={loading || !card || Boolean(error)}
            aria-pressed={flipped}
            className={styles.control}
          >
            {flipped ? 'Turn it back' : 'Turn it over'}
          </button>
          <button
            type="button"
            onClick={() => void deal()}
            disabled={loading}
            className={`${styles.control} ${styles.controlPrimary}`}
          >
            {loading ? 'Dealing…' : 'Deal another'}
          </button>
          <p className={styles.keys}>Esc to close</p>
        </div>
      </div>
    </div>
  )
}
