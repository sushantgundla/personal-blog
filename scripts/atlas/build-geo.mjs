#!/usr/bin/env node
/**
 * scripts/atlas/build-geo.mjs
 *
 * Generates lib/atlas/geo/world-paths.ts — a static, pre-projected SVG
 * path for every country, ready to inline in the server-rendered map with
 * zero client-side mapping library.
 *
 * Reads world-atlas's countries-110m.json (TopoJSON, ~177 land features),
 * converts it to GeoJSON with topojson-client, and projects it with
 * d3-geo's geoNaturalEarth1 fitted to a 1000x500 viewBox. Both packages
 * are devDependencies only — this script runs at build time, never in
 * the browser.
 *
 * world-atlas features are keyed by ISO 3166-1 / UN M49 numeric id, which
 * is why the join here goes through BY_M49 from lib/atlas/iso-countries.ts,
 * not BY_ISO3 directly.
 *
 * Run with: npm run atlas:geo
 */

import { writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_FILE = path.join(__dirname, '../../lib/atlas/geo/world-paths.ts')

const VIEWBOX_WIDTH = 1000
const VIEWBOX_HEIGHT = 500

// Rounds every decimal number embedded in an SVG path `d` string to 2
// places. d3-geo emits full floating-point precision by default; at ~250
// countries that bloats the generated file for no visible benefit at map
// scale.
function roundPathPrecision(d) {
  return d.replace(/-?\d+\.\d+/g, (n) => String(Math.round(parseFloat(n) * 100) / 100))
}

function round2(n) {
  return Math.round(n * 100) / 100
}

async function main() {
  // lib/atlas/iso-countries.ts is TypeScript, so this plain-node build
  // script can't `import` it directly. It's a generated file with a known
  // shape (a single array-literal export), so we pull just the array text
  // out and eval it — every value in it is a plain JS literal, no TS-only
  // syntax. Building BY_M49 locally means we never re-implement the join
  // rule (m49 present, empty string filtered) in two places.
  const isoSrc = require('node:fs').readFileSync(
    path.join(__dirname, '../../lib/atlas/iso-countries.ts'),
    'utf8'
  )
  const match = isoSrc.match(/ISO_COUNTRIES: readonly IsoCountry\[\] = (\[[\s\S]*?\n\])/)
  if (!match) {
    throw new Error('Could not find ISO_COUNTRIES array in lib/atlas/iso-countries.ts — run npm run atlas:iso first')
  }
  // eslint-disable-next-line no-new-func
  const ISO_COUNTRIES = new Function(`return ${match[1]}`)()
  const BY_M49 = Object.fromEntries(ISO_COUNTRIES.filter((c) => c.m49).map((c) => [c.m49, c]))

  const topology = JSON.parse(
    require('node:fs').readFileSync(require.resolve('world-atlas/countries-110m.json'), 'utf8')
  )

  const geojson = feature(topology, topology.objects.countries)

  const projection = geoNaturalEarth1().fitSize([VIEWBOX_WIDTH, VIEWBOX_HEIGHT], geojson)
  const pathGen = geoPath(projection)

  const out = []
  const joinedM49 = new Set()
  const failedJoins = []

  for (const f of geojson.features) {
    const m49 = String(f.id).padStart(3, '0')
    const iso = BY_M49[m49]
    if (!iso) {
      failedJoins.push(`${f.id} (${f.properties?.name ?? 'unknown'})`)
      continue
    }

    const d = pathGen(f)
    if (!d) continue // degenerate/empty geometry, skip rather than emit ""

    const [cx, cy] = pathGen.centroid(f)
    const [[x0, y0], [x1, y1]] = pathGen.bounds(f)

    joinedM49.add(m49)
    out.push({
      iso3: iso.iso3,
      m49,
      name: f.properties?.name ?? iso.name,
      d: roundPathPrecision(d),
      centroid: [round2(cx), round2(cy)],
      bbox: [round2(x0), round2(y0), round2(x1), round2(y1)],
    })
  }

  out.sort((a, b) => a.iso3.localeCompare(b.iso3))

  const missingGeometry = ISO_COUNTRIES.filter((c) => c.m49 && !joinedM49.has(c.m49)).map(
    (c) => `${c.iso3} (${c.name})`
  )

  const ts = renderTs(out)
  await writeFile(OUT_FILE, ts, 'utf8')

  console.log(`Wrote ${out.length} country paths to ${OUT_FILE}`)
  if (failedJoins.length > 0) {
    console.log(`world-atlas features with no ISO match (${failedJoins.length}): ${failedJoins.join(', ')}`)
  }
  if (missingGeometry.length > 0) {
    console.log(
      `ISO_COUNTRIES entries with an M49 but no geometry in world-atlas (${missingGeometry.length}, expected — 110m resolution drops many micro-states): ${missingGeometry.join(', ')}`
    )
  }
}

function renderTs(rows) {
  const header = `// GENERATED FILE — do not hand-edit.
// Produced by scripts/atlas/build-geo.mjs from world-atlas's
// countries-110m.json, projected at build time with d3-geo. Neither
// d3-geo nor topojson-client ship to the browser — this file is the only
// artifact the app ever imports.
// Re-run with: npm run atlas:geo

export interface CountryPath {
  iso3: string
  m49: string
  name: string
  d: string
  centroid: [number, number]
  bbox: [number, number, number, number]
}

export const WORLD_VIEWBOX = '0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}'

export const COUNTRY_PATHS: readonly CountryPath[] = [
`
  const body = rows
    .map(
      (r) =>
        `  { iso3: ${JSON.stringify(r.iso3)}, m49: ${JSON.stringify(r.m49)}, name: ${JSON.stringify(
          r.name
        )}, d: ${JSON.stringify(r.d)}, centroid: [${r.centroid[0]}, ${r.centroid[1]}], bbox: [${r.bbox.join(
          ', '
        )}] },`
    )
    .join('\n')

  const footer = `
]
`
  return header + body + footer
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
