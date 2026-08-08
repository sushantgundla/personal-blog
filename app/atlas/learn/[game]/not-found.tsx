import Link from 'next/link'
import styles from '../_components/play.module.css'

/**
 * An unknown `[game]` — someone typed a URL, or followed a link to a game
 * that was never built. Same register as app/atlas/[iso3]/not-found.tsx:
 * the mint says plainly that nothing was issued, and points back.
 */
export default function GameNotFound() {
  return (
    <div className={styles.notFound}>
      <span className="atlas-serial">BENCH · CLOSED</span>
      <h1 className={styles.notFoundTitle}>No such bench</h1>
      <p className={styles.notFoundBody}>
        The floor runs five benches — spot the forgery, higher or lower, guess the flag, guess
        the country, and where in the world. Whatever you asked for is not one of them.
      </p>
      <Link href="/atlas/learn" className={styles.backLink}>
        ← Back to the floor
      </Link>
    </div>
  )
}
