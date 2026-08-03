import type { Metadata } from 'next'
import Link from 'next/link'
import type { GameId } from '@/lib/atlas/learn/types'
import { GameCard } from './_components/GameCard'
import { GradeSeal } from './_components/GradeSeal'
import { ResultsWall } from './_components/ResultsWall'
import { SurpriseCard } from './_components/SurpriseCard'
import styles from './_components/floor.module.css'

export const metadata: Metadata = {
  title: 'The training floor — The Atlas',
  description:
    'Be tested on the world instead of browsing it. Three games built from the same data as every country dossier: spot the forgery, higher or lower, guess the flag.',
}

/**
 * The three games, in the order the floor lays them out. The one-line
 * descriptions are the whole brief a visitor gets before they start — they
 * say what the game asks, in plain words, and nothing else.
 */
const GAMES: Array<{ id: GameId; title: string; line: string; href: string }> = [
  {
    id: 'forgery',
    title: 'Spot the forgery',
    line: 'Three statements about one country. Two are true, one was fabricated. Find the fake.',
    href: '/atlas/learn/forgery',
  },
  {
    id: 'higher-lower',
    title: 'Higher or lower',
    line: 'Two countries, one measure. Which of them is greater? Not which is better.',
    href: '/atlas/learn/higher-lower',
  },
  {
    id: 'flags',
    title: 'Guess the flag',
    line: 'One flag, four countries. Only one of them flies it.',
    href: '/atlas/learn/flags',
  },
]

/** Engraved marginalia under the title. Decorative, aria-hidden. */
const MARGINALIA = Array(12).fill('THE MINT · TRAINING FLOOR').join('  ·  ')

/**
 * The floor — the front door of the learning section.
 *
 * A server component on purpose: the framing, the four cards and the
 * section rules are all plain HTML that renders and reads with JavaScript
 * off. Only the three things that genuinely cannot be server-rendered are
 * client components — the grade seal and the wall, because the record lives
 * in the visitor's own browser, and the Surprise me card, because it
 * fetches on press.
 */
export default function LearnFloorPage() {
  return (
    <div className={`${styles.page} atlas-fade-in`}>
      <div className={styles.toolbar}>
        <Link href="/atlas" className={styles.backLink}>
          ← Back to the plate
        </Link>
      </div>

      <header className={styles.hero}>
        <h1 className={styles.title}>The training floor</h1>
        <p aria-hidden="true" className={`atlas-microtext ${styles.microStrip}`}>
          {MARGINALIA}
        </p>
        <p className={styles.framing}>
          You are an apprentice at the mint, and this is where you are tested. Three games, ten
          questions a run, a grade you climb. <strong>Every question is built from the same data
          as the country dossiers</strong> — the same World Bank measures, the same years, the
          same flags — so a wrong answer always comes with the real numbers and a way through to
          the note it came from.
        </p>
      </header>

      <GradeSeal />

      <div className="atlas-section-rule">The games</div>

      <div className={styles.grid}>
        {GAMES.map((game) => (
          <GameCard
            key={game.id}
            game={game.id}
            title={game.title}
            line={game.line}
            href={game.href}
          />
        ))}
        <SurpriseCard />
      </div>

      <div className="atlas-section-rule">The wall</div>

      <ResultsWall />
    </div>
  )
}
