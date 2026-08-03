'use client'

import { useEffect, useState } from 'react'
import {
  gradeProgress,
  ladderWindow,
  lifetimeCorrect,
  readProgress,
  type Progress,
} from '@/lib/atlas/learn/progress'
import styles from './floor.module.css'

/**
 * The apprentice's grade, struck as a seal, with lifetime correct answers
 * under it and a security thread showing the climb to the next rung.
 *
 * `readProgress` runs inside `useEffect`, never during render: the server
 * has no `localStorage`, so reading it while rendering would make the
 * server HTML and the first client render disagree. React discards a
 * mismatched subtree, and on this page that means every button below stops
 * responding — a mistake this project has already paid for once. Until the
 * record loads, this renders the honest thing: the bottom rung and zero.
 */
export function GradeSeal() {
  const [progress, setProgress] = useState<Progress | null>(null)

  useEffect(() => {
    setProgress(readProgress())
  }, [])

  const correct = progress ? lifetimeCorrect(progress) : 0
  const bestStreak = progress?.bestStreak ?? 0

  // Every number on this panel comes out of the ladder, including how far
  // across the current rung the visitor is (0..1) and how many answers are
  // left. At the summit that is `next: null`, `remaining: 0`, `climbed: 1`,
  // so nothing here has to guard a subtraction.
  const { grade, next, rung, rungs, remaining, climbed, atTop } = gradeProgress(correct)
  const rows = ladderWindow(correct)

  return (
    <section className={`atlas-note ${styles.gradeBlock}`} aria-label="Your grade">
      {/* Raking highlight across the seal block — the same intaglio sheen
          the plate and the dossier notes carry. Decorative; atlas.css turns
          it off entirely under reduced motion. */}
      <div className="atlas-sheen" aria-hidden="true" />

      <div className={`${styles.seal} ${progress ? styles.sealStamp : ''}`}>
        <p className={styles.sealGrade}>
          <span className={styles.sealRank}>Grade</span>
          {grade.name}
        </p>
      </div>

      <div className={styles.gradeText}>
        <div className={styles.gradeCount}>
          <span className={`atlas-denomination ${styles.gradeNumber}`}>{correct}</span>
          <span className="atlas-label">
            correct, all time{bestStreak > 1 ? ` · best streak ${bestStreak}` : ''}
          </span>
        </div>

        <div className={styles.gradeLadder}>
          <div className={styles.gradeLadderRow}>
            <span className="atlas-serial">
              {next
                ? `${remaining} more to ${next.name}`
                : `Top of the ladder — nothing above ${grade.name}`}
            </span>
            <span className="atlas-serial">{next ? `${grade.at} → ${next.at}` : `${correct}`}</span>
          </div>
          <div className="atlas-thread">
            <div
              className="atlas-thread-fill"
              style={{ transform: `scaleX(${climbed})` }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* The ladder, shortened to the rungs that matter: the one below, the
          one held, the next two, and the summit. Printing all fifteen was a
          wall of small type that pushed the block past a phone's width, and
          a climber only ever looks at where they are and where they end
          up. `.rankGap` draws the stretch that was skipped. */}
      <div className={styles.ranks}>
        <p className={`atlas-label ${styles.ranksHead}`}>
          Rung {rung} of {rungs}
        </p>
        <ol className={styles.rankList}>
          {rows.map((row) => (
            <li
              key={row.grade.name}
              className={[
                styles.rank,
                row.earned ? styles.rankEarned : '',
                row.held ? styles.rankHeld : '',
                row.gapBefore ? styles.rankGap : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-current={row.held ? 'true' : undefined}
            >
              <span className={styles.rankName}>
                {row.held && (
                  <span aria-hidden="true" className={styles.rankMark}>
                    ◉{' '}
                  </span>
                )}
                {row.grade.name}
              </span>
              <span className={styles.rankAt}>{row.grade.at}</span>
            </li>
          ))}
        </ol>
        {/* Said in words as well as by the gap, because the dashed break is
            decorative and a screen reader would otherwise hear five rungs
            as if they were the whole ladder. */}
        {atTop ? (
          <p className={styles.ranksFoot}>Every rung climbed.</p>
        ) : (
          <p className={styles.ranksFoot}>
            {rungs - rung} more {rungs - rung === 1 ? 'rung' : 'rungs'} above you.
          </p>
        )}
      </div>
    </section>
  )
}
