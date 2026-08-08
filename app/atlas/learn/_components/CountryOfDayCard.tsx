import Link from 'next/link'
import { getDeck } from '@/lib/atlas/learn/deck'
import { buildCountryOfDay, utcDateStamp } from '@/lib/atlas/learn/questions/country-of-day'
import { guillochePath, guillocheLength } from '@/lib/atlas/guilloche'
import { countryInk } from '@/lib/atlas/ink'
import styles from './country-of-day.module.css'

const ROSETTE_SIZE = 260

function hexToRgbString(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

/**
 * "COUNTRY OF THE DAY · 2026-08-08" reads as a printed date, not code —
 * this only changes the separators, never the calendar math.
 */
function printedDate(iso: string): string {
  return iso.replaceAll('-', ' · ')
}

/**
 * One country, the same for everyone, changing daily — the front door's
 * sibling to "Surprise me" (./SurpriseCard.tsx), not a game.
 *
 * A plain **server** component, deliberately, and the only thing that makes
 * this feature's date-handling safe: the pick is computed once, here, on the
 * server, from `utcDateStamp()`, and the result is baked straight into the
 * HTML this component returns. Nothing under this component ever calls
 * `new Date()` again — there is no client-side re-check of "today" that
 * could disagree with what the server already decided, so there is no
 * hydration mismatch to guard against in the first place. Compare
 * SurpriseCard.tsx, which genuinely needs a client component because it
 * fetches a fresh card on press; this one has nothing to press.
 *
 * How the day actually rolls over: this page sets `export const revalidate`
 * (see ../page.tsx) rather than rendering fully static, so Next.js
 * regenerates the page on that schedule instead of freezing today's pick at
 * build time forever.
 */
export async function CountryOfDayCard() {
  const deck = await getDeck()
  const date = utcDateStamp()
  const card = buildCountryOfDay(deck, date)

  // Only unreachable if the whole deck has nothing remarkable in it — the
  // same failure buildSurprise() treats as fatal. Here the floor simply
  // omits the section rather than throwing, since the rest of the page is
  // still perfectly usable without it.
  if (!card) return null

  const ink = countryInk(card.iso3)
  const path = guillochePath(card.iso3, { size: ROSETTE_SIZE })
  // guillocheLength assumes the 200x200 default sampling — scale it for the
  // size actually rendered (see lib/atlas/guilloche.ts).
  const length = guillocheLength(card.iso3) * (ROSETTE_SIZE / 200)

  return (
    <section
      className={`atlas-note ${styles.note}`}
      aria-label={`Country of the day — ${card.name}`}
      style={{
        ['--note-ink' as string]: ink.hex,
        ['--note-ink-rgb' as string]: hexToRgbString(ink.hex),
      }}
    >
      <svg
        viewBox={`0 0 ${ROSETTE_SIZE} ${ROSETTE_SIZE}`}
        aria-hidden="true"
        focusable="false"
        className={`atlas-guilloche ${styles.rosette}`}
      >
        <path
          d={path}
          className="atlas-guilloche-path"
          style={{ ['--atlas-dash-length' as string]: length }}
        />
      </svg>

      <div className={styles.body}>
        <div className={styles.top}>
          <span className="atlas-serial">Country of the day</span>
          <span className="atlas-serial">{printedDate(card.date)}</span>
        </div>

        <div className={styles.head}>
          {card.flagUrl && (
            <span className={`atlas-ornament ${styles.flag}`}>
              {/* Plain <img>, like every other flag on this floor: these are
                  Commons thumbnails behind a redirect chain that
                  next/image's optimizer handles inconsistently. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.flagUrl} alt="" className={styles.flagImg} />
            </span>
          )}
          <h3 className={styles.name}>{card.name}</h3>
        </div>

        <ul className={styles.facts}>
          {card.facts.map((fact, i) => (
            <li key={i} className={styles.fact}>
              <p className={styles.factHeadline}>{fact.headline}</p>
              <p className={styles.factDetail}>
                {fact.detail}
                <span className={styles.factSource}>
                  {' '}
                  · {fact.provenance.source}
                  {fact.provenance.year ? ` · ${fact.provenance.year}` : ''}
                </span>
              </p>
            </li>
          ))}
        </ul>

        <div className={styles.foot}>
          <Link href={card.href} className={styles.link}>
            Open {card.name}&rsquo;s note →
          </Link>
        </div>
      </div>
    </section>
  )
}
