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

// Create a colored circle canvas for a marker
function createMarkerCanvas(color, size = 20) {
  const canvas = document.createElement('canvas')
  canvas.width = size * 2
  canvas.height = size * 2 + 8
  const ctx = canvas.getContext('2d')

  // Outer glow
  ctx.shadowColor = color
  ctx.shadowBlur = 8

  // Circle body
  ctx.beginPath()
  ctx.arc(size, size, size - 2, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  // White border
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'
  ctx.lineWidth = 2
  ctx.stroke()

  // White center dot
  ctx.shadowBlur = 0
  ctx.beginPath()
  ctx.arc(size, size, 4, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fill()

  return canvas
}

function createClusterCanvas(count, size = 22) {
  const canvas = document.createElement('canvas')
  canvas.width = size * 2
  canvas.height = size * 2
  const ctx = canvas.getContext('2d')

  // Glow
  ctx.shadowColor = '#F59E0B'
  ctx.shadowBlur = 10

  // Circle
  ctx.beginPath()
  ctx.arc(size, size, size - 2, 0, Math.PI * 2)
  ctx.fillStyle = '#92400E'
  ctx.fill()
  ctx.strokeStyle = '#F59E0B'
  ctx.lineWidth = 2
  ctx.stroke()

  // Count text
  ctx.shadowBlur = 0
  ctx.fillStyle = '#FEF3C7'
  ctx.font = `bold ${size * 0.75}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(count > 99 ? '99+' : String(count), size, size)

  return canvas
}

function EventMarkersInner({ events, onEventClick, onEventHover }) {
  const { viewer } = useCesium()
  const handlerRef = useRef(null)
  const entitiesRef = useRef([])
  const dataSourceRef = useRef(null)

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return

    // B8 fix: Reuse the same CustomDataSource across re-renders instead of
    // destroying and recreating it. Cesium throws destroy() errors when a
    // removed+destroyed ds is still referenced by a pending render frame.
    if (!dataSourceRef.current) {
      const ds = new Cesium.CustomDataSource('events')
      viewer.dataSources.add(ds)
      dataSourceRef.current = ds

      // Enable clustering (configure once)
      ds.clustering.enabled = true
      ds.clustering.pixelRange = 48
      ds.clustering.minimumClusterSize = 3

      // Custom cluster appearance
      ds.clustering.clusterEvent.addEventListener((clusteredEntities, cluster) => {
        cluster.billboard.show = true
        cluster.label.show = false
        cluster.billboard.id = cluster
        cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.CENTER
        cluster.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY
        const canvas = createClusterCanvas(clusteredEntities.length)
        cluster.billboard.image = canvas
        cluster.billboard.width = 44
        cluster.billboard.height = 44
      })
    }

    const ds = dataSourceRef.current
    // Clear existing entities before re-adding (no destroy)
    ds.entities.removeAll()
    entitiesRef.current = []

    // Add entities for each event
    events.forEach(event => {
      const lat = event.location?.lat
      const lng = event.location?.lng
      if (!isValidCoord(lat, lng)) {
        console.warn(`[EventMarkers] Skipping event "${event.id}" — invalid coordinates: lat=${lat}, lng=${lng}`)
        return
      }

      const color = getCategoryColor(event.category)
      const canvas = createMarkerCanvas(color)

      const entity = ds.entities.add({
        id: event.id,
        name: event.title,
        position: Cesium.Cartesian3.fromDegrees(lng, lat),
        billboard: {
          image: canvas,
          width: 28,
          height: 28,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.2, 1.5e7, 0.6),
        },
        properties: { eventData: event },
      })
      entitiesRef.current.push(entity)
    })

    // Set up screen space event handler for clicks and hover
    if (handlerRef.current) {
      handlerRef.current.destroy()
    }
    handlerRef.current = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

    handlerRef.current.setInputAction((click) => {
      const picked = viewer.scene.pick(click.position)
      if (Cesium.defined(picked) && picked.id) {
        const eventData = picked.id?.properties?.eventData?.getValue()
        if (eventData) {
          onEventClick(eventData)
          return
        }
      }
      onEventClick(null)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    handlerRef.current.setInputAction((movement) => {
      const picked = viewer.scene.pick(movement.endPosition)
      if (Cesium.defined(picked) && picked.id) {
        const eventData = picked.id?.properties?.eventData?.getValue()
        if (eventData) {
          onEventHover(eventData, {
            x: movement.endPosition.x,
            y: movement.endPosition.y,
          })
          viewer.scene.canvas.style.cursor = 'pointer'
          return
        }
      }
      onEventHover(null, null)
      viewer.scene.canvas.style.cursor = 'default'
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    return () => {
      if (handlerRef.current && !handlerRef.current.isDestroyed()) {
        handlerRef.current.destroy()
        handlerRef.current = null
      }
    }
  }, [viewer, events, onEventClick, onEventHover])

  // Full cleanup on unmount only: remove datasource without destroying it first
  useEffect(() => {
    return () => {
      if (handlerRef.current && !handlerRef.current.isDestroyed()) {
        handlerRef.current.destroy()
      }
      if (dataSourceRef.current && viewer && !viewer.isDestroyed()) {
        // Pass false — do NOT destroy the datasource, just remove it cleanly
        viewer.dataSources.remove(dataSourceRef.current, false)
      }
      dataSourceRef.current = null
      entitiesRef.current = []
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
