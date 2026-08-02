import type { CountryDossier } from '@/lib/atlas/types'
import type { IsoCountry } from '@/lib/atlas/iso-countries'
import { guillochePath, guillocheLength } from '@/lib/atlas/guilloche'
import { commonsThumbnail, formatValue, formatYear, toHttps } from '@/lib/atlas/format'
import styles from './dossier.module.css'

export interface FaceNoteProps {
  dossier: CountryDossier
  country: IsoCountry
  /**
   * Rendered at a fraction of full width — currently only the two-country
   * compare screen (`/atlas/compare/[countries]`). The full-width dossier
   * never passes this: its rendering must stay byte-for-byte what it was
   * before this prop existed.
   *
   * Container-relative sizing (`cqw`, via `.faceNote`'s own
   * `container-type: inline-size` in dossier.module.css) already handles
   * most of the difference — the same clamp() resolves smaller once the
   * note itself is narrower, with no separate code path. `compact` only
   * adds what container units can't: a name like "Democratic Republic of
   * the Congo" needs to shrink further than its container width alone
   * would give it, and the note needs room to actually wrap that name
   * onto two or three lines instead of a fixed banknote aspect ratio
   * clipping whatever doesn't fit.
   */
  compact?: boolean
}

/**
 * A long name has no choice but to wrap in a half-width note — there just
 * isn't the horizontal room "Bosnia and Herzegovina" or "Democratic
 * Republic of the Congo" would need on one line at a legible size. This
 * only trims the *starting* size so that wrap lands on two or three lines
 * rather than five: --face-name-scale multiplies the container-relative
 * clamp in .faceNameCompact (dossier.module.css), it does not replace
 * word-break: break-word, which is still what actually wraps the text.
 */
function faceNameScale(name: string): number {
  const len = name.length
  if (len <= 8) return 1
  return Math.max(0.45, 8 / len)
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

/** Wikidata's P571 (inception) comes back as a full ISO datetime; the note
 * only has room to engrave the year. */
function inceptionYear(iso: string | null): string | null {
  if (!iso) return null
  const year = new Date(iso).getUTCFullYear()
  return Number.isFinite(year) ? formatYear(year) : null
}

/** One line of the note's fine-print panel — a mono label over its value,
 * matching a banknote's engraved issuer details. Rows with no real value
 * are simply not rendered by the caller, so a sparse country's note never
 * prints a page of em dashes. */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.factRow}>
      <span className="atlas-label">{label}</span>
      <span className={styles.factValue}>{value}</span>
    </div>
  )
}

/**
 * The headline banknote: the country's name engraved huge, a fine-print
 * panel of capital/currency/language/area/independence/ISO facts, population
 * as the denomination numeral, a watermark portrait, the national emblem
 * seated inside the guilloché rosette, the M49 numeric code as a serial, and
 * the motto as bottom-edge microtext.
 */
export function FaceNote({ dossier, country, compact }: FaceNoteProps) {
  const indicators = dossier.worldBank.ok ? dossier.worldBank.data.indicators : []
  const population = indicators.find((i) => i.code === 'SP.POP.TOTL') ?? null
  const popYear = population?.year ? formatYear(Number(population.year)) : null
  const area = indicators.find((i) => i.code === 'AG.SRF.TOTL.K2') ?? null

  const facts = dossier.wikidata.ok ? dossier.wikidata.data : null
  const motto = facts?.motto ?? null
  const flagUrl = facts?.flagImageUrl ?? null
  const emblemUrl = facts?.emblemImageUrl ?? null

  const currency = [facts?.currencyCode, facts?.currencyName].filter(Boolean).join(' · ') || null
  const languages = facts?.officialLanguages.length ? facts.officialLanguages.join(', ') : null
  const since = inceptionYear(facts?.independenceDate ?? null)
  const areaValue = area?.value != null ? `${formatValue(area.value, 'number')} km²` : null

  const portrait = dossier.famousPeople.ok
    ? dossier.famousPeople.data.find((p) => p.imageUrl) ?? null
    : null
  const hasPortrait = Boolean(portrait?.imageUrl)

  const size = hasPortrait ? GUILLOCHE_SIZE : GUILLOCHE_SIZE_NO_PORTRAIT
  const { path, length } = guilloche(country.iso3, size)

  return (
    <section
      className={`atlas-note atlas-vt-face-note ${styles.faceNote} ${compact ? styles.faceNoteCompact : ''}`}
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
            {/* Plain <img>, not next/image: these are decorative and Commons'
                Special:FilePath redirect chain (see commonsThumbnail's doc
                comment) intermittently confused next/image's own optimizer.
                A direct browser fetch of the already-rasterised, width-capped
                URL is simpler and deterministic. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={toHttps(flagUrl)} alt={`Flag of ${dossier.name}`} className={styles.faceSealImg} />
          </div>
        )}

        <h1
          className={`atlas-face-name ${styles.faceName} ${compact ? styles.faceNameCompact : ''}`}
          style={compact ? { ['--face-name-scale' as string]: faceNameScale(dossier.name) } : undefined}
        >
          {dossier.name}
        </h1>

        <div className={styles.faceFacts}>
          {facts?.capital && <Fact label="Capital" value={facts.capital} />}
          {currency && <Fact label="Currency" value={currency} />}
          {languages && <Fact label="Language" value={languages} />}
          {areaValue && <Fact label="Area" value={areaValue} />}
          {since && <Fact label="Since" value={since} />}
          <Fact label="ISO" value={`${country.iso3} · ${country.iso2}`} />
        </div>

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
            {/* Famous-people portraits come from the build-time static JSON
                (see lib/atlas/sources/wikidata.ts's own note on why), so
                commonsThumbnail is applied here rather than at the source —
                same Special:FilePath fix, same reason. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={commonsThumbnail(toHttps(portrait.imageUrl), 640)}
              alt=""
              className={styles.facePortraitImg}
            />
            <span className="sr-only">Watermark portrait: {portrait.name}</span>
          </div>
        )}

        <div className={`${styles.faceRosette} ${!hasPortrait ? styles.faceRosetteGrown : ''}`}>
          <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className={`atlas-guilloche ${styles.faceGuilloche}`}>
            <path
              d={path}
              className="atlas-guilloche-path"
              style={{ ['--atlas-dash-length' as string]: length }}
            />
          </svg>

          {/* The coat of arms, seated inside the rosette the way a mint
              stamps its own medallion at the centre of an engraved
              guilloché — a second watermark, alongside the portrait, that
              resolves to full contrast on hover. */}
          {emblemUrl && (
            <div className={`atlas-watermark ${styles.faceEmblem}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={emblemUrl} alt={`Coat of arms of ${dossier.name}`} className={styles.faceEmblemImg} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
