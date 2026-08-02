#!/usr/bin/env node
/**
 * scripts/atlas/build-iso.mjs
 *
 * Generates lib/atlas/iso-countries.ts — the static ISO/M49/Wikidata join
 * table used by every other Atlas data source.
 *
 * Queries Wikidata SPARQL once for every entity carrying an ISO 3166-1
 * alpha-3 code (P298), plus its alpha-2 (P297), UN M49 numeric (P299),
 * continent (P30) and English Wikipedia sitelink.
 *
 * Run with: npm run atlas:iso
 */

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_FILE = path.join(__dirname, '../../lib/atlas/iso-countries.ts')

const USER_AGENT = 'AtlasCountryExplorer/1.0 (https://sushantgundla.com)'
const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql'

// Every entity with wdt:P298 set — sovereign states plus dependent
// territories that have been assigned an ISO 3166-1 alpha-3 code.
// GROUP BY collapses the (rare) multi-continent case with GROUP_CONCAT.
const QUERY = `
SELECT ?item ?itemLabel ?iso3 ?iso2 ?m49 ?articleName
       (GROUP_CONCAT(DISTINCT ?continentLabel; separator="|") AS ?continents)
WHERE {
  ?item wdt:P298 ?iso3 .
  OPTIONAL { ?item wdt:P297 ?iso2 . }
  OPTIONAL { ?item wdt:P299 ?m49 . }
  OPTIONAL {
    ?item wdt:P30 ?continent .
    ?continent rdfs:label ?continentLabel .
    FILTER(LANG(?continentLabel) = "en")
  }
  OPTIONAL {
    ?article schema:about ?item ;
             schema:isPartOf <https://en.wikipedia.org/> ;
             schema:name ?articleName .
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?item ?itemLabel ?iso3 ?iso2 ?m49 ?articleName
`

// Wikidata mixes in defunct states and duplicate/legacy codes because the
// underlying items still carry a normal-rank P298 statement even though the
// ISO 3166-1 code itself was withdrawn decades ago. Left in, several of
// these collide with a *current* country's M49 numeric code and break the
// UN Comtrade join (e.g. BYS "Byelorussian SSR" and BLR "Belarus" both
// claim M49 112). Excluded here, by ISO3, with the reason noted.
const EXCLUDE_ISO3 = new Map([
  ['ANT', 'Netherlands Antilles — dissolved 2010, code withdrawn'],
  ['YUG', 'Yugoslavia (both SFRY and FRY rows) — dissolved, M49 891 collides with SCG'],
  ['SUN', 'Soviet Union — dissolved 1991'],
  ['CSK', 'Czechoslovakia — dissolved 1993'],
  ['DDR', 'East Germany — reunified 1990'],
  ['SCG', 'Serbia and Montenegro — dissolved 2006'],
  ['BYS', 'Byelorussian SSR — M49 112 collides with modern Belarus (BLR)'],
  ['HVO', 'Republic of Upper Volta — M49 854 collides with modern Burkina Faso (BFA)'],
  ['DHY', 'Republic of Dahomey — M49 204 collides with modern Benin (BEN)'],
  ['NHB', 'New Hebrides — old name for Vanuatu, code withdrawn'],
  ['GEL', 'Gilbert and Ellice Islands — M49 296 collides with modern Kiribati (KIR)'],
  ['PCI', 'Trust Territory of the Pacific Islands — dissolved, superseded by FSM/MHL/MNP/PLW'],
  ['ATN', 'Queen Maud Land — Norwegian Antarctic claim, not a separate ISO entry'],
  ['ATB', 'British Antarctic Territory — not a separate ISO entry'],
  ['CTE', 'Canton and Enderbury Islands — now part of Kiribati'],
  ['JTN', 'Johnston Atoll — uninhabited US minor outlying island, folded into UMI'],
  ['MID', 'Midway Atoll — uninhabited US minor outlying island, folded into UMI'],
  ['FXX', 'Metropolitan France — duplicate of FRA'],
  ['AFI', 'French Territory of the Afars and the Issas — old name for Djibouti'],
  ['CRQ', 'Sark — not an official ISO 3166-1 code, subdivision of Guernsey'],
  ['ASC', 'Ascension — not a separate ISO 3166-1 code, part of Saint Helena (SHN)'],
  ['rw', 'Data error in Wikidata — "Kabeza Cell" is a village, not a country'],
])

// Wikidata stores Kosovo's alpha-3 as "XKS". The rest of the world outside
// Wikidata — World Bank, EU, CIA World Factbook — uses "XKX". Every other
// data source in this app expects XKX, so we normalise here.
const ISO3_OVERRIDES = new Map([['XKS', 'XKX']])

async function fetchRows() {
  const url = `${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(QUERY)}`
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/sparql-results+json',
    },
  })
  if (!res.ok) {
    throw new Error(`Wikidata SPARQL request failed: HTTP ${res.status}`)
  }
  const data = await res.json()
  return data.results.bindings
}

function pad3(m49) {
  if (!m49) return undefined
  return String(m49).padStart(3, '0')
}

