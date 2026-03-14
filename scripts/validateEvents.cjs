#!/usr/bin/env node
/**
 * Validates lat/lng coordinates in events.json and journeys.json.
 * Run: node scripts/validateEvents.js
 */

const path = require('path')
const events = require(path.resolve(__dirname, '../src/data/events.json'))
const journeys = require(path.resolve(__dirname, '../src/data/journeys.json'))

function isValidLat(v) { return typeof v === 'number' && !isNaN(v) && v >= -90 && v <= 90 }
function isValidLng(v) { return typeof v === 'number' && !isNaN(v) && v >= -180 && v <= 180 }

let failures = 0

console.log('=== events.json ===')
events.forEach(e => {
  const lat = e.location?.lat
  const lng = e.location?.lng
  const latOk = isValidLat(lat)
  const lngOk = isValidLng(lng)
  if (!latOk || !lngOk) {
    console.error(`  FAIL ${e.id} — lat: ${lat} (${latOk ? 'ok' : 'BAD'}), lng: ${lng} (${lngOk ? 'ok' : 'BAD'})`)
    failures++
  }
})
if (failures === 0) console.log('  All events OK')

console.log('\n=== journeys.json ===')
let journeyFails = 0
journeys.forEach(j => {
  j.waypoints.forEach((wp, i) => {
    if (!isValidLat(wp.lat) || !isValidLng(wp.lng)) {
      console.error(`  FAIL ${j.id}[${i}] "${wp.label}" — lat: ${wp.lat}, lng: ${wp.lng}`)
      journeyFails++
    }
  })
})
if (journeyFails === 0) console.log('  All journey waypoints OK')

failures += journeyFails

if (failures > 0) {
  console.error(`\n${failures} coordinate error(s) found. Fix them before deploying.`)
  process.exit(1)
} else {
  console.log('\nAll coordinates valid.')
}
