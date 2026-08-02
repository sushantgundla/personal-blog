import Image from 'next/image'
import { ISO_COUNTRIES } from '@/lib/atlas/iso-countries'
import styles from './extras.module.css'

export interface NeighboursProps {
  qid: string
  countryName: string
}

const ENDPOINT = 'https://query.wikidata.org/sparql'
const USER_AGENT =
  'AtlasCountryExplorer/1.0 (https://sushantgundla.com/atlas; contact: atlas@sushantgundla.com)'
const TIMEOUT_MS = 20_000
const REVALIDATE_DAY = 86400

const QID_TO_COUNTRY = new Map(ISO_COUNTRIES.map((c) => [c.qid, c] as const))

/** Wikidata's P41 (flag) comes back as a literal "http://commons..." URL —
 * that is how Wikidata serialises the property regardless of Commons
 * being https-only. next/image's remotePatterns (next.config.js) is
 * https-only, so the raw value 500s the page; confirmed live via the same
 * failure mode on /atlas/twn's portrait image. Fixed locally, not in
 * next.config.js or wikidata.ts, neither owned here. */
function toHttps(url: string): string {
  return url.startsWith('http://') ? `https://${url.slice(7)}` : url
}

interface NeighbourRow {
  iso3: string
  name: string
  flagUrl: string | null
}

/** This is a standalone Wikidata client, not a reuse of
 * lib/atlas/sources/wikidata.ts (that file belongs to another agent's
 * ownership on this branch) — but it follows the same traps from the
 * design spec: descriptive User-Agent, 20s AbortController timeout, and
 * P47 read directly rather than through any shared helper. */
async function fetchNeighbours(qid: string): Promise<NeighbourRow[] | null> {
  const query = `SELECT ?neighbour ?neighbourLabel ?flag WHERE {
    wd:${qid} wdt:P47 ?neighbour .
    OPTIONAL { ?neighbour wdt:P41 ?flag . }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  } LIMIT 40`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const url = `${ENDPOINT}?format=json&query=${encodeURIComponent(query)}`
    const res = await fetch(url, {
      headers: { Accept: 'application/sparql-results+json', 'User-Agent': USER_AGENT },
      signal: controller.signal,
      next: { revalidate: REVALIDATE_DAY },
    })
    if (!res.ok) return null

    const body = (await res.json()) as {
      results: { bindings: Record<string, { value: string }>[] }
    }

    const rows: NeighbourRow[] = []
    const seen = new Set<string>()
    for (const row of body.results.bindings) {
      const neighbourQid = row.neighbour?.value.split('/').pop() ?? ''
      const country = QID_TO_COUNTRY.get(neighbourQid)
      // Neighbours not in our ~250-row ISO table (disputed territories,
      // historical entities) are skipped rather than linked to a 404.
      if (!country || seen.has(country.iso3)) continue
      seen.add(country.iso3)
      rows.push({
        iso3: country.iso3,
        name: row.neighbourLabel?.value ?? country.name,
        flagUrl: row.flag?.value ?? null,
      })
    }
    return rows.sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * One-click hops to bordering countries, sourced from Wikidata P47. Island
 * nations legitimately have zero land borders — that renders as a plain
 * fact ("no land borders"), never as an error. A dead Wikidata request
 * degrades the same way: this never throws the dossier page.
 */
export async function Neighbours({ qid, countryName }: NeighboursProps) {
  const neighbours = await fetchNeighbours(qid)

  if (neighbours === null) {
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
            {n.flagUrl ? (
              <span className={styles.neighbourFlag}>
                <Image src={toHttps(n.flagUrl)} alt="" fill sizes="18px" className={styles.neighbourFlagImg} />
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
