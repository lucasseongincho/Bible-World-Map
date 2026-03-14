#!/usr/bin/env node
/**
 * mergeEvents.js
 * Merges all event batch files into a single events.json.
 * Deduplicates by id, validates coordinates, and reports stats.
 *
 * Usage:
 *   node scripts/mergeEvents.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA = resolve(__dirname, '../src/data')

const SOURCES = [
  { file: resolve(DATA, 'events.json'),            label: 'events.json (base)' },
  { file: resolve(DATA, 'batch_genesis.json'),     label: 'Genesis batch' },
  { file: resolve(DATA, 'batch_exodus.json'),      label: 'Exodus-Deuteronomy batch' },
  { file: resolve(DATA, 'batch_joshua_samuel.json'), label: 'Joshua-Samuel batch' },
  { file: resolve(DATA, 'batch_kings.json'),       label: 'Kings-Prophets batch' },
  { file: resolve(DATA, 'batch_gospels.json'),     label: 'Gospels batch' },
  { file: resolve(DATA, 'batch_acts.json'),        label: 'Acts-Revelation batch' },
  { file: resolve(DATA, 'events_ot_extra.json'),   label: 'events_ot_extra.json' },
]

const OUT = resolve(DATA, 'events.json')

// ── Coordinate validation ─────────────────────────────────────────────────────
function isValidLat(v) { return typeof v === 'number' && !isNaN(v) && v >= -90 && v <= 90 }
function isValidLng(v) { return typeof v === 'number' && !isNaN(v) && v >= -180 && v <= 180 }

// ── Load sources ──────────────────────────────────────────────────────────────
const allEvents = []
const seenIds = new Set()
let coordErrors = 0
let dupCount = 0

for (const src of SOURCES) {
  if (!existsSync(src.file)) {
    console.warn(`  ⚠  Skipping (not found): ${src.label}`)
    continue
  }

  let batch
  try {
    batch = JSON.parse(readFileSync(src.file, 'utf8'))
  } catch (e) {
    console.error(`  ✗  JSON parse error in ${src.label}: ${e.message}`)
    process.exit(1)
  }

  let added = 0, dupes = 0, coordFail = 0

  for (const event of batch) {
    // Deduplicate
    if (seenIds.has(event.id)) {
      dupes++
      dupCount++
      continue
    }

    // Validate coordinates
    const lat = event.location?.lat
    const lng = event.location?.lng
    if (!isValidLat(lat) || !isValidLng(lng)) {
      console.error(`  BAD COORD  ${event.id} — lat=${lat}, lng=${lng}`)
      coordFail++
      coordErrors++
      continue
    }

    seenIds.add(event.id)
    allEvents.push(event)
    added++
  }

  console.log(`  ${src.label.padEnd(40)} +${added} added, ${dupes} dupes skipped, ${coordFail} coord errors`)
}

// ── Sort by date (ascending) ──────────────────────────────────────────────────
allEvents.sort((a, b) => {
  const da = parseInt(a.date_estimate, 10)
  const db = parseInt(b.date_estimate, 10)
  if (isNaN(da) && isNaN(db)) return 0
  if (isNaN(da)) return 1
  if (isNaN(db)) return -1
  return da - db
})

// ── Write output ──────────────────────────────────────────────────────────────
writeFileSync(OUT, JSON.stringify(allEvents, null, 2), 'utf8')

console.log(`
═══════════════════════════════════════════════
  Total events written : ${allEvents.length}
  Duplicates removed   : ${dupCount}
  Coordinate errors    : ${coordErrors}
  Output               : ${OUT}
═══════════════════════════════════════════════`)

if (coordErrors > 0) {
  console.error('\n⚠  Fix coordinate errors before deploying!')
  process.exit(1)
}
