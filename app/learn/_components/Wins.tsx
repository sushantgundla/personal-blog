import styles from './Wins.module.css'

/**
 * What the reader takes away — the concrete things they can do now that
 * they couldn't before. A numbered list, numerals in their own narrow
 * column so wrapped lines stay flush. Server component.
 *
 * Renders nothing when the lesson lists no wins.
 */
export function Wins({ items }: { items: string[] }) {
  if (items.length === 0) return null

  return (
    <section className={styles.wins} aria-labelledby="lesson-wins">
      <h2 id="lesson-wins" className="sign">
        WHAT YOU TAKE AWAY
      </h2>

      <ol className={styles.list}>
        {items.map((item, index) => (
          <li key={item} className={styles.item}>
            {/* The list is already numbered for a screen reader, so the
                visible numeral is presentational. */}
            <span className={`num ${styles.n}`} aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
