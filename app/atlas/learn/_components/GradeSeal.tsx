'use client'

import { useEffect, useState } from 'react'
import {
  GRADES,
  gradeFor,
  lifetimeCorrect,
  nextGrade,
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
  const grade = gradeFor(correct)
  const next = nextGrade(correct)
  const bestStreak = progress?.bestStreak ?? 0

  // How far along the current rung the visitor is, 0..1. The floor of the
  // rung is the grade they hold; the ceiling is the next one.
  const span = next ? next.at - grade.at : 0
  const climbed = span > 0 ? Math.min(1, Math.max(0, (correct - grade.at) / span)) : 1

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
                ? `${next.at - correct} more to ${next.name}`
                : `Top of the ladder — ${GRADES[GRADES.length - 1].name}`}
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

      {/* The whole ladder, so the climb has somewhere visible to go. */}
      <ol className={styles.ranks}>
        {GRADES.map((rung) => {
          const held = rung.name === grade.name
          const earned = correct >= rung.at
          return (
            <li
              key={rung.name}
              className={`${styles.rank} ${earned ? styles.rankEarned : ''} ${
                held ? styles.rankHeld : ''
              }`}
              aria-current={held ? 'true' : undefined}
            >
              <span>
                {held && (
                  <span aria-hidden="true" className={styles.rankMark}>
                    ◉{' '}
                  </span>
                )}
                {rung.name}
              </span>
              <span>{rung.at}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
