'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { GameId, Question, Round } from '@/lib/atlas/learn/types'
import { recordAnswer, recordRun, type Progress } from '@/lib/atlas/learn/progress'
import { ForgeryQuestion } from './ForgeryQuestion'
import { HigherLowerQuestion } from './HigherLowerQuestion'
import { FlagQuestion } from './FlagQuestion'
import { Verdict } from './Verdict'
import { RunSummary } from './RunSummary'
import styles from './play.module.css'

export interface PlayScreenProps {
  game: GameId
  /** The bench's standing order, printed once above the first question. */
  houseRule: string
}

/** A run is ten. Also the batch size the route is asked for. */
const RUN_LENGTH = 10

/**
 * Zero-based index at which the next batch is fetched. The player is on
 * question 7 of 10, with three left to play, which is far more time than the
 * request needs — so "run it again" at the end is instant and the only wait
 * in the whole section is the very first one.
 */
const PREFETCH_AT = 6

type Phase = 'loading' | 'asking' | 'answered' | 'summary' | 'error'

async function fetchRound(game: GameId, signal: AbortSignal): Promise<Round> {
  const res = await fetch(`/atlas/learn/api/round?game=${encodeURIComponent(game)}&count=${RUN_LENGTH}`, {
    signal,
    cache: 'no-store',
  })
  if (!res.ok) {
    // The route always answers with { error } on a failure, but a proxy or a
    // cold function can return something else entirely — never assume.
    let message = `The bench could not deal a round (${res.status}).`
    try {
      const body: unknown = await res.json()
      if (body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string') {
        message = (body as { error: string }).error
      }
    } catch {
      /* keep the status-code message */
    }
    throw new Error(message)
  }
  return (await res.json()) as Round
}

/**
 * The run: one client state machine over
 * `loading -> asking -> answered -> ... -> summary`, plus `error`.
 *
 * Three things this owns that nothing else does:
 *
 *  1. **The prefetch.** The next batch is requested at question 7 so it is
 *     already in hand when the player hits "run it again".
 *  2. **The keyboard.** 1-4 pick, Enter moves on, Esc leaves. None of that is
 *     load-bearing: every option is a real <button>, so Tab and Space have
 *     always worked and would still work with this effect deleted.
 *  3. **The record.** `recordAnswer` fires once per answered question and
 *     `recordRun` once at the end, both from event handlers rather than
 *     effects — an effect would double-count under React's development
 *     double-invoke, and a phantom extra run on the wall is the kind of bug
 *     nobody reports and everybody notices.
 */
