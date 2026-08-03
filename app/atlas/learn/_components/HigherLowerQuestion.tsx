'use client'

import Image from 'next/image'
import type { HigherLowerQuestion as HigherLowerQuestionData } from '@/lib/atlas/learn/types'
import styles from './play.module.css'

export interface HigherLowerQuestionProps {
  question: HigherLowerQuestionData
  picked: number | null
  disabled: boolean
  onPick: (index: number) => void
}

/**
 * Two countries, one measure, which is greater. Never "which is better" —
 * `higherIsBetter` is deliberately absent from the wording here and from the
 * generator, because a measure being good or bad is a judgement the bench
 * does not make.
 *
 * The two plates sit side by side with a scale mark between them, and stack
 * on a narrow screen. See ForgeryQuestion.tsx for why the flag src is
 * guarded and unoptimized.
 */
export function HigherLowerQuestion({
  question,
  picked,
  disabled,
  onPick,
}: HigherLowerQuestionProps) {
  const answered = picked !== null

  function stateOf(index: number): 'idle' | 'right' | 'wrong' {
    if (!answered) return 'idle'
    if (index === question.answer) return 'right'
    if (index === picked) return 'wrong'
    return 'idle'
  }

  return (
    <div className={styles.question}>
      {/* No separate "the measure" header here, deliberately. `prompt`
          already opens with the measure's name ("Military spending — which
          country is greater?"), and printing it twice, two lines apart, in
          two different sizes just reads as a mistake. */}
      <p className={styles.prompt}>{question.prompt}</p>

      <ul className={styles.options} data-answered={answered} data-layout="pair">
        {question.options.map((option, i) => {
          const flag = option.flagUrl
          const flagOk = typeof flag === 'string' && flag.startsWith('https://')
          return (
            <li key={`${question.id}-${option.iso3}`}>
              <button
                type="button"
                className={`${styles.option} ${styles.optionPlate}`}
                data-state={stateOf(i)}
                data-picked={picked === i}
                disabled={disabled}
                onClick={() => onPick(i)}
              >
                <span className={styles.optionKey} aria-hidden="true">
                  {i + 1}
                </span>
                {flagOk ? (
                  <span className={styles.plateFlag}>
                    <Image
                      src={flag as string}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 60vw, 224px"
                      className={styles.plateFlagImg}
                      // Only two per question, and they are the question.
                      // Without this they stayed blank boxes for seconds
                      // while the Commons redirect resolved. The box itself
                      // is reserved by .plateFlag's aspect-ratio, so the
                      // layout never moves either way — this only shortens
                      // the wait.
                      priority
                      unoptimized
                    />
                  </span>
                ) : (
                  <span className={styles.plateFlagFallback} aria-hidden="true">
                    {option.iso3}
                  </span>
                )}
                <span className={styles.plateName}>{option.name}</span>
                <span className="atlas-serial">{option.iso3}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
