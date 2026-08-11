import Link from 'next/link'
import { GAME_IDS, GAME_LABELS } from '@/lib/atlas/learn/progress'
import { getDeck } from '@/lib/atlas/learn/deck'
import { buildCountryOfDay, utcDateStamp } from '@/lib/atlas/learn/questions/country-of-day'
import { FloorGradeChip } from './FloorGradeChip'
import styles from './plate.module.css'

/**
 * Redesigned 2026-08-11 — replaces .floorDoor (commit 77575ae), a card
 * pinned to the intro's top-right corner. The owner looked at that live and
 * said "cant see it": at roughly 330x70px, next to a full-bleed world map,
 * it read as furniture no matter how it was framed. This is a full-width
 * band instead, its own row in .page's flex column, directly under .intro
 * and above the map+rail — the map still leads, but this is unmissable as
 * the second thing on the page rather than competing for a corner of the
 * first.
 *
 * It also does what a locked chip never could: name what's actually behind
 * the door. GAME_IDS/GAME_LABELS come straight from
 * lib/atlas/learn/progress.ts — the same source of truth the wall and the
 * game cards use — so the five names printed here can't drift from the
 * real games. FloorGradeChip is one piece of live, localStorage-backed
 * content; see that file for why reading it is hydration-safe.
 *
 * The owner's brief was explicit that the band should also carry today's
 * Country of the day, not just the five games — a reason to look again
 * tomorrow, not a static door. Sub-line 2026-08-11: the old caption ("Five
 * games. A grade to climb. A wall of your runs.") went stale the moment the
 * five games were named as their own links below it, so that slot is now
 * the day's country instead — same size, same position, no extra row and
 * no extra height for .page's fixed viewport budget (see the comment on
 * .floorBand in plate.module.css). It links straight to that country's own
 * dossier note, not back to /atlas/learn — the headline above already
 * covers "go to the floor", so the country line's whole point is to send
 * the click somewhere specific instead.
 *
 * A server component, like the rest of /atlas's landing page: the pick for
 * today comes from buildCountryOfDay/utcDateStamp exactly the way
 * app/atlas/learn/_components/CountryOfDayCard.tsx derives its own, so
 * there is no client-side `new Date()` here either, and nothing that could
 * disagree with what the server already rendered. See app/atlas/page.tsx's
 * own `revalidate` comment for why that number had to drop once this landed.
 */
export async function FloorBand() {
  const deck = await getDeck()
  const countryOfDay = buildCountryOfDay(deck, utcDateStamp())

  return (
    <div className={styles.floorBand}>
      <span aria-hidden="true" className={`atlas-perforated-h ${styles.floorBandPerf}`} />

      <div className={styles.floorBandInner}>
        <div className={styles.floorBandTop}>
          <div className={styles.floorBandHead}>
            <Link href="/atlas/learn" className={styles.floorBandLead}>
              The training floor
              <span aria-hidden="true" className={styles.floorBandArrow}>
                →
              </span>
            </Link>
            {countryOfDay ? (
              <Link href={countryOfDay.href} className={styles.floorBandSubLink}>
                Country of the day —{' '}
                <span className={styles.floorBandSubName}>{countryOfDay.name}</span>{' '}
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <p className={styles.floorBandSub}>Five games. A grade to climb. A wall of your runs.</p>
            )}
          </div>

          <FloorGradeChip />
        </div>

        <nav className={styles.floorBandGames} aria-label="The five training-floor games">
          {GAME_IDS.map((id) => (
            <Link key={id} href={`/atlas/learn/${id}`} className={styles.floorBandGame}>
              {GAME_LABELS[id]}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
