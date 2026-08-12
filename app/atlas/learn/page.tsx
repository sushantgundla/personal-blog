import type { Metadata } from 'next'
import Link from 'next/link'
import type { GameId } from '@/lib/atlas/learn/types'
import { CountryOfDayCard } from './_components/CountryOfDayCard'
import { GameCard } from './_components/GameCard'
import { GradeSeal } from './_components/GradeSeal'
import { ResultsWall } from './_components/ResultsWall'
import { SurpriseCard } from './_components/SurpriseCard'
import { TourReplayLink } from '../_components/tour/TourReplayLink'
import styles from './_components/floor.module.css'

export const metadata: Metadata = {
  title: 'The training floor — The Atlas',
  description:
    'Be tested on the world instead of browsing it. Five games built from the same data as every country dossier: guess the country, guess the flag, where in the world, spot the forgery, higher or lower.',
}

// Country of the day changes at UTC midnight (lib/atlas/learn/questions/
// country-of-day.ts derives the pick from the calendar date), so this page
// cannot render fully static — a build-time render would freeze one
// country's pick forever until the next deploy. An hour is frequent enough
// that the floor picks up the new day within an hour of the rollover
// without going all the way to force-dynamic, which nothing else on this
// page needs. Matches the pattern app/atlas/page.tsx already uses for its
// own revalidate window, just on a much shorter cadence because this data
// changes daily rather than a few times a year.
export const revalidate = 3600

/**
 * The five games, in the order the floor lays them out: guess the country,
 * guess the flag, where in the world, spot the forgery, higher or lower. The
 * one-line descriptions are the whole brief a visitor gets before they start
 * — they say what the game asks, in plain words, and nothing else.
 *
 * That order is best-first, set 2026-08-13 by the owner after playing all
 * five, replacing the build order they had shipped in. It must match
 * `GAME_IDS` in lib/atlas/learn/progress.ts, which lays out the same five on
 * the plate's floor band and explains why reordering is safe for anyone's
 * saved progress.
 */
const GAMES: Array<{ id: GameId; title: string; line: string; href: string }> = [
  {
    id: 'guess-country',
    title: 'Guess the country',
    line: 'Clues arrive one at a time, vaguest first. Name it early — every extra clue costs you.',
    href: '/atlas/learn/guess-country',
  },
  {
    id: 'flags',
    title: 'Guess the flag',
    line: 'One flag, four countries. Only one of them flies it.',
    href: '/atlas/learn/flags',
  },
  {
    id: 'where-in-the-world',
    title: 'Where in the world',
    line: 'Named a country. Click its shape on the map — no list of names to fall back on.',
    href: '/atlas/learn/where-in-the-world',
  },
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
]

/** Engraved marginalia under the title. Decorative, aria-hidden. */
const MARGINALIA = Array(12).fill('THE MINT · TRAINING FLOOR').join('  ·  ')

/**
 * The floor — the front door of the learning section.
 *
 * A server component on purpose: the framing, the five cards and the
 * section rules are all plain HTML that renders and reads with JavaScript
 * off. Only the three things that genuinely cannot be server-rendered are
 * client components — the grade seal and the wall, because the record lives
 * in the visitor's own browser, and the Surprise me card, because it
 * fetches on press. Country of the day (async, below) stays server-rendered
 * too — see CountryOfDayCard.tsx for why that is what keeps its date
 * handling honest.
 */
export default async function LearnFloorPage() {
  return (
    <div className={`${styles.page} atlas-fade-in`}>
      {/* .toolbar was already `justify-content: space-between` with a single
          child, which did nothing; the replay button is the second child it
          was waiting for, so the back link stays hard left and this sits hard
          right, and .toolbar needed no change. .backLink is the right class
          to borrow: the "←" is literal text in the JSX above, not something
          the class draws, so the button gets the row's mono/uppercase
          treatment and its focus ring without also inheriting an arrow. */}
      <div className={styles.toolbar}>
        <Link href="/atlas" className={styles.backLink}>
          ← Back to the plate
        </Link>
        <TourReplayLink className={styles.backLink} />
      </div>

      <header className={styles.hero}>
        <h1 className={styles.title}>The training floor</h1>
        <p aria-hidden="true" className={`atlas-microtext ${styles.microStrip}`}>
          {MARGINALIA}
        </p>
        <p className={styles.framing}>
          You are an apprentice at the mint, and this is where you are tested. Five games, ten
          questions a run, a grade you climb. <strong>Every question is built from the same data
          as the country dossiers</strong> — the same World Bank measures, the same years, the
          same flags — so a wrong answer always comes with the real numbers and a way through to
          the note it came from.
        </p>
      </header>

      {/* The three .tourWrap boxes below exist only so the guided tour has
          something to spotlight. GradeSeal, CountryOfDayCard and ResultsWall
          are components, not elements, so there is nowhere else to hang a
          `data-tour` attribute without editing them. The class is a no-op
          for layout — see floor.module.css for why it is a flex column and
          not `display: contents`. The games grid needs no wrapper: .grid is
          already a real element. */}
      <div className={styles.tourWrap} data-tour="grade">
        <GradeSeal />
      </div>

      <div className="atlas-section-rule">Country of the day</div>

      <div className={styles.tourWrap} data-tour="cotd">
        <CountryOfDayCard />
      </div>

      <div className="atlas-section-rule">The games</div>

      <div className={styles.grid} data-tour="games">
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

      <div className={styles.tourWrap} data-tour="wall">
        <ResultsWall />
      </div>
    </div>
  )
}
