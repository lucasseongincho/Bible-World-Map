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

// ── High-DPI canvas scale factor ──
// Draw at 4× so markers are razor-sharp on retina / HiDPI displays.
const SCALE = 4

// Module-level cache — one canvas per unique color
const markerCanvasCache = new Map()

/**
 * Parse a "#rrggbb" hex color into [r, g, b] 0-255 components.
 */
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

/**
 * Lighten an rgb color by mixing toward white.
 * @param {number[]} rgb  [r, g, b]
 * @param {number}   t    0 = original, 1 = white
 */
function lighten([r, g, b], t) {
  return `rgb(${Math.round(r + (255 - r) * t)},${Math.round(g + (255 - g) * t)},${Math.round(b + (255 - b) * t)})`
}
function darken([r, g, b], t) {
  return `rgb(${Math.round(r * (1 - t))},${Math.round(g * (1 - t))},${Math.round(b * (1 - t))})`
}
function rgba([r, g, b], a) {
  return `rgba(${r},${g},${b},${a})`
}

/**
 * Create a single high-quality circular map marker.
 *
 * Display size:  32 × 32  (billboard width/height)
 * Canvas pixels: 128 × 128  (4× scale → pixel-perfect on 4K/retina)
 *
 * Design:
 *  • Wide soft outer halo (category color, very transparent)
 *  • Crisp medium ring  (category color, semi-transparent)
 *  • Main filled circle  (radial gradient: light center → full color edge)
 *  • Thin white border ring
 *  • Glossy light-reflection overlay (top-left quadrant)
 *  • Small bright inner dot (center)
 */
