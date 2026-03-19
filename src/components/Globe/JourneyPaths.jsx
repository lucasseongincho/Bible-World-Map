import { useEffect, useRef } from 'react'
import { Polyline, CircleMarker, Tooltip } from 'react-leaflet'

// Animated dashed path: the line draws in over ANIM_MS,
// then the dashes march along it continuously.
const ANIM_MS = 2200

function JourneyPath({ journey }) {
  const polylineRef = useRef(null)

  const latLngs = journey.waypoints.map(wp => [wp.lat, wp.lng])

  // Draw-in animation on mount
  useEffect(() => {
    const line = polylineRef.current
    if (!line) return

    // Small delay so the element is definitely in the DOM
    const id = setTimeout(() => {
      const el = line.getElement()
      if (!el) return
      const length = el.getTotalLength?.() ?? 2000

      el.style.transition    = 'none'
      el.style.strokeDasharray  = `${length}`
      el.style.strokeDashoffset = `${length}`

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition       = `stroke-dashoffset ${ANIM_MS}ms ease`
          el.style.strokeDashoffset = '0'

          // After draw-in finishes → switch to marching dashes
          setTimeout(() => {
            el.style.transition    = 'none'
            el.style.strokeDasharray  = '10 7'
            el.style.strokeDashoffset = '0'
            el.classList.add('journey-march')
          }, ANIM_MS + 100)
        })
      })
    }, 80)

    return () => clearTimeout(id)
  }, [journey.id])

  return (
    <>
      {/* Main path line */}
      <Polyline
        ref={polylineRef}
        positions={latLngs}
        pathOptions={{
          color:   journey.color,
          weight:  3,
          opacity: 0.88,
        }}
      />

      {/* Waypoint dots + labels */}
      {journey.waypoints.map((wp, i) => (
        <CircleMarker
          key={`${journey.id}-wp-${i}`}
          center={[wp.lat, wp.lng]}
          radius={4}
          pathOptions={{
            color:       '#ffffff',
            fillColor:   journey.color,
            fillOpacity: 1,
            weight:      1.5,
            opacity:     0.9,
          }}
        >
          <Tooltip
            permanent={false}
            direction="top"
            offset={[0, -6]}
            className="journey-tooltip"
          >
            {wp.label}
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  )
}

export default function JourneyPaths({ journeys, activeJourneys }) {
  const active = journeys.filter(j => activeJourneys.includes(j.id))
  return active.map(journey => (
    <JourneyPath key={journey.id} journey={journey} />
  ))
}
