import { useEffect, useRef, useState } from 'react'
import useMapStore from '../../store/useMapStore'
import tours from '../../data/tours.json'
import events from '../../data/events.json'

const eventById = Object.fromEntries(events.map(e => [e.id, e]))

export default function TourPlayer() {
  const { activeTour, tourStep, setTourStep, endTour, setSelectedEvent, setCameraFly } = useMapStore()
  const [autoPlay, setAutoPlay] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const autoTimer = useRef(null)
  const countdownTimer = useRef(null)

  const tour = tours.find(t => t.id === activeTour)
  if (!tour) return null

  const step = tour.steps[tourStep]
  const event = step ? eventById[step.event_id] : null
  const isFirst = tourStep === 0
  const isLast = tourStep === tour.steps.length - 1

  // Fly camera and select event whenever step changes
  useEffect(() => {
    if (!step || !event) return
    setSelectedEvent(event)
    setCameraFly({
      lat: event.location.lat,
      lng: event.location.lng,
      height: step.camera_height ?? 200000,
    })
  }, [tourStep, activeTour]) // eslint-disable-line

  // Auto-play logic
  const AUTO_DELAY = 12 // seconds between steps
  const totalSteps = tour.steps.length
  // B5 fix: keep a ref so the timeout callback always reads the current step
  const tourStepRef = useRef(tourStep)
  useEffect(() => { tourStepRef.current = tourStep }, [tourStep])

  useEffect(() => {
    clearTimeout(autoTimer.current)
    clearInterval(countdownTimer.current)
    setCountdown(0)

    if (!autoPlay) return

    setCountdown(AUTO_DELAY)
    countdownTimer.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownTimer.current)
          return 0
        }
        return c - 1
      })
    }, 1000)

    autoTimer.current = setTimeout(() => {
      const current = tourStepRef.current
      const next = current + 1
      if (next >= totalSteps) {
        setAutoPlay(false)
      } else {
        setTourStep(next)
      }
    }, AUTO_DELAY * 1000)

    return () => {
      clearTimeout(autoTimer.current)
      clearInterval(countdownTimer.current)
    }
  }, [autoPlay, tourStep, totalSteps]) // eslint-disable-line

  const goTo = (index) => {
    setAutoPlay(false)
    setTourStep(index)
  }

  const handleClose = () => {
    setAutoPlay(false)
    setSelectedEvent(null)
    endTour()
  }

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl mx-4 sm:mx-auto px-4">
      <div className="bg-gray-900/97 backdrop-blur border border-amber-500/30 rounded-xl shadow-2xl overflow-hidden">

        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-center gap-2.5">
            <span className="text-amber-400 text-lg" aria-hidden>{tour.icon}</span>
            <div>
              <div className="font-cinzel text-sm font-semibold text-amber-200">{tour.title}</div>
              <div className="text-xs text-gray-400">
                Step {tourStep + 1} of {tour.steps.length}
                {event && <span className="ml-2 text-amber-600">· {event.title}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1"
            aria-label="Close tour"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step progress dots */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-1">
          {tour.steps.map((s, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === tourStep
                  ? 'bg-amber-400 w-6'
                  : i < tourStep
                  ? 'bg-amber-600/50 w-2.5 hover:bg-amber-500/70'
                  : 'bg-gray-700 w-2.5 hover:bg-gray-500'
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Narration */}
        <div className="px-4 py-3 max-h-24 sm:max-h-32 overflow-y-auto">
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{step?.narration}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-800">
          {/* Prev */}
          <button
            onClick={() => goTo(tourStep - 1)}
            disabled={isFirst}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </button>

          {/* Auto-play toggle */}
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
              autoPlay
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
            }`}
          >
            {autoPlay ? (
              <>
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Pause ({countdown}s)</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Auto-play</span>
              </>
            )}
          </button>

          {/* Next */}
          <button
            onClick={() => isLast ? handleClose() : goTo(tourStep + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors border border-amber-500/30"
          >
            {isLast ? 'Finish' : 'Next'}
            {!isLast && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
