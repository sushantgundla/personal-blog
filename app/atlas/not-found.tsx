import Link from 'next/link'
import styles from './_components/dossier.module.css'

/**
 * Any notFound() under /atlas that has no not-found.tsx of its own — an
 * unknown rankings indicator, a compare URL naming a country that doesn't
 * exist. Without this file those fell through to the main site's 404,
 * rendered outside the Atlas layout. Same register as [iso3]/not-found.tsx.
 */
export default function AtlasNotFound() {
  return (
    <div className={styles.notFound}>
      <span className="atlas-serial">SPECIMEN · VOID</span>
      <h1 className="atlas-face-name" style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)' }}>
        Not issued
      </h1>
      <p className="atlas-body" style={{ maxWidth: '32rem' }}>
        Nothing has been printed at this address.
      </p>
      <Link href="/atlas" className="atlas-label" style={{ textDecoration: 'underline' }}>
        ← Back to the plate
      </Link>
    </div>
  )
}
