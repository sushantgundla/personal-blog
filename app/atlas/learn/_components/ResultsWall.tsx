'use client'

import { useEffect, useState } from 'react'
import { GAME_LABELS, readProgress, type RunRecord } from '@/lib/atlas/learn/progress'
import styles from './floor.module.css'

/** A strong run is stamped in ember, a weak one in security-thread green —
 *  the same two-colour language the dossier's comparison bar uses. */
const STRONG_RUN = 0.7

/**
 * The wall — the last 20 runs, newest first, each a small ledger card with
 * its score stamped on it.
 *
 * Client-only for the same reason as `GradeSeal`: the record lives in
 * `localStorage`, so it is read inside `useEffect` and the first render
 * matches the server's. Before it loads, the wall renders nothing at all
 * rather than flashing the empty state at someone who has thirty runs on
 * it.
 */
export function ResultsWall() {
  const [runs, setRuns] = useState<RunRecord[] | null>(null)

  useEffect(() => {
    setRuns(readProgress().runs)
  }, [])

  if (runs === null) {
    // One quiet placeholder line, so the section doesn't collapse to zero
    // height and shove the page upward the moment the record arrives.
    return <p className={styles.empty} aria-hidden="true" />
  }

  if (runs.length === 0) {
    return <p className={styles.empty}>No runs on the wall yet.</p>
  }

  return (
    <ul className={styles.wall}>
      {runs.map((run) => {
        const low = run.correct / run.total < STRONG_RUN
        return (
          <li key={run.id} className={styles.runCard}>
            <span className={styles.runGame}>{GAME_LABELS[run.game]}</span>
            <span className="atlas-serial">{formatWhen(run.at)}</span>
            <div className={styles.runFoot}>
              <span className={`${styles.runStamp} ${low ? styles.runStampLow : ''}`}>
                {run.correct}/{run.total}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * "3 Aug, 16:04". Locale-dependent, which is exactly why it only ever runs
 * after mount — the server's locale and the visitor's need never agree.
 */
function formatWhen(at: number): string {
  try {
    return new Date(at).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}
