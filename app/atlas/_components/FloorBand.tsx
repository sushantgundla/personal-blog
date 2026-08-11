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
 * His caption ("Five games. A grade to climb. A wall of your runs.") stays
 * put under the headline — it names the one thing the games row below
 * still doesn't, the wall of past runs — and Country of the day rides
 * alongside the grade in its own cluster on the right instead of replacing
 * it. Derived the same server-only way
 * app/atlas/learn/_components/CountryOfDayCard.tsx already does it:
 * `buildCountryOfDay` is a pure function of the UTC date, baked into this
 * page's own HTML, so there is no client-side `new Date()` to disagree with
 * it. It links straight to that country's own dossier note — the headline
 * above already covers "go to the floor", so this link's whole point is to
 * send the click somewhere specific instead. getDeck() memoises the file
 * read at module scope (see deck.ts), so calling it here costs nothing
 * extra beyond the first request of the process; app/atlas/learn/page.tsx
 * calling it too just reuses the same settled promise. See
 * app/atlas/page.tsx's own `revalidate` comment for why that number had to
 * drop once this landed.
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
            <p className={styles.floorBandSub}>Five games. A grade to climb. A wall of your runs.</p>
          </div>

          <div className={styles.floorBandMeta}>
            {/* Absent only if not one sovereign country in the whole deck
                clears the remarkable bar — the same rare failure
                CountryOfDayCard.tsx already treats as "omit the section". */}
            {countryOfDay && (
              <Link href={countryOfDay.href} className={styles.floorBandSubLink}>
                Country of the day —{' '}
                <span className={styles.floorBandSubName}>{countryOfDay.name}</span>{' '}
                <span aria-hidden="true">→</span>
              </Link>
            )}
            <FloorGradeChip />
          </div>
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
