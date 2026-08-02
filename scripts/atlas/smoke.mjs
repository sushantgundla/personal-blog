#!/usr/bin/env node
// Offline smoke check for The Atlas content files.
// No server, no network — just checks the files that power /atlas exist,
// are non-empty, and don't contain a known-bad pattern (http:// image URLs
// that crash next/image).

import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..', '..')

let failed = false

function fail(message) {
  console.error(`FAIL: ${message}`)
  failed = true
}

function checkNonEmpty(relPath) {
  const fullPath = path.join(root, relPath)
  try {
    const stats = statSync(fullPath)
    if (!stats.isFile()) {
      fail(`${relPath} is not a file`)
      return null
    }
    if (stats.size === 0) {
      fail(`${relPath} exists but is empty`)
      return null
    }
    return readFileSync(fullPath, 'utf8')
  } catch (err) {
    fail(`${relPath} is missing (${err.message})`)
    return null
  }
}

// 1. World map paths — should hold 170+ country paths.
const worldPaths = checkNonEmpty('lib/atlas/geo/world-paths.ts')
if (worldPaths) {
  const pathCount = (worldPaths.match(/\bd:\s*['"]/g) || []).length
  if (pathCount < 170) {
    fail(`lib/atlas/geo/world-paths.ts has only ${pathCount} country paths (expected 170+)`)
  } else {
    console.log(`OK: world-paths.ts has ${pathCount} country paths`)
  }
}

// 2. ISO countries — 250 countries.
const isoCountries = checkNonEmpty('lib/atlas/iso-countries.ts')
if (isoCountries) {
  console.log('OK: lib/atlas/iso-countries.ts is present and non-empty')
}

// 3. Famous people content.
const famousPeopleRaw = checkNonEmpty('content/atlas/famous-people.json')
if (famousPeopleRaw) {
  try {
    JSON.parse(famousPeopleRaw)
    console.log('OK: content/atlas/famous-people.json is present and valid JSON')
  } catch (err) {
    fail(`content/atlas/famous-people.json is not valid JSON (${err.message})`)
  }

  // Known regression: http:// image URLs crash next/image.
  const httpMatches = famousPeopleRaw.match(/http:\/\/[^\s"']+/g) || []
  if (httpMatches.length > 0) {
    fail(
      `content/atlas/famous-people.json contains ${httpMatches.length} http:// URL(s), ` +
        `e.g. "${httpMatches[0]}" — these crash next/image, use https:// instead`
    )
  } else {
    console.log('OK: content/atlas/famous-people.json has no http:// URLs')
  }
}

// 4. Comtrade trade codes.
const comtradeCodes = checkNonEmpty('lib/atlas/comtrade-codes.ts')
if (comtradeCodes) {
  console.log('OK: lib/atlas/comtrade-codes.ts is present and non-empty')
}

if (failed) {
  console.error('\nSmoke check FAILED.')
  process.exit(1)
} else {
  console.log('\nSmoke check passed.')
  process.exit(0)
}
