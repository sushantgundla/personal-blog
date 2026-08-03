'use client'

import Image from 'next/image'
import type { FlagQuestion as FlagQuestionData } from '@/lib/atlas/learn/types'
import styles from './play.module.css'

export interface FlagQuestionProps {
  question: FlagQuestionData
  picked: number | null
  disabled: boolean
  onPick: (index: number) => void
}

/**
 * One flag, four country names.
 *
 * The alt text is deliberately anonymous. Naming the country in `alt` would
 * hand the answer to every screen-reader user and to anyone who hovers the
 * image, which would make the question unanswerable-by-being-too-answerable.
 * The four option buttons carry the real, readable content.
 *
 * See ForgeryQuestion.tsx for why the src is guarded and unoptimized. Here
 * the guard also decides whether there is a question at all: PlayScreen only
 * ever gets flag questions whose `flagUrl` is a string, but if one ever
 * arrived malformed this renders a plain, honest placeholder rather than
 * crashing the run.
 */
export function FlagQuestion({ question, picked, disabled, onPick }: FlagQuestionProps) {
  const answered = picked !== null
  const flagOk = question.flagUrl.startsWith('https://')

  function stateOf(index: number): 'idle' | 'right' | 'wrong' {
    if (!answered) return 'idle'
    if (index === question.answer) return 'right'
    if (index === picked) return 'wrong'
    return 'idle'
  }

  return (
    <div className={styles.question}>
      <div className={styles.flagStage}>
        {flagOk ? (
          <Image
            src={question.flagUrl}
            alt="The flag you are being asked to identify"
            fill
            sizes="(max-width: 640px) 88vw, 30rem"
            className={styles.flagStageImg}
            priority
            unoptimized
          />
        ) : (
          <span className={styles.flagStageMissing}>This flag could not be printed.</span>
        )}
      </div>

      <p className={styles.prompt}>{question.prompt}</p>

      <ul className={styles.options} data-answered={answered} data-layout="grid">
        {question.options.map((option, i) => (
          <li key={`${question.id}-${option.iso3}`}>
            <button
              type="button"
              className={styles.option}
              data-state={stateOf(i)}
              data-picked={picked === i}
              disabled={disabled}
              onClick={() => onPick(i)}
            >
              <span className={styles.optionKey} aria-hidden="true">
                {i + 1}
              </span>
              <span className={styles.optionBody}>
                <span className={styles.optionText}>{option.name}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
