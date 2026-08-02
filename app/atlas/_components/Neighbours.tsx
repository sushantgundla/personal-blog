import Image from 'next/image'
import type { NeighbourCountry } from '@/lib/atlas/types'
import { toHttps } from '@/lib/atlas/format'
import styles from './extras.module.css'

export interface NeighboursProps {
  /**
   * `dossier.wikidata.data.neighbours` — see NeighbourCountry's doc comment
   * on WikidataFacts (lib/atlas/types.ts) for why this is three states, not
   * two: `undefined` (the field is missing entirely — a dossier snapshot
   * written before 2026-08-03, not yet refreshed), an empty array (fetched
   * fine, this country genuinely has none — most islands), or a populated
   * array. Each renders its own distinct message below.
   */
  neighbours: NeighbourCountry[] | undefined
  countryName: string
}

/**
 * One-click hops to bordering countries, sourced from Wikidata P47.
 *
 * Fixed 2026-08-03: this used to run its own live SPARQL query per country,
 * deliberately outside lib/atlas/sources/wikidata.ts — which meant it never
 * landed in the committed snapshot and stayed slow (52s cold, measured on
 * Peru) even once every other panel was instant. The fetch now lives in
 * wikidata.ts's fetchDossierFacts (so it's captured once per country, same
 * as everything else), and this component just renders what it's handed —
 * no fetch, no async, no network at all.
 */
export function Neighbours({ neighbours, countryName }: NeighboursProps) {
  if (!neighbours) {
    return (
      <div className={styles.utilityNote}>
        <span className="atlas-label">Neighbours</span>
        <div className={styles.emptyState}>Neighbour data unavailable right now</div>
      </div>
    )
  }

  if (neighbours.length === 0) {
    return (
      <div className={styles.utilityNote}>
        <span className="atlas-label">Neighbours</span>
        <div className={styles.emptyState}>{countryName} has no land borders</div>
      </div>
    )
  }

  return (
    <div className={styles.utilityNote}>
      <span className="atlas-label">Neighbours</span>
      <div className={styles.neighboursRow}>
        {neighbours.map((n) => (
          <a key={n.iso3} href={`/atlas/${n.iso3.toLowerCase()}`} className={styles.neighbourSeal}>
            {n.flagImageUrl ? (
              <span className={styles.neighbourFlag}>
                <Image src={toHttps(n.flagImageUrl)} alt="" fill sizes="18px" className={styles.neighbourFlagImg} />
              </span>
            ) : (
              <span className={styles.neighbourFlagFallback} aria-hidden="true">
                {n.iso3.slice(0, 2)}
              </span>
            )}
            <span className={styles.neighbourName}>{n.name}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
