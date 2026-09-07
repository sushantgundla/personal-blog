import styles from './WhyBand.module.css'

/**
 * The notice that opens a lesson: one sentence on why this is worth the
 * reader's next seven minutes. Printed, not panelled — a hairline above
 * and below, no fill, nothing to click. Server component.
 *
 * Renders nothing when the lesson has no `why`, so a half-written lesson
 * doesn't leave an empty pair of rules on the page.
 */
export function WhyBand({ text }: { text: string }) {
  if (!text.trim()) return null

  return (
    <aside className={styles.band}>
      <p className="sign-quiet">WHY THIS, FOR YOU</p>
      <p className={styles.text}>{text}</p>
    </aside>
  )
}
