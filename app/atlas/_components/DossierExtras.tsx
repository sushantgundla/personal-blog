import type { CountryDossier } from '@/lib/atlas/types'
import { BY_ISO3 } from '@/lib/atlas/iso-countries'
import { AnthemPlayer } from './AnthemPlayer'
import { CapitalClock } from './CapitalClock'
import { LandmarkStrip } from './LandmarkStrip'
import { PeopleWatermarks } from './PeopleWatermarks'
import { HistoryStrip } from './HistoryStrip'
import { SizeOverlay } from './SizeOverlay'
import { Neighbours } from './Neighbours'
import { YearSlider } from './YearSlider'
import styles from './extras.module.css'

export interface DossierExtrasProps {
  dossier: CountryDossier
}

/**
 * The "sights and sounds" of the dossier — spec §4.2 points 6-10: history,
 * famous people, the anthem, capital clock, landmarks, a size comparison,
 * neighbours, and a year slider over the time series. Composes eight
 * independent panels, each already designed to degrade to its own empty
 * state when its own slice of data is missing, so this component itself
 * never branches on "is the data good" — it just wires facts through.
 *
 * Takes the whole CountryDossier (not individually-destructured props) so
 * the composition point stays a one-line change if a future panel needs
 * another field — the caller (the dossier page, owned elsewhere) only
 * ever has to pass `dossier`.
 */
export function DossierExtras({ dossier }: DossierExtrasProps) {
  const wikidata = dossier.wikidata.ok ? dossier.wikidata.data : null
  const people = dossier.famousPeople.ok ? dossier.famousPeople.data : []
  const timeSeries = dossier.timeSeries.ok ? dossier.timeSeries.data : []
  // CountryDossier carries iso3/iso2/name but not the Wikidata Q-id —
  // Neighbours needs it and nothing else here does. Derived from the same
  // local ISO join table every other source keys off of, rather than
  // widening CountryDossier's shape (a type this component does not own).
  const qid = BY_ISO3[dossier.iso3]?.qid ?? ''

  return (
    <section className={styles.extrasSection} aria-label="Extras">
      <div className="atlas-section-rule" style={{ color: 'var(--note-ink)' }}>
        — EXTRAS —
      </div>

      <div className={styles.utilityRow}>
        <AnthemPlayer
          anthemName={wikidata?.anthemName ?? null}
          anthemAudioUrl={wikidata?.anthemAudioUrl ?? null}
          countryName={dossier.name}
        />
        <CapitalClock
          capital={wikidata?.capital ?? null}
          coordinates={wikidata?.capitalCoordinates ?? null}
        />
        {qid ? (
          // Server component with its own data fetch — see Neighbours.tsx.
          <Neighbours qid={qid} countryName={dossier.name} />
        ) : (
          <div className={styles.utilityNote}>
            <span className="atlas-label">Neighbours</span>
            <div className={styles.emptyState}>Neighbour data unavailable right now</div>
          </div>
        )}
      </div>

      <LandmarkStrip sites={wikidata?.unescoSites ?? []} countryName={dossier.name} />

      <PeopleWatermarks people={people} iso3={dossier.iso3} countryName={dossier.name} />

      <HistoryStrip independenceDate={wikidata?.independenceDate ?? null} countryName={dossier.name} />

      <SizeOverlay iso3={dossier.iso3} countryName={dossier.name} />

      <YearSlider timeSeries={timeSeries} />
    </section>
  )
}
