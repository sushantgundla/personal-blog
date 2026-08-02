import Image from 'next/image'
import type { Person } from '@/lib/atlas/types'
import { guillochePath, guillocheLength } from '@/lib/atlas/guilloche'
import styles from './extras.module.css'

export interface PeopleWatermarksProps {
  people: readonly Person[]
  iso3: string
  countryName: string
}

/**
 * Famous people rendered as banknote watermarks: portraits at reduced
 * contrast on note paper, resolving to full contrast on hover, name
 * engraved beneath. Roughly 70 countries have few or no portraits, and
 * small states may return fewer than 12 people — where there is no
 * portrait, an engraved name plate with its own small guilloché flourish
 * (seeded from the person's own Q-id, so two portrait-less people never
 * look identical) fills the slot instead of a blank hole. A short or
 * empty list still needs to look composed, not like an error: the grid
 * just holds fewer tiles.
 */
/** build-people.mjs occasionally can't resolve an English label and falls
 * back to the raw Q-id as the name (e.g. "Q133707864") — filtering those
 * out here is a display choice, not a data fix, since a plate engraved
 * with a Wikidata ID instead of a name looks broken, not composed. */
function hasRealName(person: Person): boolean {
  return !/^Q\d+$/.test(person.name.trim())
}

/** Wikidata image properties are serialised as literal "http://" URLs even
 * though Commons is https-only — next/image's https-only remotePatterns
 * (next.config.js) 500s on the raw value. Confirmed live on /atlas/twn
 * (Chiang Kai-shek's portrait). Fixed locally rather than in
 * next.config.js or wikidata.ts, neither owned here. */
function toHttps(url: string): string {
  return url.startsWith('http://') ? `https://${url.slice(7)}` : url
}

export function PeopleWatermarks({ people, iso3, countryName }: PeopleWatermarksProps) {
  const named = people.filter(hasRealName)
  if (named.length === 0) {
    return (
      <div>
        <span className={`atlas-label ${styles.panelLabel}`}>People</span>
        <div className={styles.emptyState}>No notable people on file for {countryName} yet</div>
      </div>
    )
  }

  return (
    <div>
      <span className={`atlas-label ${styles.panelLabel}`}>People</span>
      <div className={styles.peopleGrid}>
        {named.map((person) => (
          <PersonCard key={person.qid} person={person} iso3={iso3} />
        ))}
      </div>
    </div>
  )
}

function PersonCard({ person, iso3 }: { person: Person; iso3: string }) {
  const dates = person.description
  const seed = `${iso3}:${person.qid}`
  const path = person.imageUrl ? null : guillochePath(seed, { size: 80 })
  const length = person.imageUrl ? 0 : guillocheLength(seed) * (80 / 200)

  return (
    <div className={styles.personCard}>
      {person.imageUrl ? (
        <div className={`atlas-watermark ${styles.personPortraitWrap}`}>
          <Image src={toHttps(person.imageUrl)} alt="" fill sizes="80px" className={styles.personPortraitImg} />
        </div>
      ) : (
        <svg viewBox="0 0 80 80" aria-hidden="true" className={`atlas-guilloche ${styles.personPlate}`}>
          <path
            d={path ?? ''}
            className="atlas-guilloche-path"
            style={{ ['--atlas-dash-length' as string]: length }}
          />
        </svg>
      )}
      <span className={styles.personName}>{person.name}</span>
      {dates && <span className={styles.personDates}>{dates}</span>}
    </div>
  )
}
