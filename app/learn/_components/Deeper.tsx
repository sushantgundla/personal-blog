import type { DeeperLink } from '@/lib/learn'
import styles from './Deeper.module.css'

/**
 * "Go deeper" — the outside reading for one lesson. Server component.
 * Every link leaves the site, so they all open in a new tab. Renders
 * nothing when the list is empty.
 */
export function Deeper({ links }: { links: DeeperLink[] }) {
  if (links.length === 0) return null

  return (
    <section className={styles.deeper} aria-labelledby="lesson-deeper">
      <h2 id="lesson-deeper" className="learn-eyebrow">
        Go deeper
      </h2>
      <ul className={styles.list}>
        {links.map((link) => (
          <li key={link.href}>
            <a className={styles.link} href={link.href} target="_blank" rel="noreferrer">
              {link.label || link.href}
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
