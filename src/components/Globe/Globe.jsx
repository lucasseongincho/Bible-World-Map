import { useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import EventMarkers from './EventMarkers'
import JourneyPaths from './JourneyPaths'
import KingdomOverlays from './KingdomOverlays'
import SpreadAnimation from './SpreadAnimation'
import useMapStore from '../../store/useMapStore'
import { useShallow } from 'zustand/react/shallow'
import events from '../../data/events.json'
import journeys from '../../data/journeys.json'
import tours from '../../data/tours.json'

const TIMELINE_WINDOW = 200
const allJourneyIds = journeys.map(j => j.id)

// Convert Cesium-style height (meters) to Leaflet zoom level
function heightToZoom(height) {
  if (!height) return 8
  return Math.max(3, Math.min(13, Math.round(16 - Math.log2(height / 500))))
}

// ── Inner controller: must live inside MapContainer to call useMap() ──
function MapController() {
  const map = useMap()
  const { pendingCameraFly, setCameraFly, setSelectedEvent } = useMapStore(useShallow(s => ({
    pendingCameraFly: s.pendingCameraFly,
    setCameraFly:     s.setCameraFly,
    setSelectedEvent: s.setSelectedEvent,
  })))

  // Fly to event location when requested by store
  useEffect(() => {
    if (!pendingCameraFly) return
    map.flyTo(
      [pendingCameraFly.lat, pendingCameraFly.lng],
      heightToZoom(pendingCameraFly.height),
      { duration: 1.4, easeLinearity: 0.3 }
    )
    setCameraFly(null)
  }, [pendingCameraFly]) // eslint-disable-line

  // Click on empty map → deselect event
  useEffect(() => {
    const handler = () => setSelectedEvent(null)
    map.on('click', handler)
    return () => map.off('click', handler)
  }, [map]) // eslint-disable-line

  return null
}

export default function Globe() {
  const {
    layers, activeCategories, activeJourneys, timelinePosition, spreadYear,
    activeTour, tourStep, searchResults,
    setSelectedEvent, setHoveredEvent,
  } = useMapStore(useShallow(state => ({
    layers:           state.layers,
    activeCategories: state.activeCategories,
    activeJourneys:   state.activeJourneys,
    timelinePosition: state.timelinePosition,
    spreadYear:       state.spreadYear,
    activeTour:       state.activeTour,
    tourStep:         state.tourStep,
    searchResults:    state.searchResults,
    setSelectedEvent: state.setSelectedEvent,
    setHoveredEvent:  state.setHoveredEvent,
  })))

  const activeTourEventId = useMemo(() => {
    if (!activeTour) return null
    const tour = tours.find(t => t.id === activeTour)
    return tour?.steps[tourStep]?.event_id ?? null
  }, [activeTour, tourStep])

  const visibleJourneyIds = useMemo(() => {
    if (!layers.journeys) return []
    return activeJourneys === null ? allJourneyIds : [...activeJourneys]
  }, [layers.journeys, activeJourneys])

  const filteredEvents = useMemo(() => {
    // Active search: show only matching results, ignore all layer/category/timeline filters
    if (searchResults.length > 0) return searchResults

    return events.filter(event => {
    if (event.testament === 'old' && !layers.oldTestament) return false
    if (event.testament === 'new' && !layers.newTestament) return false
    if (activeCategories !== null && !activeCategories.has(event.category)) return false
    if (timelinePosition !== null) {
      const year = parseInt(event.date_estimate, 10)
      if (!isNaN(year) && (year < timelinePosition - TIMELINE_WINDOW || year > timelinePosition + TIMELINE_WINDOW)) return false
    }
    return true
  })
  }, [searchResults, layers.oldTestament, layers.newTestament, activeCategories, timelinePosition])

  return (
    <MapContainer
      center={[31.5, 35.0]}
      zoom={6}
      minZoom={3}
      maxZoom={16}
      zoomControl={false}
      style={{ width: '100%', height: '100%', background: '#0a0e1c' }}
    >
      {/* Esri World Shaded Relief — terrain base, stays sharp to zoom 13 */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}"
        attribution=""
        maxNativeZoom={13}
        maxZoom={16}
        className="map-tiles-terrain"
      />
      {/* CartoDB Voyager (no labels) — country/coast borders without modern city names */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
        attribution=""
        maxNativeZoom={19}
        maxZoom={16}
        opacity={0.38}
        className="map-tiles-borders"
        subdomains="abcd"
      />

      <MapController />

      <EventMarkers
        events={filteredEvents}
        onEventClick={setSelectedEvent}
        onEventHover={setHoveredEvent}
        activeTourEventId={activeTourEventId}
      />
      <JourneyPaths
        journeys={journeys}
        activeJourneys={visibleJourneyIds}
      />
      {layers.kingdoms && (
        <KingdomOverlays timelinePosition={timelinePosition} />
      )}
      {layers.spread && (
        <SpreadAnimation year={spreadYear} />
      )}
    </MapContainer>
  )
}
