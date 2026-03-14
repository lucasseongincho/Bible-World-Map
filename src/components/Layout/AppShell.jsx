import { useEffect, useState } from 'react'
import Globe from '../Globe/Globe'
import LayerPanel from '../UI/LayerPanel'
import ScripturePanel from '../UI/ScripturePanel'
import SearchBar from '../UI/SearchBar'
import Tooltip from '../UI/Tooltip'
import TimelineBar from '../UI/TimelineBar'
import TourPlayer from '../UI/TourPlayer'
import useMapStore from '../../store/useMapStore'
import events from '../../data/events.json'
import tours from '../../data/tours.json'

const eventById = Object.fromEntries(events.map(e => [e.id, e]))

export default function AppShell() {
  const { activeTour, startTour, setSelectedEvent, setCameraFly } = useMapStore()
  const [toursOpen, setToursOpen] = useState(false)

  // Deep-link: on mount, read hash and select the event
  useEffect(() => {
    const hash = window.location.hash
    const match = hash.match(/^#\/event\/(.+)$/)
    if (match) {
      const event = eventById[match[1]]
      if (event) {
        setSelectedEvent(event)
        setCameraFly({ lat: event.location.lat, lng: event.location.lng, height: 120000 })
      }
    }
  }, []) // eslint-disable-line

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-2 bg-gray-900/90 backdrop-blur border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <span className="text-amber-400 text-xs">✦</span>
          </div>
          <h1 className="font-cinzel text-base font-semibold text-amber-100 tracking-wide">
            Bible World Map
          </h1>
        </div>
        <SearchBar />
        <div className="flex items-center gap-3">
          {/* Tours menu */}
          <div className="relative">
            <button
              onClick={() => setToursOpen(!toursOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-cinzel text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="hidden sm:inline">Tours</span>
              <svg className={`w-3 h-3 transition-transform ${toursOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {toursOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-gray-900/98 backdrop-blur border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                <div className="p-2 border-b border-gray-800">
                  <div className="font-cinzel text-xs text-amber-500 uppercase tracking-wider px-2 py-1">Guided Tours</div>
                </div>
                {tours.map(tour => (
                  <button
                    key={tour.id}
                    onClick={() => {
                      startTour(tour.id)
                      setToursOpen(false)
                    }}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 hover:bg-gray-800 transition-colors text-left ${
                      activeTour === tour.id ? 'bg-amber-500/10' : ''
                    }`}
                  >
                    <span className="text-lg shrink-0 mt-0.5" aria-hidden>{tour.icon}</span>
                    <div className="min-w-0">
                      <div className="text-sm text-gray-200 font-medium">{tour.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">{tour.steps.length} stops · {tour.description.slice(0, 50)}…</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="font-cinzel text-xs text-gray-600 hidden lg:block">Every verse has an address</span>
        </div>
      </header>

      {/* Globe fills the full screen between header and timeline */}
      <div id="main-content" className="absolute inset-0 pt-12 pb-16" onClick={() => setToursOpen(false)}>
        <Globe />
      </div>

      {/* Layer Panel */}
      <LayerPanel />

      {/* Scripture Panel */}
      <ScripturePanel />

      {/* Tooltip */}
      <Tooltip />

      {/* Timeline Bar */}
      <TimelineBar />

      {/* Tour Player */}
      {activeTour && <TourPlayer />}
    </div>
  )
}
