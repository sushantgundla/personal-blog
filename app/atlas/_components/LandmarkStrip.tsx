import Image from 'next/image'
import type { UnescoSite } from '@/lib/atlas/types'
import { toHttps } from '@/lib/atlas/format'
import styles from './extras.module.css'

export interface LandmarkStripProps {
  sites: readonly UnescoSite[]
  countryName: string
}

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
 * Photos of UNESCO sites and landmarks, from Wikidata P18 images on each
 * site (never the Wikipedia lead image — for a country that is almost
 * always the flag, not scenery). Duotone at rest, resolving to full colour
 * on hover, matching the grayscale-then-colour treatment already used on
 * the face note's watermark portrait. Every image links to its Commons
 * file page, which the licence requires. Missing photos are the normal
 * case — most sites on Wikidata have no image at all.
 */
export function LandmarkStrip({ sites, countryName }: LandmarkStripProps) {
  const withPhotos = sites.filter((s) => s.imageUrl)

  if (withPhotos.length === 0) {
    return (
      <div>
        <span className={`atlas-label ${styles.panelLabel}`}>Landmarks</span>
        <div className={styles.emptyState}>
          No landmark photos on file for {countryName} yet
        </div>
      </div>
    )
  }

  return (
    <div>
      <span className={`atlas-label ${styles.panelLabel}`}>Landmarks</span>
      <div className={styles.landmarkStrip}>
        {withPhotos.map((site) => {
          const filePage = site.imageUrl ? commonsFilePage(site.imageUrl) : null
          return (
            <figure key={site.qid} className={styles.landmarkCard}>
              <div className={styles.landmarkImageWrap}>
                {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                <Image src={toHttps(site.imageUrl!)} alt="" fill sizes="220px" className={styles.landmarkImg} />
              </div>
              <figcaption className={styles.landmarkCaption}>
                <span className={styles.landmarkName}>{site.name}</span>
                {filePage && (
                  <a
                    href={filePage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.landmarkAttribution}
                  >
                    Image: Wikimedia Commons
                  </a>
                )}
              </figcaption>
            </figure>
          )
        })}
      </div>
    </div>
  )
}
