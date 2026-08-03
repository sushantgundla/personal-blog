'use client'

import Link from 'next/link'
import type { Question } from '@/lib/atlas/learn/types'
import styles from './play.module.css'

export interface VerdictProps {
  question: Question
  /** Which option the player committed to. Always a real index here. */
  picked: number
}

/**
 * The panel that comes up the moment an answer is committed — and the whole
 * reason this section exists.
 *
 * Getting a question wrong is where somebody actually learns something, so
 * this is deliberately not a thin "Nope, it was B". Right or wrong, it
 * prints every option's real number, the unit it is in, the year it was
 * measured, and a link to the country dossier the number was drawn from,
 * plus the source underneath. A player who misses a question should be able
 * to leave it knowing more than they arrived with, without opening a new
 * tab.
 *
 * The stamp is the only theatre. Everything below it is a ledger.
 *
 * Announced through `role="status"` so a screen reader hears the outcome
 * without the player having to go looking for it, and the plain words
 * "Correct" / "Not correct" lead — the stamp's own lettering is decorative
 * and is hidden from assistive tech.
 */
export function Verdict({ question, picked }: VerdictProps) {
  const correct = picked === question.answer

  // The stamp's wording. For "spot the forgery" the stamp lands on the
  // statement the player rejected and says what it actually was, which is
  // both truer to the frame and more informative than a bare right/wrong:
  // rejecting a genuine note is a different mistake from missing a fake.
  const stampWord =
    question.game === 'forgery' ? (correct ? 'FORGED' : 'GENUINE') : correct ? 'CORRECT' : 'INCORRECT'

  const stampNote =
    question.game === 'forgery'
      ? `you rejected statement ${picked + 1}`
      : correct
        ? 'passed inspection'
        : 'held back'

  const { headline, rows, note } = question.verdict

  // Two questions in a round can easily draw on the same country and year;
  // printing "World Bank · 2022" three times would just be noise.
  const sources = question.provenance.filter(
    (p, i, all) =>
      all.findIndex((other) => other.source === p.source && other.year === p.year && other.href === p.href) === i
  )

  return (
    <section className={styles.verdict} data-correct={correct} role="status">
      <div className={styles.verdictTop}>
        <p className={styles.verdictCall}>
          <span className={styles.verdictCallWord}>{correct ? 'Correct.' : 'Not correct.'}</span>{' '}
          <span className={styles.verdictHeadline}>{headline}</span>
        </p>

        <div className={styles.stamp} aria-hidden="true">
          <span className={styles.stampWord}>{stampWord}</span>
          <span className={styles.stampNote}>{stampNote}</span>
        </div>
      </div>

      {rows.length > 0 && (
        <ul className={styles.ledger}>
          {rows.map((row, i) => (
            <li key={`${question.id}-row-${i}`} className={styles.ledgerRow}>
              <span className={styles.ledgerLabel}>{row.label}</span>
              <span className={styles.ledgerFigure}>
                <span className={styles.ledgerValue}>{row.value}</span>
                {row.year && (
                  <span className={styles.ledgerYear}>
                    {/* Health and education data lag three to five years —
                        the year is never optional decoration here. */}
                    {row.year}
                  </span>
                )}
              </span>
              {row.href ? (
                <Link href={row.href} className={styles.ledgerLink}>
                  open the dossier →
                </Link>
              ) : (
                <span className={styles.ledgerLinkEmpty} aria-hidden="true" />
              )}
            </li>
          ))}
        </ul>
      )}

      {note && <p className={styles.verdictNote}>{note}</p>}

      {sources.length > 0 && (
        <p className={styles.provenance}>
          <span className="atlas-label">Drawn from</span>
          {sources.map((p, i) => (
            <span key={`${question.id}-src-${i}`} className={styles.provenanceItem}>
              <Link href={p.href} className={styles.provenanceLink}>
                {p.source}
                {p.year ? `, ${p.year}` : ''}
              </Link>
            </span>
          ))}
        </p>
      )}
    </section>
  )
}
