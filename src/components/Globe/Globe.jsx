import { useRef, useEffect, useMemo, memo } from 'react'
import { Viewer } from 'resium'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import EventMarkers from './EventMarkers'
import JourneyPaths from './JourneyPaths'
import SpreadAnimation from './SpreadAnimation'
import KingdomOverlays from './KingdomOverlays'
import useMapStore from '../../store/useMapStore'
import { useShallow } from 'zustand/react/shallow'
import events from '../../data/events.json'
import journeys from '../../data/journeys.json'

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3NWQ0MGU3Mi0xZmJlLTQyNDgtODM0NS05NDM4MTllNTQ5ZTgiLCJpZCI6NDAzNDI2LCJpYXQiOjE3NzM0NjU3Mjh9.g06xzB1VfBC-HzGHf0SthCdybftmu6fO14O-L0I2PhI'

// B7: Override Cesium's default camera home to the Middle East / Jerusalem region
// This must be set BEFORE any Viewer is created — it controls the initial globe orientation
Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(25.0, 22.0, 55.0, 42.0)
Cesium.Camera.DEFAULT_VIEW_FACTOR = 0

// Timeline window: show events within ±200 years of the scrubbed position
const TIMELINE_WINDOW = 200

// Pre-compute all journey IDs once (static data)
const allJourneyIds = journeys.map(j => j.id)

export default memo(function Globe() {
  const viewerRef = useRef(null)
  const {
    layers, activeCategories, activeJourneys, timelinePosition, spreadYear,
    pendingCameraFly, setCameraFly, setSelectedEvent, setHoveredEvent,
  } = useMapStore(useShallow(state => ({
    layers: state.layers,
    activeCategories: state.activeCategories,
    activeJourneys: state.activeJourneys,
    timelinePosition: state.timelinePosition,
    spreadYear: state.spreadYear,
    pendingCameraFly: state.pendingCameraFly,
    setCameraFly: state.setCameraFly,
    setSelectedEvent: state.setSelectedEvent,
    setHoveredEvent: state.setHoveredEvent,
  })))

  // Execute camera fly-to when requested by store
  useEffect(() => {
    if (!pendingCameraFly || !viewerRef.current?.cesiumElement) return
    const viewer = viewerRef.current.cesiumElement
    if (viewer.isDestroyed()) return
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        pendingCameraFly.lng,
        pendingCameraFly.lat,
        pendingCameraFly.height ?? 200000
      ),
      duration: 2.0,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
    })
    setCameraFly(null)
  }, [pendingCameraFly, setCameraFly])

  // Memoize visible journey IDs — only recompute when journey state changes
  const visibleJourneyIds = useMemo(() => {
    if (!layers.journeys) return []
    return activeJourneys === null ? allJourneyIds : [...activeJourneys]
  }, [layers.journeys, activeJourneys])

  // Memoize filtered events — only recompute when filter state changes
  const filteredEvents = useMemo(() => events.filter(event => {
    if (event.testament === 'old' && !layers.oldTestament) return false
    if (event.testament === 'new' && !layers.newTestament) return false
    if (activeCategories !== null && !activeCategories.has(event.category)) return false
    if (timelinePosition !== null) {
      const year = parseInt(event.date_estimate, 10)
      if (!isNaN(year)) {
        if (year < timelinePosition - TIMELINE_WINDOW || year > timelinePosition + TIMELINE_WINDOW) return false
      }
    }
    return true
  }), [layers.oldTestament, layers.newTestament, activeCategories, timelinePosition])

  return (
    <Viewer
      ref={viewerRef}
      full
      animation={false}
      baseLayerPicker={false}
      fullscreenButton={false}
      geocoder={false}
      homeButton={false}
      infoBox={false}
      sceneModePicker={false}
      selectionIndicator={false}
      timeline={false}
      navigationHelpButton={false}
      navigationInstructionsInitiallyVisible={false}
      onReady={(viewer) => {
        // B7: Position the globe over the Middle East / Jerusalem region on load
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(35.0, 31.5, 3500000),
        })
      }}
    >
      <EventMarkers
        events={filteredEvents}
        onEventClick={setSelectedEvent}
        onEventHover={setHoveredEvent}
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
    </Viewer>
  )
})
