import Image from 'next/image'
import type { CountryDossier } from '@/lib/atlas/types'
import type { IsoCountry } from '@/lib/atlas/iso-countries'
import { guillochePath, guillocheLength } from '@/lib/atlas/guilloche'
import { formatValue, formatYear, toHttps } from '@/lib/atlas/format'
import styles from './dossier.module.css'

export interface FaceNoteProps {
  dossier: CountryDossier
  country: IsoCountry
}

const GUILLOCHE_SIZE = 400
/** ~70 countries have no free portrait — see §3.6. Rather than leave a
 * blank watermark slot, the rosette grows to fill it. Designed first,
 * not as an afterthought: this is the *first* branch below, not a
 * fallback bolted on at the end. */
const GUILLOCHE_SIZE_NO_PORTRAIT = 560

function guilloche(iso3: string, size: number) {
  return {
    path: guillochePath(iso3, { size }),
    // guillocheLength assumes the 200x200 default sampling; scale it for
    // any other rendered size (see lib/atlas/guilloche.ts's own doc comment).
    length: guillocheLength(iso3) * (size / 200),
  }
}

/**
 * The headline banknote: the country's name engraved huge, its
 * guilloché rosette bleeding off the right edge, population as the
 * denomination numeral, a watermark portrait, the M49 numeric code as a
 * serial, and the motto as bottom-edge microtext.
 */
export function FaceNote({ dossier, country }: FaceNoteProps) {
  const population = dossier.worldBank.ok
    ? dossier.worldBank.data.indicators.find((i) => i.code === 'SP.POP.TOTL') ?? null
    : null
  const popYear = population?.year ? formatYear(Number(population.year)) : null

  const motto = dossier.wikidata.ok ? dossier.wikidata.data.motto : null
  const flagUrl = dossier.wikidata.ok ? dossier.wikidata.data.flagImageUrl : null

  const portrait = dossier.famousPeople.ok
    ? dossier.famousPeople.data.find((p) => p.imageUrl) ?? null
    : null
  const hasPortrait = Boolean(portrait?.imageUrl)

  const size = hasPortrait ? GUILLOCHE_SIZE : GUILLOCHE_SIZE_NO_PORTRAIT
  const { path, length } = guilloche(country.iso3, size)

  return (
    <section
      className={`atlas-note atlas-vt-face-note ${styles.faceNote}`}
      style={{ ['--atlas-vt-name' as string]: `atlas-country-${country.iso3.toLowerCase()}` }}
    >
      <div className={styles.faceNoteInner}>
        <div className={styles.faceHeader}>
          {/* lib/atlas/iso-countries.ts carries only the UN M49 numeric
              code, not a separate ISO 3166-1 numeric field — it stands
              in here for a banknote's engraved serial number. */}
          <span className="atlas-serial">SERIAL · {country.m49}</span>
          {country.region && <span className="atlas-serial">{country.region}</span>}
        </div>

        {flagUrl && (
          <div className={`atlas-ornament ${styles.faceSeal}`}>
            <Image
              src={toHttps(flagUrl)}
              alt={`Flag of ${dossier.name}`}
              fill
              sizes="72px"
              className={styles.faceSealImg}
            />
          </div>
        )}

        <h1 className={`atlas-face-name ${styles.faceName}`}>{dossier.name}</h1>

        <div className={styles.faceDenomination}>
          <span className="atlas-label">Population</span>
          <div className={styles.figureRow}>
            <span className="atlas-denomination">{formatValue(population?.value ?? null, 'number')}</span>
            {popYear && <span className="atlas-serial">as of {popYear}</span>}
          </div>
        </div>
      </div>

      {motto && (
        <p aria-hidden="true" className={`atlas-microtext ${styles.faceMotto}`}>
          {Array(6).fill(motto.toUpperCase()).join('  ·  ')}
        </p>
      )}

      <div className={styles.faceOrnamentArea}>
        {hasPortrait && portrait?.imageUrl && (
          <div className={`atlas-watermark ${styles.facePortrait}`}>
            <Image src={toHttps(portrait.imageUrl)} alt="" fill sizes="260px" className={styles.facePortraitImg} />
            <span className="sr-only">Watermark portrait: {portrait.name}</span>
          </div>
        )}

        <svg
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
          className={`atlas-guilloche ${styles.faceGuilloche} ${
            !hasPortrait ? styles.faceGuillocheGrown : ''
          }`}
        >
          <path
            d={path}
            className="atlas-guilloche-path"
            style={{ ['--atlas-dash-length' as string]: length }}
          />
        </svg>
      </div>
    </section>
  )
}
