import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import { useCesium } from 'resium'
import { getCategoryColor } from '../../utils/colorMap'
import EventMarkersErrorBoundary from './EventMarkersErrorBoundary'

function isValidCoord(lat, lng) {
  return (
    typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90 &&
    typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180
  )
}

// ─────────────────────────────────────────────
// Color helpers
// ─────────────────────────────────────────────
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
}
function mix(channel, toWhite) {
  return Math.min(255, Math.round(channel + (255 - channel) * toWhite))
}

// ─────────────────────────────────────────────
// SVG marker — resolution-independent, crisp at any DPI
// Cached per hex color (~12 unique values).
// SVG source: 192×192  →  Cesium billboard: 48×48
// ─────────────────────────────────────────────
const markerSVGCache = new Map()

function createMarkerSVG(hex) {
  if (markerSVGCache.has(hex)) return markerSVGCache.get(hex)

  const [r, g, b] = hexToRgb(hex)
  const light = `rgb(${mix(r,.45)},${mix(g,.45)},${mix(b,.45)})`
  const dark  = `rgb(${Math.round(r*.72)},${Math.round(g*.72)},${Math.round(b*.72)})`

  // Unique IDs per color so gradients don't clash if SVG is parsed into DOM
  const uid = hex.replace('#','')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 48 48">
  <defs>
    <radialGradient id="b${uid}" cx="38%" cy="32%" r="68%">
      <stop offset="0%" stop-color="${light}"/>
      <stop offset="100%" stop-color="${hex}"/>
    </radialGradient>
    <radialGradient id="h${uid}" cx="32%" cy="28%" r="60%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.55)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <!-- outer soft halo -->
  <circle cx="24" cy="24" r="23" fill="${hex}" fill-opacity="0.16"/>
  <circle cx="24" cy="24" r="19" fill="${hex}" fill-opacity="0.09"/>
  <!-- subtle depth shadow -->
  <circle cx="24.5" cy="25" r="14.5" fill="${dark}" fill-opacity="0.35"/>
  <!-- main body -->
  <circle cx="24" cy="23.5" r="14" fill="url(#b${uid})"/>
  <!-- outer dark ring (separation from background) -->
  <circle cx="24" cy="23.5" r="14.8" fill="none" stroke="rgba(0,0,0,0.22)" stroke-width="1.2"/>
  <!-- white border -->
  <circle cx="24" cy="23.5" r="14" fill="none" stroke="rgba(255,255,255,0.90)" stroke-width="1.9"/>
  <!-- gloss highlight -->
  <circle cx="24" cy="23.5" r="13" fill="url(#h${uid})"/>
  <!-- center dot -->
  <circle cx="24" cy="23.5" r="4" fill="rgba(255,255,255,0.97)"/>
  <circle cx="24" cy="23.5" r="2" fill="rgba(255,255,255,1)"/>
</svg>`

  const uri = `data:image/svg+xml,${encodeURIComponent(svg)}`
  markerSVGCache.set(hex, uri)
  return uri
}

// ─────────────────────────────────────────────
// Cluster badge — canvas at 4× for sharpness.
// Clean number only, no micro-text.
// ─────────────────────────────────────────────
const SCALE = 4

function createClusterCanvas(count) {
  const D   = 52
  const PAD = 12
  const W   = D + PAD * 2

  const canvas = document.createElement('canvas')
  canvas.width  = W * SCALE
  canvas.height = W * SCALE
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)

  const cx = W / 2, cy = W / 2, r = D / 2

  // Outer halo
  const halo = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r + PAD)
  halo.addColorStop(0,   'rgba(212,168,67,0.40)')
  halo.addColorStop(0.5, 'rgba(212,168,67,0.15)')
  halo.addColorStop(1,   'rgba(212,168,67,0)')
  ctx.beginPath()
  ctx.arc(cx, cy, r + PAD, 0, Math.PI * 2)
  ctx.fillStyle = halo
  ctx.fill()

  // Drop shadow
  ctx.shadowColor = 'rgba(212,168,67,0.55)'
  ctx.shadowBlur  = 12

  // Main circle — deep navy gradient
  const bg = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, 0, cx, cy, r)
  bg.addColorStop(0, '#1c2b46')
  bg.addColorStop(1, '#060a16')
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = bg
  ctx.fill()

  ctx.shadowBlur = 0

  // Gold border
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = '#d4a843'
  ctx.lineWidth   = 2.8
  ctx.stroke()

  // Subtle inner ring
  ctx.beginPath()
  ctx.arc(cx, cy, r - 5, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(212,168,67,0.18)'
  ctx.lineWidth   = 1
  ctx.stroke()

  // Count number — large, bold, crisp
  const label    = count > 999 ? '999+' : String(count)
  const fontSize = count > 99 ? 15 : count > 9 ? 19 : 23
  ctx.font         = `800 ${fontSize}px -apple-system, "Segoe UI", Arial, sans-serif`
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor  = 'rgba(0,0,0,0.7)'
  ctx.shadowBlur   = 6
  ctx.fillStyle    = '#f0e6d0'
  ctx.fillText(label, cx, cy)
  ctx.shadowBlur   = 0

  return canvas
}

// ─────────────────────────────────────────────
// Jitter co-located events
//
// Events at the same lat/lng will forever overlap even at max zoom
// because Cesium clustering is pixel-based. We spread them into a
// tiny circle (~330 m radius) so zooming in separates them visually.
// The original event data is preserved in entity.properties so
// click/hover still reports the correct scripture reference.
// ─────────────────────────────────────────────
const JITTER_RADIUS_DEG = 0.003   // ≈ 330 m — invisible at city zoom, clear at street zoom
const COORD_PRECISION   = 3       // group by ≤0.001° tolerance

function jitterColocatedEvents(events) {
  const groups = new Map()
  events.forEach(ev => {
    if (!isValidCoord(ev.location?.lat, ev.location?.lng)) return
    const key = `${ev.location.lat.toFixed(COORD_PRECISION)},${ev.location.lng.toFixed(COORD_PRECISION)}`
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
      // Spread evenly around a circle, starting from the top (−π/2)
      const angle = (i / group.length) * Math.PI * 2 - Math.PI / 2
      result.push({
        event: ev,
        lat: ev.location.lat + Math.sin(angle) * JITTER_RADIUS_DEG,
        lng: ev.location.lng + Math.cos(angle) * JITTER_RADIUS_DEG,
      })
    })
  })
  return result
}

// ─────────────────────────────────────────────
// Billboard display sizes (Cesium px)
// ─────────────────────────────────────────────
const MARKER_DISPLAY  = 48
const CLUSTER_DISPLAY = 76

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
function EventMarkersInner({ events, onEventClick, onEventHover }) {
  const { viewer } = useCesium()
  const handlerRef    = useRef(null)
  const entitiesRef   = useRef([])
  const dataSourceRef = useRef(null)
  const onClickRef    = useRef(onEventClick)
  const onHoverRef    = useRef(onEventHover)
  useEffect(() => { onClickRef.current = onEventClick }, [onEventClick])
  useEffect(() => { onHoverRef.current = onEventHover }, [onEventHover])

  // Set up data source + interaction handler once
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return

    if (!dataSourceRef.current) {
      const ds = new Cesium.CustomDataSource('events')
      viewer.dataSources.add(ds)
      dataSourceRef.current = ds

      ds.clustering.enabled          = true
      ds.clustering.pixelRange       = 52
      ds.clustering.minimumClusterSize = 3

      ds.clustering.clusterEvent.addEventListener((clusteredEntities, cluster) => {
        cluster.billboard.show              = true
        cluster.label.show                  = false
        cluster.billboard.id                = cluster
        cluster.billboard.verticalOrigin    = Cesium.VerticalOrigin.CENTER
        cluster.billboard.horizontalOrigin  = Cesium.HorizontalOrigin.CENTER
        cluster.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY
        cluster.billboard.image  = createClusterCanvas(clusteredEntities.length)
        cluster.billboard.width  = CLUSTER_DISPLAY
        cluster.billboard.height = CLUSTER_DISPLAY
      })
    }

    handlerRef.current = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

    handlerRef.current.setInputAction((click) => {
      const picked = viewer.scene.pick(click.position)
      if (Cesium.defined(picked) && picked.id) {
        const eventData = picked.id?.properties?.eventData?.getValue()
        if (eventData) { onClickRef.current(eventData); return }
      }
      onClickRef.current(null)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    handlerRef.current.setInputAction((movement) => {
      const picked = viewer.scene.pick(movement.endPosition)
      if (Cesium.defined(picked) && picked.id) {
        const eventData = picked.id?.properties?.eventData?.getValue()
        if (eventData) {
          onHoverRef.current(eventData, { x: movement.endPosition.x, y: movement.endPosition.y })
          viewer.scene.canvas.style.cursor = 'pointer'
          return
        }
      }
      onHoverRef.current(null, null)
      viewer.scene.canvas.style.cursor = 'default'
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    return () => {
      if (handlerRef.current && !handlerRef.current.isDestroyed()) {
        handlerRef.current.destroy()
        handlerRef.current = null
      }
    }
  }, [viewer])

  // Rebuild markers whenever filtered events change
  useEffect(() => {
    const ds = dataSourceRef.current
    if (!ds || !viewer || viewer.isDestroyed()) return

    ds.entities.removeAll()
    entitiesRef.current = []

    // Spread co-located events before placing billboards
    const placed = jitterColocatedEvents(events)

    placed.forEach(({ event, lat, lng }) => {
      const color    = getCategoryColor(event.category)
      const imageUri = createMarkerSVG(color)

      const entity = ds.entities.add({
        id:       event.id,
        name:     event.title,
        position: Cesium.Cartesian3.fromDegrees(lng, lat),
        billboard: {
          image:            imageUri,
          width:            MARKER_DISPLAY,
          height:           MARKER_DISPLAY,
          verticalOrigin:   Cesium.VerticalOrigin.CENTER,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance:  new Cesium.NearFarScalar(8e5, 1.1, 1.2e7, 0.5),
          translucencyByDistance: new Cesium.NearFarScalar(6e6, 1.0, 1.4e7, 0.35),
        },
        properties: { eventData: event },  // original event — not the jittered copy
      })
      entitiesRef.current.push(entity)
    })
  }, [viewer, events])

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      if (handlerRef.current && !handlerRef.current.isDestroyed()) handlerRef.current.destroy()
      if (dataSourceRef.current && viewer && !viewer.isDestroyed()) {
        viewer.dataSources.remove(dataSourceRef.current, false)
      }
      dataSourceRef.current = null
      entitiesRef.current   = []
    }
  }, []) // eslint-disable-line

  return null
}

export default function EventMarkers({ events, onEventClick, onEventHover }) {
  return (
    <EventMarkersErrorBoundary>
      <EventMarkersInner events={events} onEventClick={onEventClick} onEventHover={onEventHover} />
    </EventMarkersErrorBoundary>
  )
}
