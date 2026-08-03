'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import type { SurpriseCard as SurpriseCardData } from '@/lib/atlas/learn/types'
import { guillochePath, guillocheLength } from '@/lib/atlas/guilloche'
import { countryInk } from '@/lib/atlas/ink'
import styles from './floor.module.css'

const SEED = 'surprise'
const ROSETTE_SIZE = 260
const ENDPOINT = '/atlas/learn/api/round?game=surprise'

function hexToRgbString(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

/**
 * The round route is written by someone else and may wrap the card, so this
 * accepts either the card itself or `{ card: ... }` and checks the fields it
 * actually renders before trusting any of them. A malformed body is treated
 * exactly like a failed request: a plain message and a retry, never a
 * half-drawn card.
 */
function readCard(body: unknown): SurpriseCardData | null {
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
    flagUrl: typeof raw.flagUrl === 'string' ? raw.flagUrl : null,
    headline: raw.headline,
    detail: typeof raw.detail === 'string' ? raw.detail : '',
    href: raw.href,
    provenance: {
      source: provenance.source === 'Wikidata' ? 'Wikidata' : 'World Bank',
      year: typeof provenance.year === 'string' ? provenance.year : null,
      href: typeof provenance.href === 'string' ? provenance.href : raw.href,
    },
  }
}

/**
 * The fourth card on the floor. Not a game — one press deals a single
 * country's most remarkable fact, with the year it comes from, the source
 * that reported it, and a way through to the full dossier.
 *
 * Nothing is fetched until the visitor asks for it, so the floor still
 * renders and reads with the network down.
 */
export function SurpriseCard() {
  const [card, setCard] = useState<SurpriseCardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deal = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(ENDPOINT, { cache: 'no-store' })
      const body: unknown = await res.json().catch(() => null)
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
      setError("Couldn't reach the mint. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  const ink = countryInk(SEED)
  const path = guillochePath(SEED, { size: ROSETTE_SIZE })
  const length = guillocheLength(SEED) * (ROSETTE_SIZE / 200)

  return (
    <section
      className={`atlas-note ${styles.card}`}
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
        className={`atlas-guilloche ${styles.cardRosette}`}
      >
        <path
          d={path}
          className="atlas-guilloche-path"
          style={{ ['--atlas-dash-length' as string]: length }}
        />
      </svg>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>Surprise me</h3>
        <p className={styles.cardLine}>
          Not a game. One country&rsquo;s most remarkable fact, dealt as a card.
        </p>

        {/* aria-live so the dealt card, the loading line and any error are
            announced without moving focus off the button. */}
        <div aria-live="polite" className={styles.dealt}>
          {loading && <p className={styles.notice}>Dealing a card&hellip;</p>}

          {!loading && error && (
            <p className={`${styles.notice} ${styles.noticeError}`}>{error}</p>
          )}

          {!loading && !error && card && (
            <>
              <div className={styles.dealtHead}>
                {card.flagUrl && (
                  <span className={`atlas-ornament ${styles.dealtFlag}`}>
                    {/* Plain <img>, like the face note's flag seal: these are
                        Commons thumbnails behind a redirect chain that
                        next/image's optimizer handles inconsistently. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={card.flagUrl} alt="" className={styles.dealtFlagImg} />
                  </span>
                )}
                <span className="atlas-label">{card.name}</span>
              </div>
              <p className={styles.dealtHeadline}>{card.headline}</p>
              {card.detail && <p className={styles.dealtDetail}>{card.detail}</p>}
              <p className={styles.dealtDetail}>
                {card.provenance.source}
                {card.provenance.year ? ` · ${card.provenance.year}` : ''}
              </p>
              <Link href={card.href} className={styles.dealtLink}>
                Open {card.name}&rsquo;s note →
              </Link>
            </>
          )}
        </div>

        <div className={styles.cardFoot}>
          <button type="button" onClick={deal} disabled={loading} className={styles.dealButton}>
            {loading ? 'Dealing…' : card || error ? 'Deal another' : 'Deal me a card'}
          </button>
        </div>
      </div>
    </section>
  )
}
