'use client'

import Link from 'next/link'
import type { GameId, Question } from '@/lib/atlas/learn/types'
import {
  gradeFor,
  lifetimeCorrect,
  nextGrade,
  type Progress,
} from '@/lib/atlas/learn/progress'
import styles from './play.module.css'

export interface MissedQuestion {
  question: Question
  /** The option the player chose. -1 if it somehow wasn't recorded. */
  picked: number
}

export interface RunSummaryProps {
  game: GameId
  correct: number
  total: number
  /** Every question that got past the player, in the order they were asked. */
  missed: MissedQuestion[]
  /**
   * The record as it stands *after* this run was written to the wall. `null`
   * only in the one frame before PlayScreen's effect has run, or if
   * localStorage is unavailable — the summary still reads correctly without
   * it, it just says less.
   */
  progress: Progress | null
  /** Start another run. Instant when the prefetched batch is already in hand. */
  onAgain: () => void
  /** Focused on mount so a keyboard player lands somewhere useful. */
  againRef?: React.Ref<HTMLButtonElement>
}

/**
 * A plain, un-gushing line about how the run went.
 *
 * None of these promise anything. An earlier version of the 4-out-of-10 line
 * read "the numbers below are the ones worth keeping" when there were no
 * numbers below it at all — the panel went straight to the streak counts. The
 * fix was both halves: this line stopped promising, and the misses the line
 * was describing are now genuinely printed underneath (see `.misses`).
 */
function verdictLine(correct: number, total: number): string {
  if (total === 0) return 'Nothing was asked.'
  const share = correct / total
  if (share === 1) return 'A clean sheet. Nothing got past you.'
  if (share >= 0.8) return 'A good run — the bench is satisfied.'
  if (share >= 0.5) return 'Passable. Half the floor gets no further than this.'
  if (share > 0) return 'A hard run.'
  return 'None of them this time.'
}

/**
 * The row from a question's verdict that belongs to the correct option.
 *
 * The generators build `verdict.rows` one per option, in the same order as
 * `options` — but that is their convention, not something the type enforces,
 * so this only trusts it when the two lengths actually agree and returns null
 * otherwise. A missing row costs a line of detail; a wrong row would state a
 * false fact, which this section exists to prevent.
 */
function answerRow(question: Question) {
  const { rows } = question.verdict
  if (rows.length !== question.options.length) return null
  return rows[question.answer] ?? null
}

/**
 * The end of ten: the score, a line on the streak, and the two ways out.
 *
 * The run has already been written to the wall by the time this renders —
 * PlayScreen owns that, so this component never writes anything and can be
 * rendered twice without double-counting.
 */
export function RunSummary({
  game,
  correct,
  total,
  missed,
  progress,
  onAgain,
  againRef,
}: RunSummaryProps) {
  const lifetime = progress ? lifetimeCorrect(progress) : null
  const grade = lifetime === null ? null : gradeFor(lifetime)
  const next = lifetime === null ? null : nextGrade(lifetime)

  return (
    <section className={styles.summary} aria-labelledby="atlas-run-summary-title">
      <div className={styles.summaryScore}>
        <span className="atlas-label">Run complete</span>
        <p className={styles.summaryFigure}>
          <span className={styles.summaryCorrect}>{correct}</span>
          <span className={styles.summaryOutOf}>/ {total}</span>
        </p>
        <h2 id="atlas-run-summary-title" className={styles.summaryVerdict}>
          {verdictLine(correct, total)}
        </h2>
      </div>

      <dl className={styles.summaryStats}>
        {progress && (
          <>
            <div className={styles.summaryStat}>
              <dt className="atlas-label">Streak now</dt>
              <dd className={styles.summaryStatValue}>
                {progress.currentStreak === 0
                  ? 'broken'
                  : `${progress.currentStreak} in a row`}
              </dd>
            </div>
            <div className={styles.summaryStat}>
              <dt className="atlas-label">Best ever</dt>
              <dd className={styles.summaryStatValue}>
                {progress.bestStreak === 0 ? '—' : `${progress.bestStreak} in a row`}
              </dd>
            </div>
            <div className={styles.summaryStat}>
              <dt className="atlas-label">Runs on this bench</dt>
              <dd className={styles.summaryStatValue}>{progress.games[game].plays}</dd>
            </div>
          </>
        )}
      </dl>

      {/* What got past you. The whole point of the section is that a wrong
          answer teaches something, and a summary that only scores you throws
          that away the moment the verdict panel scrolls off. Each miss is
          reprinted here with the truth, the real figure, the year it was
          measured, and the dossier it came from. */}
      {missed.length > 0 && (
        <section className={styles.misses} aria-labelledby="atlas-run-misses-title">
          <h3 id="atlas-run-misses-title" className="atlas-label">
            What got past you
          </h3>
          <ul className={styles.missList}>
            {missed.map(({ question, picked }) => {
              const row = answerRow(question)
              const chosen = question.options[picked]
              // Each game names its options differently — a forgery option is
              // a statement, a country is a name. One shape, read three ways.
              const chosenLabel =
                chosen === undefined
                  ? null
                  : 'text' in chosen
                    ? chosen.text
                    : chosen.name
              return (
                <li key={`miss-${question.id}`} className={styles.miss}>
                  <p className={styles.missPrompt}>{question.prompt}</p>
                  <p className={styles.missTruth}>{question.verdict.headline}</p>
                  {row && (
                    <p className={styles.missFigure}>
                      <span className={styles.missValue}>{row.value}</span>
                      {row.year && <span className={styles.missYear}>{row.year}</span>}
                    </p>
                  )}
                  {chosenLabel && (
                    <p className={styles.missChoice}>
                      You said: <span className={styles.missChoiceText}>{chosenLabel}</span>
                    </p>
                  )}
                  {row?.href && (
                    <Link href={row.href} className={styles.missLink}>
                      open the dossier →
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {grade && (
        <p className={styles.summaryGrade}>
          You are an <strong>{grade.name}</strong>
          {next && lifetime !== null
            ? ` — ${next.at - lifetime} more correct answers to ${next.name}.`
            : ' — the top of the ladder.'}
        </p>
      )}

      <div className={styles.summaryActions}>
        <button ref={againRef} type="button" className={styles.primaryAction} onClick={onAgain}>
          Run it again
        </button>
        <Link href="/atlas/learn" className={styles.secondaryAction}>
          Back to the floor
        </Link>
      </div>
    </section>
  )
}
