'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './extras.module.css'

export interface AnthemPlayerProps {
  anthemName: string | null
  anthemAudioUrl: string | null
  countryName: string
}

/** Wikimedia Commons file URLs end in the file name — the licence requires
 * crediting the file page, not the raw asset. Small local copy: Sources.tsx
 * keeps its own (not exported), and this file cannot import from there. */
function commonsFilePage(audioUrl: string): string | null {
  try {
    const url = new URL(audioUrl)
    if (!url.hostname.endsWith('wikimedia.org')) return null
    const fileName = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? '')
    if (!fileName) return null
    return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName)}`
  } catch {
    return null
  }
}

/**
 * The national anthem, played from Wikidata P51 — an .ogg Vorbis file most
 * of the time. Safari cannot play Vorbis at all, so this feature-detects
 * with `canPlayType` and hides itself rather than showing a control that
 * silently does nothing. About 70% of countries have anthem audio; no
 * anthem is a normal, designed-for state, not an error.
 *
 * Styled as a small engraved seal rather than a default <audio> element.
 * Never autoplays — playback only starts on a user click.
 */
export function AnthemPlayer({ anthemName, anthemAudioUrl, countryName }: AnthemPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  // Assume supported for the very first paint so server and client render
  // identically (no hydration mismatch); correct immediately in an effect,
  // before the user could plausibly have clicked anything.
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    if (!anthemAudioUrl) return
    const probe = document.createElement('audio')
    const canPlay = probe.canPlayType('audio/ogg; codecs="vorbis"')
    setSupported(canPlay === 'probably' || canPlay === 'maybe')
  }, [anthemAudioUrl])

  // No anthem audio on Wikidata at all (~30% of countries) is normal
  // missing data — every panel gets a designed empty state for that.
  if (!anthemAudioUrl) {
    return (
      <div className={styles.utilityNote}>
        <span className="atlas-label">Anthem</span>
        <div className={styles.emptyState}>No anthem audio available</div>
      </div>
    )
  }

  // The file exists but this browser can't play Vorbis (Safari) — the spec
  // is explicit here: hide the control rather than show one that silently
  // does nothing. This is a capability gap, not missing content, so no
  // empty-state box; the whole panel disappears from the utility row.
  if (!supported) return null

  const filePage = commonsFilePage(anthemAudioUrl)

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
    } else {
      void el.play()
    }
  }

  return (
    <div className={styles.utilityNote}>
      <span className="atlas-label">Anthem</span>
      <div className={styles.anthemRow}>
        <button
          type="button"
          className={styles.anthemSeal}
          onClick={toggle}
          aria-pressed={playing}
          aria-label={playing ? `Pause ${countryName}'s national anthem` : `Play ${countryName}'s national anthem`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            {playing ? (
              <path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" />
            ) : (
              <path d="M4.5 2.5v11l9-5.5z" fill="currentColor" />
            )}
          </svg>
        </button>
        <div className={styles.anthemMeta}>
          <span className={styles.anthemName}>{anthemName ?? 'National anthem'}</span>
          {filePage && (
            <a
              href={filePage}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.anthemAttribution}
            >
              Audio: Wikimedia Commons
            </a>
          )}
        </div>
      </div>
      <audio
        ref={audioRef}
        src={anthemAudioUrl}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </div>
  )
}