function main() {
  return fetchRows().then((bindings) => {
    /** @type {Map<string, any>} */
    const byIso3 = new Map()
    let droppedExcluded = 0
    let droppedDuplicate = 0

    for (const row of bindings) {
      let iso3 = row.iso3.value.toUpperCase()
      const rawIso3 = row.iso3.value

      if (EXCLUDE_ISO3.has(rawIso3) || EXCLUDE_ISO3.has(iso3)) {
        droppedExcluded++
        continue
      }

      if (ISO3_OVERRIDES.has(iso3)) {
        iso3 = ISO3_OVERRIDES.get(iso3)
      }

      // Fields kept as undefined internally (never '') so merge/dedup below
      // can use plain `??` fallbacks. Converted to '' only at render time —
      // the interface requires `m49: string` and `iso2: string`, not optional.
      const entry = {
        iso3,
        iso2: row.iso2?.value,
        m49: pad3(row.m49?.value),
        name: row.itemLabel.value,
        qid: row.item.value.split('/').pop(),
        wikiTitle: row.articleName?.value,
        region: row.continents?.value ? row.continents.value.split('|')[0] : undefined,
      }

      const existing = byIso3.get(iso3)
      if (!existing) {
        byIso3.set(iso3, entry)
        continue
      }

      // Duplicate iso3 (e.g. Palestine / "Occupied Palestinian territories",
      // or the Antarctica / "Antarctic Treaty area" pair). Pick whichever
      // row has the enwiki article (the canonical name), fill any gaps
      // (m49, iso2) from the other row.
      const canonical = existing.wikiTitle ? existing : entry.wikiTitle ? entry : existing
      const other = canonical === existing ? entry : existing
      const merged = {
        iso3,
        iso2: canonical.iso2 ?? other.iso2,
        m49: canonical.m49 ?? other.m49,
        name: canonical.name,
        qid: canonical.qid,
        wikiTitle: canonical.wikiTitle ?? other.wikiTitle,
        region: canonical.region ?? other.region,
      }
      byIso3.set(iso3, merged)
      droppedDuplicate++
    }

    const rows = [...byIso3.values()]
      .map((r) => ({
        ...r,
        iso2: r.iso2 ?? '',
        m49: r.m49 ?? '',
        // Last-resort stand-in for the ~handful of territories with no
        // enwiki sitelink joined. Wikipedia REST calls for these may 404;
        // that is a normal "no data" state, handled at the fetch layer.
        wikiTitle: r.wikiTitle ?? r.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    // Guard: the whole point of this table is being a reliable join key.
    // If two countries end up with the same M49, every Comtrade/World Bank
    // rankings join downstream silently corrupts. Fail loudly instead.
    const m49Seen = new Map()
    for (const r of rows) {
      if (!r.m49) continue
      if (m49Seen.has(r.m49)) {
        throw new Error(
          `M49 collision: ${r.m49} used by both ${m49Seen.get(r.m49)} and ${r.iso3}. ` +
            `Add one of them to EXCLUDE_ISO3 in scripts/atlas/build-iso.mjs.`
        )
      }
      m49Seen.set(r.m49, r.iso3)
    }

    const REQUIRED = ['TWN', 'XKX', 'ESH', 'VAT', 'PSE']
    const missing = REQUIRED.filter((iso3) => !byIso3.has(iso3))
    if (missing.length > 0) {
      throw new Error(`Missing required awkward countries: ${missing.join(', ')}`)
    }

    const ts = renderTs(rows)
    return writeFile(OUT_FILE, ts, 'utf8').then(() => {
      console.log(`Wrote ${rows.length} countries to ${OUT_FILE}`)
      console.log(`Dropped ${droppedExcluded} excluded (historical/defunct), merged ${droppedDuplicate} duplicate rows`)
      console.log(`Required awkward rows present: ${REQUIRED.join(', ')}`)
      const noM49 = rows.filter((r) => !r.m49).map((r) => r.iso3)
      console.log(`Rows with no M49 (expected — not UN members or codes): ${noM49.join(', ') || 'none'}`)
    })
  })
}

function tsString(v) {
  return v === undefined ? 'undefined' : JSON.stringify(v)
}

function renderTs(rows) {
  const header = `// GENERATED FILE — do not hand-edit.
// Produced by scripts/atlas/build-iso.mjs from a Wikidata SPARQL query.
// Re-run with: npm run atlas:iso
//
// This is the join table every other Atlas data source keys off of:
// ISO3 for World Bank and Wikidata queries, M49 for UN Comtrade (which
// returns numeric reporter/partner codes with null names), Wikidata Q-id
// for SPARQL lookups, and the enwiki article title for the Wikipedia
// summary API.

export interface IsoCountry {
  iso3: string
  iso2: string
  m49: string
  name: string
  qid: string
  wikiTitle: string
  region?: string
}

export const ISO_COUNTRIES: readonly IsoCountry[] = [
`

  const body = rows
    .map((r) => {
      return `  { iso3: ${tsString(r.iso3)}, iso2: ${tsString(r.iso2)}, m49: ${tsString(r.m49)}, name: ${tsString(
        r.name
      )}, qid: ${tsString(r.qid)}, wikiTitle: ${tsString(r.wikiTitle)}, region: ${tsString(r.region)} },`
    })
    .join('\n')

  const footer = `
]

export const BY_ISO3: Readonly<Record<string, IsoCountry>> = Object.fromEntries(
  ISO_COUNTRIES.map((c) => [c.iso3, c])
)

// UN Comtrade returns M49 numeric reporter/partner codes with null names —
// this is the join. Not every country has an M49 (e.g. Kosovo, XKX, is not
// a UN member and has none), so this map is intentionally sparse.
export const BY_M49: Readonly<Record<string, IsoCountry>> = Object.fromEntries(
  ISO_COUNTRIES.filter((c) => c.m49).map((c) => [c.m49, c])
)
`

  return header + body + footer
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
