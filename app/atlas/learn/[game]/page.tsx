// One run of ten — §9 of
// docs/superpowers/specs/2026-08-03-atlas-learn-design.md.
//
// A thin server shell: it validates the game id, sets the title, prints the
// bench furniture that never changes, and hands the rest to PlayScreen,
// which owns all the state.
//
// The title goes through Next's Metadata API rather than a hand-written
// <title> in the tree. That is deliberate. A <title> built from several
// children (`<title>{a} — {b}</title>`) renders EMPTY on the server, and the
// hydration mismatch that follows has already, once, killed interactivity
// for a whole page on this site. The Metadata API only ever takes one
// string, so the trap cannot be re-entered here.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { GameId } from '@/lib/atlas/learn/types'
import { PlayScreen } from '../_components/PlayScreen'
import styles from '../_components/play.module.css'

interface GameCopy {
  id: GameId
  /** The engraved title at the top of the bench. */
  name: string
  /** One line telling the player what they are being asked to do. */
  instruction: string
  /** Shown once, above the first question — the bench's standing order. */
  house: string
}

const GAMES: Record<GameId, GameCopy> = {
  forgery: {
    id: 'forgery',
    name: 'Spot the forgery',
    instruction: 'Three statements about one country. One of them is fabricated.',
    house: 'Two of these numbers were printed from the record. One was invented. Reject the invention.',
  },
  'higher-lower': {
    id: 'higher-lower',
    name: 'Higher or lower',
    instruction: 'Two countries, one measure. Which is greater?',
    house: 'Greater, not better. The bench does not judge a number, it only weighs it.',
  },
  flags: {
    id: 'flags',
    name: 'Guess the flag',
    instruction: 'One flag, four countries. Name the issuer.',
    house: 'Every flag on this floor was drawn from the same plate as the dossiers.',
  },
}

function isGameId(value: string): value is GameId {
  return value === 'forgery' || value === 'higher-lower' || value === 'flags'
}

export function generateStaticParams() {
  return (Object.keys(GAMES) as GameId[]).map((game) => ({ game }))
}

export function generateMetadata({ params }: { params: { game: string } }): Metadata {
  if (!isGameId(params.game)) return {}
  const copy = GAMES[params.game]
  // One string. See the note at the top of this file.
  return {
    title: `${copy.name} — the training floor — The Atlas`,
    description: `${copy.instruction} Ten questions, drawn from the same data as every country dossier in The Atlas.`,
  }
}

export default function RunPage({ params }: { params: { game: string } }) {
  if (!isGameId(params.game)) notFound()
  const copy = GAMES[params.game]

  return (
    <div className={`${styles.run} atlas-fade-in`}>
      <div className={styles.runHead}>
        <Link href="/atlas/learn" className={styles.backLink}>
          ← Back to the floor
        </Link>
        <span className="atlas-serial" aria-hidden="true">
          BENCH {copy.id.toUpperCase().replace('-', '·')}
        </span>
      </div>

      <header className={styles.runTitle}>
        <h1 className={styles.runName}>{copy.name}</h1>
        <p className={styles.runInstruction}>{copy.instruction}</p>
      </header>

      <PlayScreen game={copy.id} houseRule={copy.house} />
    </div>
  )
}
