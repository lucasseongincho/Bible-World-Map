import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import { useCesium } from 'resium'

// Interpolate a position along the full polyline at fraction t (0–1)
function interpolateAlongPath(positions, t) {
  if (positions.length === 0) return []
  if (t >= 1) return positions

  // Compute cumulative arc lengths
  const lengths = [0]
  for (let i = 1; i < positions.length; i++) {
    const dist = Cesium.Cartesian3.distance(positions[i - 1], positions[i])
    lengths.push(lengths[i - 1] + dist)
  }
  const total = lengths[lengths.length - 1]
  const target = total * t

  const result = []
  for (let i = 0; i < positions.length; i++) {
    if (lengths[i] < target) {
      result.push(positions[i])
    } else {
      // Interpolate between i-1 and i
      if (i === 0) {
        result.push(positions[0])
      } else {
        const segLen = lengths[i] - lengths[i - 1]
        const segT = segLen > 0 ? (target - lengths[i - 1]) / segLen : 0
        const interp = new Cesium.Cartesian3()
        Cesium.Cartesian3.lerp(positions[i - 1], positions[i], segT, interp)
        result.push(interp)
      }
      break
    }
  }
  return result
}

function JourneyPathsInner({ journeys, activeJourneys }) {
  const { viewer } = useCesium()
  const entityMapRef = useRef({}) // journeyId -> { line, labels[], dot }
  const animFrameRef = useRef({}) // journeyId -> { raf, startTime, positions }

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return

    // Remove any journeys that are no longer active
    Object.keys(entityMapRef.current).forEach(id => {
      if (!activeJourneys.includes(id)) {
        const group = entityMapRef.current[id]
        if (group) {
          if (group.line && !viewer.isDestroyed()) viewer.entities.remove(group.line)
          if (group.dot && !viewer.isDestroyed()) viewer.entities.remove(group.dot)
          group.labels.forEach(l => { if (!viewer.isDestroyed()) viewer.entities.remove(l) })
        }
        if (animFrameRef.current[id]) {
          cancelAnimationFrame(animFrameRef.current[id].raf)
          delete animFrameRef.current[id]
        }
        delete entityMapRef.current[id]
      }
    })

    // Add any newly active journeys
    activeJourneys.forEach(journeyId => {
      if (entityMapRef.current[journeyId]) return // already rendered

      const journey = journeys.find(j => j.id === journeyId)
      if (!journey || journey.waypoints.length < 2) return

      const color = Cesium.Color.fromCssColorString(journey.color)
      const positions = journey.waypoints.map(wp =>
        Cesium.Cartesian3.fromDegrees(wp.lng, wp.lat)
      )

      // Animated position array via CallbackProperty
      const ANIM_DURATION = 3000 // ms
      const startTime = performance.now()
      let currentPositions = [positions[0]]

      const positionsProp = new Cesium.CallbackProperty(() => {
        return currentPositions.length >= 2 ? currentPositions : null
      }, false)

      // Leading dot that follows the path tip
      const dotPosProp = new Cesium.CallbackProperty(() => {
        return currentPositions[currentPositions.length - 1] || positions[0]
      }, false)

      // Main path polyline
      const line = viewer.entities.add({
        polyline: {
          positions: positionsProp,
          width: 2.5,
          material: new Cesium.PolylineDashMaterialProperty({
            color: color.withAlpha(0.85),
            gapColor: Cesium.Color.TRANSPARENT,
            dashLength: 16,
            dashPattern: 0xFF00,
          }),
          clampToGround: false,
          arcType: Cesium.ArcType.GEODESIC,
        },
      })

      // Animated leading dot
      const dot = viewer.entities.add({
        position: dotPosProp,
        point: {
          pixelSize: 8,
          color: Cesium.Color.WHITE,
          outlineColor: color,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          heightReference: Cesium.HeightReference.NONE,
        },
      })

      // Waypoint labels — appear progressively
      const WAYPOINT_SIZE = 6
      const labels = journey.waypoints.map((wp, i) => {
        const pos = Cesium.Cartesian3.fromDegrees(wp.lng, wp.lat)
        // Show label only after path reaches this waypoint
        const showThreshold = i / (journey.waypoints.length - 1)

        return viewer.entities.add({
          position: pos,
          point: {
            pixelSize: WAYPOINT_SIZE,
            color: color,
            outlineColor: Cesium.Color.BLACK.withAlpha(0.6),
            outlineWidth: 1,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            show: new Cesium.CallbackProperty(() => {
              const elapsed = performance.now() - startTime
              const t = Math.min(elapsed / ANIM_DURATION, 1)
              return t >= showThreshold
            }, false),
          },
          label: {
            text: wp.label,
            font: '11px "Lato", sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -18),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            translucencyByDistance: new Cesium.NearFarScalar(800000, 1.0, 5000000, 0.0),
            show: new Cesium.CallbackProperty(() => {
              const elapsed = performance.now() - startTime
              const t = Math.min(elapsed / ANIM_DURATION, 1)
              return t >= showThreshold
            }, false),
          },
        })
      })

      entityMapRef.current[journeyId] = { line, dot, labels }

      // Drive the animation
      function animate() {
        // Bail out if the viewer was destroyed between frames
        if (viewer.isDestroyed()) return

        const elapsed = performance.now() - startTime
        const t = Math.min(elapsed / ANIM_DURATION, 1)
        currentPositions = interpolateAlongPath(positions, t)

        // Hide the dot once animation completes
        if (t >= 1) {
          dot.point.show = new Cesium.ConstantProperty(false)
          return
        }

        const rafId = requestAnimationFrame(animate)
        animFrameRef.current[journeyId] = { raf: rafId, startTime, positions }
      }

      const rafId = requestAnimationFrame(animate)
      animFrameRef.current[journeyId] = { raf: rafId, startTime, positions }
    })

    return () => {
      // Cleanup on unmount only — toggling is handled above
    }
  }, [viewer, journeys, activeJourneys])

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(animFrameRef.current).forEach(a => {
        if (a?.raf) cancelAnimationFrame(a.raf)
      })
      animFrameRef.current = {}
      // entities removed by Cesium when viewer is destroyed
    }
  }, [])

  return null
}

export default function JourneyPaths({ journeys, activeJourneys }) {
  return <JourneyPathsInner journeys={journeys} activeJourneys={activeJourneys} />
}
