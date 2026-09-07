import styles from './WhyBand.module.css'

/**
 * The band that opens a lesson: one sentence on why this lesson is worth
 * the reader's next seven minutes. Server component — it is static text.
 * Renders nothing when the lesson has no `why`, so a half-written lesson
 * doesn't leave an empty panel on the page.
 */
export function WhyBand({ text }: { text: string }) {
  if (!text.trim()) return null

  return (
    <aside className={styles.band}>
      <span className={styles.lead}>Why this, for you:</span>
      {text}
    </aside>
  )
}
