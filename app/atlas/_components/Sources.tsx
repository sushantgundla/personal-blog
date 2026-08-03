import type { CountryDossier } from '@/lib/atlas/types'
import type { IsoCountry } from '@/lib/atlas/iso-countries'
import styles from './dossier.module.css'

export interface SourcesProps {
  dossier: CountryDossier
  country: IsoCountry
}

/** Wikimedia image URLs encode the file name as the last path segment —
 * turn that into a link to the file's own Commons page, which is what
 * the licence actually requires crediting, not the raw asset URL. */
function commonsFilePage(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl)
    if (!url.hostname.endsWith('wikimedia.org')) return null
    const fileName = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? '')
    if (!fileName) return null
    return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName)}`
  } catch {
    return null
  }
}

/**
 * The mandatory attribution panel at the foot of every dossier — see
 * docs/atlas/design.md §3.7.
 * Every line is conditional on that source having actually succeeded for
 * this country: a dead source just means one fewer credit, never a
 * broken link or a claim the page can't back up.
 */
export function Sources({ dossier, country }: SourcesProps) {
  const wikipedia = dossier.wikipedia.ok ? dossier.wikipedia.data : null
  const worldBank = dossier.worldBank.ok ? dossier.worldBank.data : null
  const wikidata = dossier.wikidata.ok ? dossier.wikidata.data : null
  const portrait = dossier.famousPeople.ok
    ? dossier.famousPeople.data.find((p) => p.imageUrl) ?? null
    : null
  const portraitFilePage = portrait?.imageUrl ? commonsFilePage(portrait.imageUrl) : null

  return (
    <footer className={`atlas-note ${styles.sources}`}>
      <div className="atlas-label">Sources</div>
      <div className={styles.sourcesGrid}>
        {wikipedia && (
          <div className={styles.sourceItem}>
            <a
              href={wikipedia.canonicalUrl}
              className={styles.sourceLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Text: Wikipedia — {wikipedia.title}
            </a>
            <span className="atlas-serial">
              CC BY-SA 4.0
              {wikipedia.revisionTimestamp && ` · revised ${wikipedia.revisionTimestamp.slice(0, 10)}`}
            </span>
          </div>
        )}

        {worldBank && (
          <div className={styles.sourceItem}>
            <span className={styles.sourceLink}>Source: World Bank, World Development Indicators</span>
            <span className="atlas-serial">
              CC BY 4.0{worldBank.lastUpdated && ` · updated ${worldBank.lastUpdated}`}
            </span>
          </div>
        )}

        {wikidata && (
          <div className={styles.sourceItem}>
            <a
              href={`https://www.wikidata.org/wiki/${country.qid}`}
              className={styles.sourceLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Facts: Wikidata
            </a>
            <span className="atlas-serial">CC0 · as of {wikidata.asOf.slice(0, 10)}</span>
          </div>
        )}

        {portraitFilePage && (
          <div className={styles.sourceItem}>
            <a
              href={portraitFilePage}
              className={styles.sourceLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Image: Wikimedia Commons
            </a>
            <span className="atlas-serial">Portrait · {portrait?.name}</span>
          </div>
        )}

        {dossier.trade.ok && (
          <div className={styles.sourceItem}>
            <span className={styles.sourceLink}>Source: UN Comtrade</span>
          </div>
        )}

        {dossier.weather.ok && (
          <div className={styles.sourceItem}>
            <span className={styles.sourceLink}>Weather: Open-Meteo</span>
            <span className="atlas-serial">CC BY 4.0</span>
          </div>
        )}
      </div>
    </footer>
  )
}
