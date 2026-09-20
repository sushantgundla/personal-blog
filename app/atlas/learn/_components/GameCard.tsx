'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { GameId } from '@/lib/atlas/learn/types'
import { guillocheLayers } from '@/lib/atlas/guilloche'
import { countryInk } from '@/lib/atlas/ink'
import { readProgress } from '@/lib/atlas/learn/progress'
import styles from './floor.module.css'

export interface GameCardProps {
  game: GameId
  title: string
  /** One plain line on what the game asks. */
  line: string
  href: string
}

const ROSETTE_SIZE = 260

function hexToRgbString(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

/**
 * One game, as an engraved note.
 *
 * The rosette and the ink are seeded from the game id through exactly the
 * machinery every country note uses (`guillocheLayers`, `countryInk`) — which
 * is why every card on the floor carries a different, balanced
 * ornament without anyone drawing one.
 *
 * A client component only so it can show the visitor's record. The card
 * itself — title, line, link — is plain markup that server-renders and
 * works with JavaScript off; the record line simply stays empty in that
 * case. `readProgress` is called inside `useEffect`, never during render,
 * so the server HTML and the first client render agree.
 */
export function GameCard({ game, title, line, href }: GameCardProps) {
  const [record, setRecord] = useState<string | null>(null)

  useEffect(() => {
    const progress = readProgress()
    const stat = progress.games[game]
    if (stat.plays === 0 && stat.asked === 0) {
      setRecord('Not played yet')
      return
    }
    const runs = `${stat.plays} ${stat.plays === 1 ? 'run' : 'runs'}`
    setRecord(stat.asked > 0 ? `${runs} · ${stat.correct} of ${stat.asked} right` : runs)
  }, [game])

  const ink = countryInk(game)
  // Four concentric passes — bezel ticks, the rosette proper, a
  // counter-rotating inner rosette and a centre medallion. Each one's length
  // is already measured at ROSETTE_SIZE, so there is nothing to rescale here.
  const layers = guillocheLayers(game, { size: ROSETTE_SIZE })

  return (
    <Link
      href={href}
      className={`atlas-note ${styles.card}`}
      style={{
        ['--note-ink' as string]: ink.hex,
        ['--note-ink-rgb' as string]: hexToRgbString(ink.hex),
      }}
    >
      <svg
        viewBox={`0 0 ${ROSETTE_SIZE} ${ROSETTE_SIZE}`}
        aria-hidden="true"
        focusable="false"
        className={`atlas-guilloche ${styles.cardRosette}`}
      >
        {layers.map((layer) => (
          <path
            key={layer.index}
            d={layer.d}
            className="atlas-guilloche-path"
            style={{
              ['--atlas-dash-length' as string]: layer.length,
              ['--atlas-layer-index' as string]: layer.index,
              ['--atlas-layer-weight' as string]: layer.weight,
              ['--atlas-layer-opacity' as string]: layer.opacity,
              ['--atlas-layer-spin' as string]: layer.spin,
            }}
          />
        ))}
      </svg>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardLine}>{line}</p>
        <div className={styles.cardFoot}>
          <span className={`atlas-serial ${styles.cardRecord}`}>{record ?? ''}</span>
          <span className={styles.cardGo}>Play →</span>
        </div>
      </div>
    </Link>
  )
}
