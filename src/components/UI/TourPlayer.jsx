import { useEffect, useRef, useState } from 'react'
import useMapStore from '../../store/useMapStore'
import tours from '../../data/tours.json'
import events from '../../data/events.json'

const eventById = Object.fromEntries(events.map(e => [e.id, e]))

export default function TourPlayer() {
  const { activeTour, tourStep, setTourStep, endTour, setSelectedEvent, setCameraFly } = useMapStore()
  const [autoPlay, setAutoPlay]   = useState(false)
  const [countdown, setCountdown] = useState(0)
  const autoTimer      = useRef(null)
  const countdownTimer = useRef(null)

  const tour = tours.find(t => t.id === activeTour)
  if (!tour) return null

  const step   = tour.steps[tourStep]
  const event  = step ? eventById[step.event_id] : null
  const isFirst = tourStep === 0
  const isLast  = tourStep === tour.steps.length - 1
  const AUTO_DELAY  = 12
  const totalSteps  = tour.steps.length
  const progressPct = ((tourStep) / (totalSteps - 1)) * 100

  const tourStepRef = useRef(tourStep)
  useEffect(() => { tourStepRef.current = tourStep }, [tourStep])

  useEffect(() => {
    if (!step || !event) return
    setSelectedEvent(event)
    setCameraFly({ lat: event.location.lat, lng: event.location.lng, height: step.camera_height ?? 200000 })
  }, [tourStep, activeTour]) // eslint-disable-line

  useEffect(() => {
    clearTimeout(autoTimer.current)
    clearInterval(countdownTimer.current)
    setCountdown(0)
    if (!autoPlay) return
    setCountdown(AUTO_DELAY)
    countdownTimer.current = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(countdownTimer.current); return 0 } return c - 1 })
    }, 1000)
    autoTimer.current = setTimeout(() => {
      const next = tourStepRef.current + 1
      if (next >= totalSteps) { setAutoPlay(false) } else { setTourStep(next) }
    }, AUTO_DELAY * 1000)
    return () => { clearTimeout(autoTimer.current); clearInterval(countdownTimer.current) }
  }, [autoPlay, tourStep, totalSteps]) // eslint-disable-line

  const goTo = (index) => { setAutoPlay(false); setTourStep(index) }
  const handleClose = () => { setAutoPlay(false); setSelectedEvent(null); endTour() }

  return (
    <div style={{
      position: 'fixed',
      bottom: 72,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 40,
      width: 'min(600px, calc(100vw - 32px))',
      animation: 'slideInUp 0.2s ease-out',
    }}>
      <div style={{
        background: 'rgba(5,8,15,0.97)',
        border: '1px solid rgba(201,150,58,0.25)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,150,58,0.06)',
        backdropFilter: 'blur(20px)',
      }}>

        {/* Progress bar */}
        <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', position: 'relative' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            width: `${progressPct}%`,
            background: 'linear-gradient(to right, rgba(201,150,58,0.6), var(--gold))',
            transition: 'width 0.4s ease',
            boxShadow: '2px 0 8px rgba(201,150,58,0.4)',
          }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'rgba(201,150,58,0.06)',
          borderBottom: '1px solid rgba(201,150,58,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>{tour.icon}</span>
            <div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 12, fontWeight: 600, color: 'var(--ivory)', letterSpacing: '0.04em' }}>
                {tour.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-body)', marginTop: 1 }}>
                Stop {tourStep + 1} of {totalSteps}
                {event && <span style={{ color: 'var(--gold-dim)', marginLeft: 6 }}>· {event.title}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{ color: 'var(--text-muted)', padding: 5, cursor: 'pointer', transition: 'color 0.2s', borderRadius: 6 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--ivory)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            aria-label="Close tour"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: 4, padding: '10px 16px 4px', flexWrap: 'wrap' }}>
          {tour.steps.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to step ${i + 1}`}
              style={{
                height: 4, borderRadius: 2,
                width: i === tourStep ? 20 : 8,
                background: i === tourStep
                  ? 'var(--gold)'
                  : i < tourStep
                  ? 'rgba(201,150,58,0.35)'
                  : 'rgba(255,255,255,0.12)',
                transition: 'all 0.25s',
                cursor: 'pointer',
                border: 'none',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Narration */}
        <div style={{ padding: '10px 16px 6px', maxHeight: 100, overflowY: 'auto' }}>
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 15, lineHeight: 1.7,
            color: 'var(--ivory-dim)',
          }}>
            {step?.narration}
          </p>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px 12px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          gap: 8,
        }}>
          {/* Prev */}
          <button
            onClick={() => goTo(tourStep - 1)}
            disabled={isFirst}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 7,
              fontSize: 13,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: isFirst ? 'rgba(255,255,255,0.2)' : 'var(--ivory-dim)',
              cursor: isFirst ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!isFirst) e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
            onMouseLeave={e => { if (!isFirst) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </button>

          {/* Auto-play */}
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 7, fontSize: 12,
              background: autoPlay ? 'rgba(201,150,58,0.15)' : 'transparent',
              border: `1px solid ${autoPlay ? 'rgba(201,150,58,0.3)' : 'rgba(255,255,255,0.06)'}`,
              color: autoPlay ? 'var(--gold)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {autoPlay ? (
              <>
                <svg width="11" height="11" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Pause ({countdown}s)</span>
              </>
            ) : (
              <>
                <svg width="11" height="11" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Auto-play</span>
              </>
            )}
          </button>

          {/* Next / Finish */}
          <button
            onClick={() => isLast ? handleClose() : goTo(tourStep + 1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 16px', borderRadius: 7, fontSize: 13,
              background: isLast ? 'rgba(56,176,128,0.15)' : 'rgba(201,150,58,0.15)',
              border: `1px solid ${isLast ? 'rgba(56,176,128,0.3)' : 'rgba(201,150,58,0.3)'}`,
              color: isLast ? '#38b880' : 'var(--gold)',
              cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {isLast ? 'Finish' : 'Next'}
            {!isLast && (
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