export function PlayScreen({ game, houseRule }: PlayScreenProps) {
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [roundId, setRoundId] = useState<string>('')
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  /** One entry per answered question, in order. Its length is the score line. */
  const [results, setResults] = useState<boolean[]>([])
  /** Which option was chosen for each answered question, same order as
   *  `results`. Kept so the summary can show what got past the player, not
   *  just how many did. */
  const [picks, setPicks] = useState<number[]>([])
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [progress, setProgress] = useState<Progress | null>(null)

  /** The batch fetched at question 7, waiting for "run it again". */
  const nextRoundRef = useRef<Round | null>(null)
  const prefetchingRef = useRef(false)
  const continueRef = useRef<HTMLButtonElement>(null)
  const againRef = useRef<HTMLButtonElement>(null)
  /** The visible request — the one the loading state belongs to. */
  const abortRef = useRef<AbortController | null>(null)
  /** The background prefetch. Held separately so it is never cancelled by
   *  anything except leaving the page. */
  const prefetchAbortRef = useRef<AbortController | null>(null)

  const total = questions.length || RUN_LENGTH
  const correctCount = results.filter(Boolean).length
  const current: Question | undefined = questions[index]

  /** The questions that got past the player, with what they chose. The
   *  summary reprints these in full — the score is the least interesting
   *  thing about a run. */
  const missed = questions
    .map((question, i) => ({ question, picked: picks[i] ?? -1 }))
    .filter((_, i) => results[i] === false)

  const beginRound = useCallback((round: Round) => {
    nextRoundRef.current = null
    setQuestions(round.questions.slice(0, RUN_LENGTH))
    setRoundId(round.roundId)
    setIndex(0)
    setPicked(null)
    setResults([])
    setPicks([])
    setErrorMessage('')
    setPhase('asking')
    prefetchingRef.current = false
  }, [])

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setPhase('loading')
    setErrorMessage('')
    try {
      const round = await fetchRound(game, controller.signal)
      if (controller.signal.aborted) return
      beginRound(round)
    } catch (err) {
      if (controller.signal.aborted) return
      setErrorMessage(err instanceof Error ? err.message : 'The bench could not deal a round.')
      setPhase('error')
    }
  }, [game, beginRound])

  // First batch, on mount. Abort on unmount so a fast Esc out of the run
  // doesn't leave a request updating state on a screen that has gone.
  useEffect(() => {
    void load()
    return () => abortRef.current?.abort()
  }, [load])

  // The overlap: fire the next batch while the player still has three
  // questions in front of them. Failures here are silent on purpose — the
  // current run is unaffected, and "run it again" simply falls back to a
  // fresh fetch with its own visible loading state.
  //
  // Two things this deliberately does NOT do. It does not depend on `phase`,
  // and it does not abort on cleanup. An earlier version did both, and the
  // effect then re-ran on every answer and every question after the seventh,
  // cancelling its own in-flight request and starting a new one each time —
  // up to eight requests for one prefetch. The refs are the guard; the only
  // thing that cancels this is leaving the page.
  useEffect(() => {
    if (index < PREFETCH_AT) return
    if (nextRoundRef.current || prefetchingRef.current) return
    prefetchingRef.current = true
    const controller = new AbortController()
    prefetchAbortRef.current = controller
    fetchRound(game, controller.signal)
      .then((round) => {
        nextRoundRef.current = round
      })
      .catch(() => {
        prefetchingRef.current = false
      })
  }, [index, game])

  useEffect(() => () => prefetchAbortRef.current?.abort(), [])

  const pick = useCallback(
    (choice: number) => {
      if (phase !== 'asking' || !current) return
      if (choice < 0 || choice >= current.options.length) return
      const right = choice === current.answer
      setPicked(choice)
      setResults((prev) => [...prev, right])
      setPicks((prev) => [...prev, choice])
      setPhase('answered')
      setProgress(recordAnswer(game, right))
    },
    [phase, current, game]
  )

  const advance = useCallback(() => {
    if (phase !== 'answered') return
    if (index + 1 < questions.length) {
      setIndex(index + 1)
      setPicked(null)
      setPhase('asking')
      return
    }
    // End of the ten: hang the run on the wall, once.
    setProgress(recordRun(game, results.filter(Boolean).length, questions.length))
    setPhase('summary')
  }, [phase, index, questions.length, results, game])

  const again = useCallback(() => {
    const ready = nextRoundRef.current
    nextRoundRef.current = null
    if (ready) {
      beginRound(ready)
      return
    }
    void load()
  }, [beginRound, load])

  const leave = useCallback(() => {
    router.push('/atlas/learn')
  }, [router])

  // Keyboard. Deliberately a window listener rather than per-button handlers:
  // 1-4 have to work without first tabbing to anything.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const active = document.activeElement as HTMLElement | null
      const tag = active?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || active?.isContentEditable) return

      if (event.key === 'Escape') {
        event.preventDefault()
        leave()
        return
      }

      if (phase === 'asking' && current) {
        const n = Number.parseInt(event.key, 10)
        if (Number.isInteger(n) && n >= 1 && n <= Math.min(current.options.length, 9)) {
          event.preventDefault()
          pick(n - 1)
        }
        return
      }

      if (phase === 'answered' && event.key === 'Enter') {
        // A focused button or link fires its own click on Enter. Handling it
        // here too would advance twice and skip a question.
        if (tag === 'BUTTON' || tag === 'A') return
        event.preventDefault()
        advance()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, current, pick, advance, leave])

  // Put the keyboard somewhere useful the moment the state changes: on the
  // continue button after an answer, on "run it again" at the end. The ring
  // only shows for :focus-visible, so a mouse player sees nothing.
  useEffect(() => {
    if (phase === 'answered') continueRef.current?.focus()
    if (phase === 'summary') againRef.current?.focus()
  }, [phase, index])

  if (phase === 'loading') {
    return (
      <div className={styles.state} role="status">
        <span className={`atlas-label atlas-loading-pulse ${styles.stateLabel}`}>
          Dealing the cards…
        </span>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className={styles.state} role="alert">
        <span className="atlas-label">The bench is closed</span>
        <p className={styles.stateBody}>{errorMessage}</p>
        <div className={styles.summaryActions}>
          <button type="button" className={styles.primaryAction} onClick={() => void load()}>
            Try again
          </button>
          <Link href="/atlas/learn" className={styles.secondaryAction}>
            Back to the floor
          </Link>
        </div>
      </div>
    )
  }

  if (phase === 'summary') {
    return (
      <RunSummary
        game={game}
        correct={correctCount}
        total={questions.length}
        missed={missed}
        progress={progress}
        onAgain={again}
        againRef={againRef}
      />
    )
  }

  // 'asking' or 'answered'. `current` is always present here — questions is
  // non-empty (the route rejects an empty round) and `index` never runs past
  // its end — but the guard keeps TypeScript honest and means a future bug
  // shows a sentence rather than a blank screen.
  if (!current) {
    return (
      <div className={styles.state} role="alert">
        <p className={styles.stateBody}>That question could not be printed.</p>
      </div>
    )
  }

  const answered = phase === 'answered'
  const isLast = index + 1 >= questions.length

  return (
    <div className={styles.bench}>
      <div className={styles.rail}>
        <p className={styles.railCount}>
          Question <strong>{index + 1}</strong> of {total}
          <span className={styles.railScore}>
            {correctCount} right so far
          </span>
        </p>

        {/* The perforation strip: one punched mark per question. Decorative
            — the line above carries the same facts as text. */}
        <ol className={styles.marks} aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <li
              key={`mark-${i}`}
              className={styles.mark}
              data-mark={
                i < results.length ? (results[i] ? 'right' : 'wrong') : i === index ? 'current' : 'pending'
              }
            />
          ))}
        </ol>

        <span className={`atlas-serial ${styles.railSerial}`} aria-hidden="true">
          RUN {roundId ? roundId.slice(0, 10).toUpperCase() : '—'}
        </span>
      </div>

      {index === 0 && !answered && <p className={styles.houseRule}>{houseRule}</p>}

      <article className={`atlas-note atlas-perforated ${styles.card}`}>
        {current.game === 'forgery' && (
          <ForgeryQuestion question={current} picked={picked} disabled={answered} onPick={pick} />
        )}
        {current.game === 'higher-lower' && (
          <HigherLowerQuestion question={current} picked={picked} disabled={answered} onPick={pick} />
        )}
        {current.game === 'flags' && (
          <FlagQuestion question={current} picked={picked} disabled={answered} onPick={pick} />
        )}
      </article>

      {answered && picked !== null && <Verdict question={current} picked={picked} />}

      <div className={styles.benchFoot}>
        {answered ? (
          <button ref={continueRef} type="button" className={styles.primaryAction} onClick={advance}>
            {isLast ? 'See the run' : 'Next question'}
          </button>
        ) : (
          <span className={styles.hint} aria-hidden="true">
            press 1–{Math.min(current.options.length, 9)} to answer
          </span>
        )}
        <span className={styles.hint} aria-hidden="true">
          {answered ? 'enter to continue · esc to leave' : 'esc to leave'}
        </span>
      </div>
    </div>
  )
}
