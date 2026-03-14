import { useRef, useState, useCallback } from 'react'
import useMapStore from '../../store/useMapStore'

const ERAS = [
  { label: 'Patriarchs', start: -4000, end: -1500 },
  { label: 'Exodus', start: -1500, end: -1200 },
  { label: 'Judges', start: -1200, end: -1000 },
  { label: 'Kingdom', start: -1000, end: -930 },
  { label: 'Exile', start: -930, end: -538 },
  { label: 'Return', start: -538, end: -400 },
  { label: 'Intertestamental', start: -400, end: -5 },
  { label: 'Gospels', start: -5, end: 33 },
  { label: 'Acts', start: 33, end: 70 },
  { label: 'Early Church', start: 70, end: 500 },
]

const TOTAL_START = -4000
const TOTAL_END = 500
const TOTAL_SPAN = TOTAL_END - TOTAL_START

function yearToPercent(year) {
  return ((year - TOTAL_START) / TOTAL_SPAN) * 100
}

function formatYear(year) {
  if (year < 0) return `${Math.abs(year)} BC`
  return `AD ${year}`
}

export default function TimelineBar() {
  const { timelinePosition, setTimelinePosition, timelineRange } = useMapStore()
  const trackRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [hoveredEra, setHoveredEra] = useState(null)

  const positionToYear = useCallback((clientX) => {
    if (!trackRef.current) return null
    const rect = trackRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return Math.round(TOTAL_START + pct * TOTAL_SPAN)
  }, [])

  const handleTrackClick = (e) => {
    const year = positionToYear(e.clientX)
    if (year !== null) {
      setTimelinePosition(timelinePosition === year ? null : year)
    }
  }

  const handleMouseDown = (e) => {
    e.preventDefault()
    setDragging(true)
    const year = positionToYear(e.clientX)
    if (year !== null) setTimelinePosition(year)
  }

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return
    const year = positionToYear(e.clientX)
    if (year !== null) setTimelinePosition(year)
  }, [dragging, positionToYear, setTimelinePosition])

  const handleMouseUp = useCallback(() => {
    setDragging(false)
  }, [])

  // B6: Touch support for mobile scrubbing
  const handleTouchStart = useCallback((e) => {
    e.preventDefault()
    setDragging(true)
    const year = positionToYear(e.touches[0].clientX)
    if (year !== null) setTimelinePosition(year)
  }, [positionToYear, setTimelinePosition])

  const handleTouchMove = useCallback((e) => {
    e.preventDefault()
    if (!dragging) return
    const year = positionToYear(e.touches[0].clientX)
    if (year !== null) setTimelinePosition(year)
  }, [dragging, positionToYear, setTimelinePosition])

  const handleTouchEnd = useCallback(() => {
    setDragging(false)
  }, [])

  const thumbPct = timelinePosition !== null ? yearToPercent(timelinePosition) : null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 bg-gray-900/95 backdrop-blur border-t border-gray-800 select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Era labels row — hidden on mobile */}
      <div className="relative h-5 px-4 overflow-hidden hidden sm:block">
        {ERAS.map(era => {
          const leftPct = yearToPercent(era.start)
          const widthPct = yearToPercent(era.end) - leftPct
          return (
            <div
              key={era.label}
              className="absolute top-0 bottom-0 flex items-center justify-center"
              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              onMouseEnter={() => setHoveredEra(era)}
              onMouseLeave={() => setHoveredEra(null)}
            >
              <span className="text-gray-500 text-xs font-cinzel truncate px-1 hover:text-amber-500 transition-colors cursor-default">
                {era.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Track */}
      <div className="px-4 pb-2">
        <div
          ref={trackRef}
          className="relative h-6 cursor-crosshair"
          onClick={handleTrackClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Track background */}
          <div className="absolute inset-y-2 left-0 right-0 bg-gray-800 rounded-full overflow-hidden">
            {/* Era color bands */}
            {ERAS.map((era, i) => {
              const leftPct = yearToPercent(era.start)
              const widthPct = yearToPercent(era.end) - leftPct
              const isOT = era.end <= 0
              return (
                <div
                  key={era.label}
                  className="absolute inset-y-0"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    background: isOT
                      ? `hsla(${40 + i * 5}, 60%, 40%, 0.25)`
                      : `hsla(${190 + i * 10}, 60%, 40%, 0.25)`,
                    borderRight: i < ERAS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none'
                  }}
                />
              )
            })}

            {/* Active fill up to thumb */}
            {thumbPct !== null && (
              <div
                className="absolute inset-y-0 left-0 bg-amber-500/30"
                style={{ width: `${thumbPct}%` }}
              />
            )}
          </div>

          {/* Major year labels */}
          {[-4000, -3000, -2000, -1000, 0, 250, 500].map(y => (
            <div
              key={y}
              className="absolute top-0 bottom-0 flex flex-col items-center justify-end pointer-events-none"
              style={{ left: `${yearToPercent(y)}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-px h-2 bg-gray-600 mb-0.5" />
              <span className="text-gray-600 text-xs whitespace-nowrap">{formatYear(y)}</span>
            </div>
          ))}

          {/* Thumb */}
          {thumbPct !== null && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 pointer-events-none"
              style={{ left: `${thumbPct}%` }}
            >
              <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-lg shadow-amber-500/50" />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 border border-amber-500/50 rounded px-1.5 py-0.5 text-xs text-amber-400 whitespace-nowrap">
                {formatYear(timelinePosition)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clear button */}
      {timelinePosition !== null && (
        <button
          onClick={() => setTimelinePosition(null)}
          className="absolute right-4 bottom-2 text-xs text-gray-500 hover:text-amber-400 transition-colors flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear filter
        </button>
      )}
    </div>
  )
}
