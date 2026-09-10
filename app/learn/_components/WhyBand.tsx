import styles from './WhyBand.module.css'

/**
 * The notice that opens a lesson: one sentence on why this is worth the
 * reader's next seven minutes. Printed, not panelled — a hairline above
 * and below, no fill, nothing to click. Server component.
 *
 * Renders nothing when the lesson has no `why`, so a half-written lesson
 * doesn't leave an empty pair of rules on the page.
 *
 * An <aside> is a complementary landmark, and a landmark with no name is
 * announced as one more anonymous "complementary" in the page's landmark
 * list. It takes its name from the label it already prints, so a reader
 * skipping by landmark hears what this one is. There is exactly one per
 * lesson page, so the id can be fixed.
 */
export function WhyBand({ text }: { text: string }) {
  if (!text.trim()) return null

  return (
    <aside className={styles.band} aria-labelledby="lesson-why">
      <p className="sign-quiet" id="lesson-why">
        WHY THIS, FOR YOU
      </p>
      <p className={styles.text}>{text}</p>
    </aside>
  )
}
