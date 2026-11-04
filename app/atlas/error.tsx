'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import styles from './_components/dossier.module.css'

/**
 * The error boundary for every /atlas/* page. A page that throws while
 * rendering — a dossier whose live fallback fetch blew up, say — used to take
 * down the whole section with Next's bare error screen. This keeps the Atlas
 * header and offers a retry. The error itself goes to the browser console
 * only; nothing from it is shown on the page.
 */
export default function AtlasError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className={styles.notFound} role="alert">
      <span className="atlas-serial">SPECIMEN · MISPRINT</span>
      <h1 className="atlas-face-name" style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)' }}>
        Misprint
      </h1>
      <p className="atlas-body" style={{ maxWidth: '32rem' }}>
        This sheet didn&apos;t print. Try again in a moment.
      </p>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <button
          type="button"
          onClick={reset}
          className="atlas-label"
          style={{ textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer' }}
        >
          ↻ Try again
        </button>
        <Link href="/atlas" className="atlas-label" style={{ textDecoration: 'underline' }}>
          ← Back to the plate
        </Link>
      </div>
    </div>
  )
}
