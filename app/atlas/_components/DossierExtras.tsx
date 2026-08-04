import type { CountryDossier } from '@/lib/atlas/types'
import { AnthemPlayer } from './AnthemPlayer'
import { CapitalClock } from './CapitalClock'
import { LandmarkStrip } from './LandmarkStrip'
import { PeopleWatermarks } from './PeopleWatermarks'
import { HistoryStrip } from './HistoryStrip'
import { SizeOverlayLazy } from './SizeOverlayLazy'
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
          iso3={dossier.iso3}
        />
        <Neighbours neighbours={wikidata?.neighbours} countryName={dossier.name} />
        {/* wikidata is null when dossier.wikidata itself failed (SourceResult
            ok:false) — Neighbours' own `undefined` branch already covers
            that the same way it covers "field missing from an old snapshot",
            so no separate fallback branch is needed here. */}
      </div>

      <LandmarkStrip sites={wikidata?.unescoSites ?? []} countryName={dossier.name} />

      <PeopleWatermarks people={people} iso3={dossier.iso3} countryName={dossier.name} />

      <HistoryStrip independenceDate={wikidata?.independenceDate ?? null} countryName={dossier.name} />

      <SizeOverlayLazy iso3={dossier.iso3} countryName={dossier.name} />

      <YearSlider timeSeries={timeSeries} />
    </section>
  )
}