function createMarkerCanvas(hexColor) {
  if (markerCanvasCache.has(hexColor)) return markerCanvasCache.get(hexColor)

  const D   = 32          // display diameter (pixels Cesium will render at)
  const PAD = 8           // padding around circle for glow to bleed into
  const W   = D + PAD * 2 // canvas display size
  const H   = W

  const canvas = document.createElement('canvas')
  canvas.width  = W * SCALE
  canvas.height = H * SCALE
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)

  const cx  = W / 2
  const cy  = H / 2
  const r   = D / 2                // circle radius
  const rgb = hexToRgb(hexColor)

  // ── 1. Outer soft halo ──
  {
    const grad = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r + PAD)
    grad.addColorStop(0,   rgba(rgb, 0.22))
    grad.addColorStop(0.5, rgba(rgb, 0.10))
    grad.addColorStop(1,   rgba(rgb, 0))
    ctx.beginPath()
    ctx.arc(cx, cy, r + PAD, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
  }

  // ── 2. Mid pulse ring ──
  {
    const grad = ctx.createRadialGradient(cx, cy, r - 2, cx, cy, r + 3)
    grad.addColorStop(0,   rgba(rgb, 0))
    grad.addColorStop(0.4, rgba(rgb, 0.35))
    grad.addColorStop(1,   rgba(rgb, 0))
    ctx.beginPath()
    ctx.arc(cx, cy, r + 3, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
  }

  // ── 3. Drop shadow ──
  ctx.shadowColor = rgba(rgb, 0.7)
  ctx.shadowBlur  = 6

  // ── 4. Main circle body — radial gradient (light upper-left → full color) ──
  {
    const grad = ctx.createRadialGradient(
      cx - r * 0.28, cy - r * 0.28, 0,
      cx, cy, r
    )
    grad.addColorStop(0,   lighten(rgb, 0.45))
    grad.addColorStop(0.5, hexColor)
    grad.addColorStop(1,   darken(rgb, 0.25))
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
  }

  ctx.shadowBlur = 0

  // ── 5. White border ring ──
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.90)'
  ctx.lineWidth   = 1.8
  ctx.stroke()

  // ── 6. Thin dark outer ring (depth) ──
  ctx.beginPath()
  ctx.arc(cx, cy, r + 0.8, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.lineWidth   = 1
  ctx.stroke()

  // ── 7. Glossy highlight (top-left reflection) ──
  {
    const grad = ctx.createRadialGradient(
      cx - r * 0.3, cy - r * 0.35, 0,
      cx - r * 0.1, cy - r * 0.1, r * 0.72
    )
    grad.addColorStop(0,   'rgba(255,255,255,0.55)')
    grad.addColorStop(0.55,'rgba(255,255,255,0.12)')
    grad.addColorStop(1,   'rgba(255,255,255,0)')
    ctx.beginPath()
    ctx.arc(cx, cy, r - 1.5, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
  }

  // ── 8. Center dot ──
  {
    const dotR = 4
    const grad = ctx.createRadialGradient(cx - 1, cy - 1, 0, cx, cy, dotR)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(1, 'rgba(255,255,255,0.7)')
    ctx.beginPath()
    ctx.arc(cx, cy, dotR, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
  }

  markerCanvasCache.set(hexColor, canvas)
  return canvas
}

/**
 * Cluster badge — shown when multiple events group together at low zoom.
 *
 * Display: 46 × 46
 * Design:
 *  • Outer soft halo ring (gold)
 *  • Dark navy main circle
 *  • Gold border ring
 *  • Inner faint radial gradient
 *  • Crisp count number (large, bold)
 */
function createClusterCanvas(count) {
  const D   = 46
  const PAD = 8
  const W   = D + PAD * 2

  const canvas = document.createElement('canvas')
  canvas.width  = W * SCALE
  canvas.height = W * SCALE
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)

  const cx = W / 2
  const cy = W / 2
  const r  = D / 2

  // ── Outer halo ──
  {
    const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r + PAD)
    grad.addColorStop(0,   'rgba(212,168,67,0.30)')
    grad.addColorStop(0.5, 'rgba(212,168,67,0.10)')
    grad.addColorStop(1,   'rgba(212,168,67,0)')
    ctx.beginPath()
    ctx.arc(cx, cy, r + PAD, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
  }

  // ── Shadow ──
  ctx.shadowColor = 'rgba(212,168,67,0.5)'
  ctx.shadowBlur  = 8

  // ── Main circle — deep navy ──
  {
    const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r)
    grad.addColorStop(0, '#1a2540')
    grad.addColorStop(1, '#0a0e1c')
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
  }

  ctx.shadowBlur = 0

  // ── Gold border ring ──
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = '#d4a843'
  ctx.lineWidth   = 2.2
  ctx.stroke()

  // ── Inner subtle ring ──
  ctx.beginPath()
  ctx.arc(cx, cy, r - 4, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(212,168,67,0.2)'
  ctx.lineWidth   = 1
  ctx.stroke()

  // ── Count label ──
  const label = count > 99 ? '99+' : String(count)
  const fontSize = count > 9 ? (count > 99 ? 11 : 13) : 16
  ctx.font         = `700 ${fontSize}px -apple-system, "Segoe UI", Arial, sans-serif`
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'

  // Subtle text shadow
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur  = 3
  ctx.fillStyle   = '#f0e6d0'
  ctx.fillText(label, cx, cy + 0.5)

  ctx.shadowBlur = 0

  // Tiny "events" label below
  if (count <= 99) {
    ctx.font      = `500 7px -apple-system, "Segoe UI", Arial, sans-serif`
    ctx.fillStyle = 'rgba(201,150,58,0.7)'
    ctx.fillText('events', cx, cy + fontSize * 0.72)
  }

  return canvas
}

// ── Billboard display dimensions ──
const MARKER_DISPLAY  = 48   // Cesium renders the billboard at this size (px)
const CLUSTER_DISPLAY = 62

function EventMarkersInner({ events, onEventClick, onEventHover }) {
  const { viewer } = useCesium()
  const handlerRef     = useRef(null)
  const entitiesRef    = useRef([])
  const dataSourceRef  = useRef(null)
  const onEventClickRef = useRef(onEventClick)
  const onEventHoverRef = useRef(onEventHover)
  useEffect(() => { onEventClickRef.current = onEventClick }, [onEventClick])
  useEffect(() => { onEventHoverRef.current = onEventHover }, [onEventHover])

  // Set up data source + interaction handler once
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return

    if (!dataSourceRef.current) {
      const ds = new Cesium.CustomDataSource('events')
      viewer.dataSources.add(ds)
      dataSourceRef.current = ds

      ds.clustering.enabled         = true
      ds.clustering.pixelRange      = 52
      ds.clustering.minimumClusterSize = 3

      ds.clustering.clusterEvent.addEventListener((clusteredEntities, cluster) => {
        cluster.billboard.show        = true
        cluster.label.show            = false
        cluster.billboard.id          = cluster
        cluster.billboard.verticalOrigin   = Cesium.VerticalOrigin.CENTER
        cluster.billboard.horizontalOrigin = Cesium.HorizontalOrigin.CENTER
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
        if (eventData) { onEventClickRef.current(eventData); return }
      }
      onEventClickRef.current(null)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    handlerRef.current.setInputAction((movement) => {
      const picked = viewer.scene.pick(movement.endPosition)
      if (Cesium.defined(picked) && picked.id) {
        const eventData = picked.id?.properties?.eventData?.getValue()
        if (eventData) {
          onEventHoverRef.current(eventData, { x: movement.endPosition.x, y: movement.endPosition.y })
          viewer.scene.canvas.style.cursor = 'pointer'
          return
        }
      }
      onEventHoverRef.current(null, null)
      viewer.scene.canvas.style.cursor = 'default'
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    return () => {
      if (handlerRef.current && !handlerRef.current.isDestroyed()) {
        handlerRef.current.destroy()
        handlerRef.current = null
      }
    }
  }, [viewer])

  // Rebuild entities whenever the filtered event list changes
  useEffect(() => {
    const ds = dataSourceRef.current
    if (!ds || !viewer || viewer.isDestroyed()) return

    ds.entities.removeAll()
    entitiesRef.current = []

    events.forEach(event => {
      const lat = event.location?.lat
      const lng = event.location?.lng
      if (!isValidCoord(lat, lng)) return

      const color  = getCategoryColor(event.category)
      const canvas = createMarkerCanvas(color)   // cached per color

      const entity = ds.entities.add({
        id:       event.id,
        name:     event.title,
        position: Cesium.Cartesian3.fromDegrees(lng, lat),
        billboard: {
          image:              canvas,
          width:              MARKER_DISPLAY,
          height:             MARKER_DISPLAY,
          verticalOrigin:     Cesium.VerticalOrigin.CENTER,
          horizontalOrigin:   Cesium.HorizontalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          // Scale smoothly from close-up to zoomed-out
          scaleByDistance:    new Cesium.NearFarScalar(8e5, 1.1, 1.2e7, 0.55),
          // Fade markers near the horizon
          translucencyByDistance: new Cesium.NearFarScalar(6e6, 1.0, 1.4e7, 0.4),
        },
        properties: { eventData: event },
      })
      entitiesRef.current.push(entity)
    })
  }, [viewer, events])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (handlerRef.current && !handlerRef.current.isDestroyed()) {
        handlerRef.current.destroy()
      }
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
