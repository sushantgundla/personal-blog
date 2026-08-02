import type { SourceResult, WikipediaSummary } from '@/lib/atlas/types'
import styles from './story.module.css'

export interface CountryStoryProps {
  wikipedia: SourceResult<WikipediaSummary>
  countryName: string
}

/**
 * Feature 19 (spec §4.2.1 / checklist row 19) — "what the country actually
 * is", read before any of its hundreds of numbers. The Wikipedia summary
 * was already being fetched for every dossier (lib/atlas/sources/wikipedia.ts)
 * but until now only HistoryStrip's caller ever touched `dossier.wikipedia`;
 * the description and intro paragraph themselves were never rendered
 * anywhere. This is the first note after the face note, on purpose — a
 * banknote's obverse names what it is before it starts counting.
 *
 * CC BY-SA 4.0 requires attribution with a link and the licence name next
 * to the content it covers, not just once in the page-wide Sources panel
 * at the foot of the dossier — that's a licence condition, not a nicety.
 */
export function CountryStory({ wikipedia, countryName }: CountryStoryProps) {
  if (!wikipedia.ok) {
    return (
      <section className={`atlas-note ${styles.story}`} aria-label="About">
        <div className="atlas-section-rule">— THE COUNTRY —</div>
        <p className={styles.empty}>No Wikipedia summary on file for {countryName}.</p>
      </section>
    )
  }

  const { description, extract, title, canonicalUrl, revisionTimestamp } = wikipedia.data

  return (
    <section className={`atlas-note ${styles.story}`} aria-label="About">
      <div className="atlas-section-rule">— THE COUNTRY —</div>

      {description && <p className={styles.description}>{description}</p>}

      {extract && <p className={`atlas-body ${styles.body}`}>{extract}</p>}

      <p className={`atlas-serial ${styles.attribution}`}>
        <a
          href={canonicalUrl}
          className={styles.attributionLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          Text: Wikipedia — {title}
        </a>
        <span>CC BY-SA 4.0{revisionTimestamp && ` · revised ${revisionTimestamp.slice(0, 10)}`}</span>
      </p>
    </section>
  )
}
