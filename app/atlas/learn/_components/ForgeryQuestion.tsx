'use client'

import Image from 'next/image'
import type { ForgeryQuestion as ForgeryQuestionData } from '@/lib/atlas/learn/types'
import styles from './play.module.css'

export interface ForgeryQuestionProps {
  question: ForgeryQuestionData
  /** null until the player commits to one of the three statements. */
  picked: number | null
  disabled: boolean
  onPick: (index: number) => void
}

/**
 * Three statements about one country, one of them fabricated. The player
 * rejects the fake.
 *
 * The country's flag rides at the top as a small ring seal, the same way it
 * does on a dossier's face note — the statements are a ledger printed
 * underneath it.
 *
 * Note the flag guard below, repeated in every component here that renders
 * one: the deck already stores https PNG thumbnails, but next/image throws
 * on an SVG and refuses a bare http:// host, and both have taken this site
 * down before. One cheap startsWith is worth more than the argument.
 *
 * `unoptimized` for the same reason: scripts/atlas/build-deck.mjs already
 * writes a `?width=` Commons thumbnail, so there is nothing left to resize,
 * and a run deals a new set of flags every time — sending forty cache-miss
 * images per run through the optimizer would only add a visible stall to a
 * screen whose whole point is that it never makes you wait.
 */
export function ForgeryQuestion({ question, picked, disabled, onPick }: ForgeryQuestionProps) {
  const answered = picked !== null
  const flag = question.country.flagUrl
  const flagOk = typeof flag === 'string' && flag.startsWith('https://')

  // Long enough to run off the end of the widest option; the strip clips it.
  const microtext = `${question.country.iso3} · `.repeat(40)

  function stateOf(index: number): 'idle' | 'right' | 'wrong' {
    if (!answered) return 'idle'
    if (index === question.answer) return 'right'
    if (index === picked) return 'wrong'
    return 'idle'
  }

  return (
    <div className={styles.question}>
      <div className={styles.forgeryHead}>
        {flagOk && (
          <span className={styles.flagSeal}>
            <Image
              src={flag as string}
              alt=""
              fill
              sizes="56px"
              className={styles.flagSealImg}
              unoptimized
            />
          </span>
        )}
        <div className={styles.forgeryHeadText}>
          <span className="atlas-label">Country under inspection</span>
          <span className={styles.forgeryCountry}>{question.country.name}</span>
        </div>
      </div>

      <p className={styles.prompt}>{question.prompt}</p>

      <ul className={styles.options} data-answered={answered}>
        {question.options.map((option, i) => (
          <li key={`${question.id}-${i}`}>
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
                <span className={styles.optionText}>{option.text}</span>
                {/* Microprinting, not a caption. This used to print
                    `option.measure`, which is a word-for-word repeat of the
                    measure already at the front of `option.text` — the same
                    name twice, two lines apart, in two sizes. A real note
                    fills that space with repeated microtext instead, so that
                    is what goes here: the country's own code, over and over,
                    carrying no information at all and hidden from screen
                    readers. */}
                <span className={styles.optionMicrotext} aria-hidden="true">
                  {microtext}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
