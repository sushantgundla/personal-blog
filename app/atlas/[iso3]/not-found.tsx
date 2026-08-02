import Link from 'next/link'
import styles from '../_components/dossier.module.css'

export default function CountryNotFound() {
  return (
    <div className={styles.notFound}>
      <span className="atlas-serial">SPECIMEN · VOID</span>
      <h1 className="atlas-face-name" style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)' }}>
        Not issued
      </h1>
      <p className="atlas-body" style={{ maxWidth: '32rem' }}>
        No banknote has been printed for that code. It may not be a real ISO3 country code, or it
        hasn&apos;t been added to the plate yet.
      </p>
      <Link href="/atlas" className="atlas-label" style={{ textDecoration: 'underline' }}>
        ← Back to the plate
      </Link>
    </div>
  )
}
