import type { DeeperLink } from '@/lib/learn'
import styles from './Deeper.module.css'

/**
 * "Go deeper" — the outside reading for one lesson. One link per line,
 * hairline between, an arrow to say it leaves the site. Server component.
 *
 * Renders nothing when the list is empty.
 */
export function Deeper({ links }: { links: DeeperLink[] }) {
  if (links.length === 0) return null

  return (
    <section className={styles.deeper} aria-labelledby="lesson-deeper">
      <h2 id="lesson-deeper" className="sign-quiet">
        GO DEEPER
      </h2>

      <ul className={styles.list}>
        {links.map((link) => (
          <li key={link.href} className={styles.row}>
            <a className={styles.link} href={link.href} target="_blank" rel="noreferrer">
              <span>{link.label || link.href}</span>
              {/* Decorative — the link already opens in a new tab and the
                  label says where it goes. */}
              <span className={styles.out} aria-hidden="true">
                &#8599;
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
