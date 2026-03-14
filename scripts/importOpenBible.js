#!/usr/bin/env node
/**
 * importOpenBible.js
 * Downloads the OpenBible.info places.txt dataset and converts it to:
 *   src/data/locations.json  — clean lat/lng lookup for all Bible places
 *
 * Usage:
 *   node scripts/importOpenBible.js
 *
 * The locations.json is a reference table used when hand-authoring events.
 * Each entry has: id, name, lat, lng, accuracy, passages[]
 */

import { createWriteStream, readFileSync, writeFileSync } from 'fs'
import { get } from 'https'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, '../src/data')
const PLACES_URL = 'https://www.openbible.info/geo/data/places.txt'
const PLACES_CACHE = resolve(__dirname, 'openbible-places.txt')
const OUT_FILE = resolve(DATA_DIR, 'locations.json')

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseCoord(raw) {
  if (!raw || raw.trim() === '' || raw.trim() === '?') return null
  const s = raw.trim().replace('~', '')
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

function parseAccuracy(latRaw, lngRaw) {
  const l = (latRaw || '').trim()
  const r = (lngRaw || '').trim()
  if (l === '?' || r === '?' || l === '' || r === '') return null
  if (l.startsWith('~') || r.startsWith('~')) return 'approximate'
  return 'exact'
}

function parsePassages(raw) {
  if (!raw) return []
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

// ── Download ──────────────────────────────────────────────────────────────────

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest)
    get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close()
        download(res.headers.location, dest).then(resolve).catch(reject)
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} from ${url}`))
        return
      }
      res.pipe(file)
      file.on('finish', () => file.close(resolve))
    }).on('error', reject)
  })
}

// ── Parse TSV ─────────────────────────────────────────────────────────────────

function parsePlaces(text) {
  const lines = text.split('\n')
  const locations = []
  const seen = new Set()
  let skipped = 0

  for (let i = 1; i < lines.length; i++) {           // skip header
    const line = lines[i].trim()
    if (!line) continue

    const cols = line.split('\t')
    const name    = (cols[0] || '').trim()
    const latRaw  = (cols[2] || '').trim()
    const lngRaw  = (cols[3] || '').trim()
    const passRaw = (cols[4] || '').trim()
    const comment = (cols[5] || '').trim()

    if (!name) continue

    const accuracy = parseAccuracy(latRaw, lngRaw)
    if (!accuracy) { skipped++; continue }           // no usable coords

    const lat = parseCoord(latRaw)
    const lng = parseCoord(lngRaw)
    if (lat === null || lng === null) { skipped++; continue }

    // Validate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) { skipped++; continue }

    const id = slugify(name)
    if (seen.has(id)) {
      // Append numeric suffix for duplicates
      let n = 2
      while (seen.has(`${id}-${n}`)) n++
      seen.add(`${id}-${n}`)
      locations.push({ id: `${id}-${n}`, name, lat, lng, accuracy, passages: parsePassages(passRaw), comment })
    } else {
      seen.add(id)
      locations.push({ id, name, lat, lng, accuracy, passages: parsePassages(passRaw), comment })
    }
  }

  return { locations, skipped }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Try to use cached file first to avoid hammering the server
  let text
  try {
    text = readFileSync(PLACES_CACHE, 'utf8')
    console.log(`Using cached places.txt (${PLACES_CACHE})`)
  } catch {
    console.log(`Downloading ${PLACES_URL} …`)
    await download(PLACES_URL, PLACES_CACHE)
    text = readFileSync(PLACES_CACHE, 'utf8')
    console.log('Download complete.')
  }

  const { locations, skipped } = parsePlaces(text)

  writeFileSync(OUT_FILE, JSON.stringify(locations, null, 2), 'utf8')

  console.log(`\n✅  Wrote ${locations.length} locations to ${OUT_FILE}`)
  console.log(`   Skipped ${skipped} rows (no usable coordinates)`)
  console.log('\nTop 10 entries:')
  locations.slice(0, 10).forEach(l =>
    console.log(`  ${l.name.padEnd(30)} lat=${l.lat}, lng=${l.lng} (${l.accuracy}) refs=${l.passages.length}`)
  )
}

main().catch(err => { console.error(err); process.exit(1) })
