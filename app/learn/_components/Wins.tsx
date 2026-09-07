import styles from './Wins.module.css'

/**
 * The pay-off list at the foot of a lesson — the concrete things the
 * reader can do now. Server component. Renders nothing when the lesson
 * lists no wins.
 */
export function Wins({ items }: { items: string[] }) {
  if (items.length === 0) return null

  return (
    <section className={styles.wins} aria-labelledby="lesson-wins">
      <h2 id="lesson-wins" className={styles.heading}>
        <span className={styles.arrow} aria-hidden="true">
          &#8618;
        </span>
        Your win
      </h2>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item} className={styles.item}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}
