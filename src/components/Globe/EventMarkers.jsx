import { useEffect, useMemo } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import { getCategoryColor } from '../../utils/colorMap'

// ─────────────────────────────────────────────
// Coordinate helpers
// ─────────────────────────────────────────────
function isValidCoord(lat, lng) {
  return (
    typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90 &&
    typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180
  )
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
}
function mix(ch, t) { return Math.min(255, Math.round(ch + (255 - ch) * t)) }

// ─────────────────────────────────────────────
// Marker icon — inline SVG, resolution-independent
// ─────────────────────────────────────────────
const iconCache = new Map()

function createLeafletIcon(hex) {
  if (iconCache.has(hex)) return iconCache.get(hex)

  const [r, g, b] = hexToRgb(hex)
  const light = `rgb(${mix(r,.48)},${mix(g,.48)},${mix(b,.48)})`
  const uid   = hex.replace('#','')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 48 48">
  <defs>
    <radialGradient id="bg${uid}" cx="38%" cy="32%" r="68%">
      <stop offset="0%" stop-color="${light}"/>
      <stop offset="100%" stop-color="${hex}"/>
    </radialGradient>
    <radialGradient id="hl${uid}" cx="32%" cy="28%" r="58%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.52)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <circle cx="24" cy="24" r="23" fill="${hex}" fill-opacity="0.17"/>
  <circle cx="24" cy="24" r="18" fill="${hex}" fill-opacity="0.09"/>
  <circle cx="24.5" cy="25" r="14.5" fill="rgba(0,0,0,0.22)"/>
  <circle cx="24" cy="23.5" r="14" fill="url(#bg${uid})"/>
  <circle cx="24" cy="23.5" r="14.8" fill="none" stroke="rgba(0,0,0,0.20)" stroke-width="1.2"/>
  <circle cx="24" cy="23.5" r="14" fill="none" stroke="rgba(255,255,255,0.88)" stroke-width="1.9"/>
  <circle cx="24" cy="23.5" r="13" fill="url(#hl${uid})"/>
  <circle cx="24" cy="23.5" r="4.2" fill="rgba(255,255,255,0.97)"/>
  <circle cx="24" cy="23.5" r="2"   fill="rgba(255,255,255,1)"/>
</svg>`

  const icon = L.divIcon({
    html:       svg,
    className:  'bible-marker',
    iconSize:   [36, 36],
    iconAnchor: [18, 18],
  })

  iconCache.set(hex, icon)
  return icon
}

// ─────────────────────────────────────────────
// Cluster badge icon — dark navy + gold ring
// ─────────────────────────────────────────────
function createClusterIcon(cluster) {
  const count = cluster.getChildCount()
  const size  = count < 10 ? 40 : count < 100 ? 46 : 52
  const half  = size / 2
  const fs    = count < 10 ? 13 : count < 100 ? 12 : 10

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${half}" cy="${half}" r="${half - 1}" fill="rgba(5,8,15,0.93)" stroke="rgba(201,150,58,0.75)" stroke-width="2.2"/>
  <circle cx="${half}" cy="${half}" r="${half - 6}" fill="none" stroke="rgba(201,150,58,0.22)" stroke-width="1"/>
  <text x="${half}" y="${half + 0.5}" text-anchor="middle" dominant-baseline="middle"
    fill="#e8b84b" font-family="Cinzel,serif" font-size="${fs}" font-weight="600" letter-spacing="0.5">${count}</text>
</svg>`

  return L.divIcon({
    html:       svg,
    className:  'bible-cluster-icon',
    iconSize:   [size, size],
    iconAnchor: [half, half],
  })
}

// ─────────────────────────────────────────────
// Jitter co-located events into a small circle
// so zooming in separates them (~330 m radius)
// ─────────────────────────────────────────────
const JITTER_RADIUS = 0.003
const COORD_PREC    = 3

function jitterColocatedEvents(events) {
  const groups = new Map()
  events.forEach(ev => {
    if (!isValidCoord(ev.location?.lat, ev.location?.lng)) return
    const key = `${ev.location.lat.toFixed(COORD_PREC)},${ev.location.lng.toFixed(COORD_PREC)}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(ev)
  })

  const result = []
  groups.forEach(group => {
    if (group.length === 1) {
      result.push({ event: group[0], lat: group[0].location.lat, lng: group[0].location.lng })
      return
    }
    group.forEach((ev, i) => {
      const angle = (i / group.length) * Math.PI * 2 - Math.PI / 2
      result.push({
        event: ev,
        lat: ev.location.lat + Math.sin(angle) * JITTER_RADIUS,
        lng: ev.location.lng + Math.cos(angle) * JITTER_RADIUS,
      })
    })
  })
  return result
}

// ─────────────────────────────────────────────
// Component — imperative Leaflet layer so we
// can wrap everything in MarkerClusterGroup
// ─────────────────────────────────────────────
export default function EventMarkers({ events, onEventClick, onEventHover }) {
  const map    = useMap()
  const placed = useMemo(() => jitterColocatedEvents(events), [events])

  useEffect(() => {
    const group = L.markerClusterGroup({
      iconCreateFunction:      createClusterIcon,
      maxClusterRadius:        60,
      spiderfyOnMaxZoom:       true,
      showCoverageOnHover:     false,
      zoomToBoundsOnClick:     true,
      disableClusteringAtZoom: 12,
      animate:                 true,
    })

    placed.forEach(({ event, lat, lng }) => {
      if (!isValidCoord(lat, lng)) return
      const marker = L.marker([lat, lng], {
        icon: createLeafletIcon(getCategoryColor(event.category)),
      })

      marker.on('click', (e) => {
        e.originalEvent?.stopPropagation()
        onEventClick(event)
      })
      marker.on('mouseover', (e) => {
        if (e.originalEvent) onEventHover(event, { x: e.originalEvent.clientX, y: e.originalEvent.clientY })
      })
      marker.on('mousemove', (e) => {
        if (e.originalEvent) onEventHover(event, { x: e.originalEvent.clientX, y: e.originalEvent.clientY })
      })
      marker.on('mouseout', () => onEventHover(null, null))

      group.addLayer(marker)
    })

    map.addLayer(group)
    return () => { map.removeLayer(group) }
  }, [map, placed]) // eslint-disable-line

  return null
}
