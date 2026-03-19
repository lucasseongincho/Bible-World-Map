import { useEffect, useState } from 'react'
import Globe from '../Globe/Globe'
import LayerPanel from '../UI/LayerPanel'
import ScripturePanel from '../UI/ScripturePanel'
import SearchBar from '../UI/SearchBar'
import Tooltip from '../UI/Tooltip'
import TimelineBar from '../UI/TimelineBar'
import TourPlayer from '../UI/TourPlayer'
import useMapStore from '../../store/useMapStore'
import { useShallow } from 'zustand/react/shallow'
import events from '../../data/events.json'
import tours from '../../data/tours.json'

const eventById = Object.fromEntries(events.map(e => [e.id, e]))

export default function AppShell() {
  const { activeTour, startTour, setSelectedEvent, setCameraFly } = useMapStore(useShallow(state => ({
    activeTour: state.activeTour,
    startTour: state.startTour,
    setSelectedEvent: state.setSelectedEvent,
    setCameraFly: state.setCameraFly,
  })))
  const [toursOpen, setToursOpen] = useState(false)

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
    <div className="relative w-full h-full overflow-hidden" style={{ background: 'var(--deep-navy)' }}>

      {/* ── Header ── */}
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-0"
        style={{
          height: '52px',
          background: 'linear-gradient(to bottom, rgba(5,8,15,0.98) 0%, rgba(5,8,15,0.92) 100%)',
          borderBottom: '1px solid rgba(201,150,58,0.15)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Ornament mark */}
          <div
            className="relative flex items-center justify-center shrink-0"
            style={{
              width: 34, height: 34,
              background: 'radial-gradient(circle, rgba(201,150,58,0.18) 0%, transparent 70%)',
              border: '1px solid rgba(201,150,58,0.35)',
              borderRadius: '50%',
            }}
          >
            <span style={{ color: 'var(--gold)', fontSize: 14, lineHeight: 1 }}>✦</span>
          </div>
          <div>
            <h1
              className="font-cinzel font-semibold tracking-widest"
              style={{ color: 'var(--ivory)', fontSize: 13, letterSpacing: '0.12em', lineHeight: 1.2 }}
            >
              Bible World Map
            </h1>
            <p
              className="font-cinzel hidden lg:block"
              style={{ color: 'var(--gold-dim)', fontSize: 9, letterSpacing: '0.22em', marginTop: 1 }}
            >
              EVERY VERSE HAS AN ADDRESS
            </p>
          </div>
        </div>

        {/* Decorative left rule */}
        <div className="hidden md:block flex-1 mx-6" style={{ height: 1, background: 'linear-gradient(to right, rgba(201,150,58,0.15), transparent)' }} />

        {/* Search — centered */}
        <div className="flex-1 md:flex-none">
          <SearchBar />
        </div>

        {/* Decorative right rule */}
        <div className="hidden md:block flex-1 mx-6" style={{ height: 1, background: 'linear-gradient(to left, rgba(201,150,58,0.15), transparent)' }} />

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Tours dropdown */}
          <div className="relative">
            <button
              onClick={() => setToursOpen(!toursOpen)}
              className="flex items-center gap-2 font-cinzel transition-all"
              style={{
                padding: '6px 14px',
                background: toursOpen ? 'rgba(201,150,58,0.15)' : 'transparent',
                border: '1px solid rgba(201,150,58,0.25)',
                borderRadius: 6,
                color: toursOpen ? 'var(--gold-bright)' : 'var(--gold)',
                fontSize: 11,
                letterSpacing: '0.1em',
              }}
              onMouseEnter={e => { if (!toursOpen) e.currentTarget.style.background = 'rgba(201,150,58,0.08)' }}
              onMouseLeave={e => { if (!toursOpen) e.currentTarget.style.background = 'transparent' }}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="hidden sm:inline">Tours</span>
              <svg
                width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                style={{ transform: toursOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {toursOpen && (
              <div
                className="absolute right-0 top-full mt-2 overflow-hidden"
                style={{
                  width: 272,
                  background: 'var(--panel-bg)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: 10,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,150,58,0.08)',
                  animation: 'slideInUp 0.18s ease-out',
                }}
              >
                {/* Header */}
                <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--panel-border)' }}>
                  <span
                    className="font-cinzel"
                    style={{ color: 'var(--gold)', fontSize: 9, letterSpacing: '0.2em' }}
                  >
                    GUIDED TOURS
                  </span>
                </div>
                {tours.map(tour => (
                  <button
                    key={tour.id}
                    onClick={() => { startTour(tour.id); setToursOpen(false) }}
                    className="w-full text-left flex items-start gap-3 transition-colors"
                    style={{ padding: '10px 14px' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,150,58,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1.2, marginTop: 1 }}>{tour.icon}</span>
                    <div className="min-w-0">
                      <div style={{ color: 'var(--ivory)', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                        {tour.title}
                      </div>
                      <div style={{ color: 'var(--text-body)', fontSize: 11 }}>
                        {tour.steps.length} stops · {tour.description.slice(0, 48)}…
                      </div>
                    </div>
                    {activeTour === tour.id && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', marginTop: 5, shrink: 0, animation: 'goldPulse 2s infinite' }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Globe ── */}
      <div
        id="main-content"
        className="absolute inset-0"
        style={{ paddingTop: 52, paddingBottom: 64 }}
        onClick={() => setToursOpen(false)}
      >
        <Globe />
      </div>

      <LayerPanel />
      <ScripturePanel />
      <Tooltip />
      <TimelineBar />
      {activeTour && <TourPlayer />}
    </div>
  )
}
