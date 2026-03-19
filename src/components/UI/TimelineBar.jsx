import { useRef, useState, useCallback } from 'react'
import useMapStore from '../../store/useMapStore'

const ERAS = [
  { label: 'Patriarchs',       start: -4000, end: -1500, hue: 35  },
  { label: 'Exodus',           start: -1500, end: -1200, hue: 42  },
  { label: 'Judges',           start: -1200, end: -1000, hue: 48  },
  { label: 'Kingdom',          start: -1000, end:  -930, hue: 25  },
  { label: 'Exile',            start:  -930, end:  -538, hue: 15  },
  { label: 'Return',           start:  -538, end:  -400, hue: 30  },
  { label: 'Intertestamental', start:  -400, end:    -5, hue: 20  },
  { label: 'Gospels',          start:    -5, end:    33, hue: 200 },
  { label: 'Acts',             start:    33, end:    70, hue: 210 },
  { label: 'Early Church',     start:    70, end:   500, hue: 220 },
]

const TOTAL_START = -4000
const TOTAL_END   =  500
const TOTAL_SPAN  = TOTAL_END - TOTAL_START

function yearToPercent(year) {
  return ((year - TOTAL_START) / TOTAL_SPAN) * 100
}
function formatYear(year) {
  if (year < 0) return `${Math.abs(year)} BC`
  return `AD ${year}`
}

export default function TimelineBar() {
  const { timelinePosition, setTimelinePosition } = useMapStore()
  const trackRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [hoverPct, setHoverPct] = useState(null)

  const positionToYear = useCallback((clientX) => {
    if (!trackRef.current) return null
    const rect = trackRef.current.getBoundingClientRect()
    const pct  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return Math.round(TOTAL_START + pct * TOTAL_SPAN)
  }, [])

  const handleTrackClick = (e) => {
    const year = positionToYear(e.clientX)
    if (year !== null) setTimelinePosition(timelinePosition === year ? null : year)
  }
  const handleMouseDown = (e) => {
    e.preventDefault()
    setDragging(true)
    const year = positionToYear(e.clientX)
    if (year !== null) setTimelinePosition(year)
  }
  const handleMouseMove = useCallback((e) => {
    const pct = trackRef.current
      ? Math.max(0, Math.min(100, ((e.clientX - trackRef.current.getBoundingClientRect().left) / trackRef.current.getBoundingClientRect().width) * 100))
      : null
    setHoverPct(pct)
    if (!dragging) return
    const year = positionToYear(e.clientX)
    if (year !== null) setTimelinePosition(year)
  }, [dragging, positionToYear, setTimelinePosition])

  const handleMouseUp      = useCallback(() => setDragging(false), [])
  const handleMouseLeave   = useCallback(() => { setDragging(false); setHoverPct(null) }, [])

  const handleTouchStart = useCallback((e) => {
    e.preventDefault(); setDragging(true)
    const year = positionToYear(e.touches[0].clientX)
    if (year !== null) setTimelinePosition(year)
  }, [positionToYear, setTimelinePosition])
  const handleTouchMove = useCallback((e) => {
    e.preventDefault()
    if (!dragging) return
    const year = positionToYear(e.touches[0].clientX)
    if (year !== null) setTimelinePosition(year)
  }, [dragging, positionToYear, setTimelinePosition])
  const handleTouchEnd = useCallback(() => setDragging(false), [])

  const thumbPct = timelinePosition !== null ? yearToPercent(timelinePosition) : null

  return (
    <div
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
        background: 'linear-gradient(to top, rgba(5,8,15,0.99) 0%, rgba(5,8,15,0.95) 100%)',
        borderTop: '1px solid rgba(201,150,58,0.12)',
        backdropFilter: 'blur(16px)',
        userSelect: 'none',
        height: 64,
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Era labels */}
      <div style={{ position: 'relative', height: 20, paddingLeft: 16, paddingRight: 16, overflow: 'hidden' }}
        className="hidden sm:block"
      >
        {ERAS.map(era => {
          const leftPct  = yearToPercent(era.start)
          const widthPct = yearToPercent(era.end) - leftPct
          return (
            <div
              key={era.label}
              style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `calc(${leftPct}% + 0px)`,
                width: `${widthPct}%`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{
                fontFamily: 'Cinzel, serif',
                fontSize: 9, letterSpacing: '0.08em',
                color: era.hue > 100 ? 'rgba(56,176,200,0.5)' : 'rgba(201,150,58,0.4)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'clip',
                padding: '0 2px',
                transition: 'color 0.2s',
              }}>
                {era.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Track */}
      <div style={{ padding: '0 16px' }}>
        <div
          ref={trackRef}
          style={{ position: 'relative', height: 32, cursor: dragging ? 'grabbing' : 'crosshair' }}
          onClick={handleTrackClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Track groove */}
          <div style={{
            position: 'absolute', top: '50%', left: 0, right: 0,
            height: 4, borderRadius: 2,
            transform: 'translateY(-50%)',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.06)',
          }}>
            {/* Era colour bands */}
            {ERAS.map((era) => {
              const lPct = yearToPercent(era.start)
              const wPct = yearToPercent(era.end) - lPct
              return (
                <div key={era.label} style={{
                  position: 'absolute', inset: 0,
                  left: `${lPct}%`, width: `${wPct}%`,
                  background: era.hue > 100
                    ? `hsla(${era.hue},60%,45%,0.35)`
                    : `hsla(${era.hue},55%,45%,0.35)`,
                }} />
              )
            })}

            {/* Active fill */}
            {thumbPct !== null && (
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: 0,
                width: `${thumbPct}%`,
                background: 'linear-gradient(to right, rgba(201,150,58,0.2), rgba(201,150,58,0.4))',
                transition: dragging ? 'none' : 'width 0.1s',
              }} />
            )}
          </div>

          {/* Year tick marks */}
          {[-4000, -3000, -2000, -1000, 0, 250, 500].map(y => (
            <div key={y} style={{
              position: 'absolute', top: '50%',
              left: `${yearToPercent(y)}%`,
              transform: 'translate(-50%, -50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              pointerEvents: 'none', gap: 3,
            }}>
              <div style={{ width: 1, height: 8, background: 'rgba(255,255,255,0.12)', marginTop: 2 }} />
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                {formatYear(y)}
              </span>
            </div>
          ))}

          {/* Thumb */}
          {thumbPct !== null && (
            <div style={{
              position: 'absolute', top: '50%',
              left: `${thumbPct}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10, pointerEvents: 'none',
            }}>
              {/* Tooltip label */}
              <div style={{
                position: 'absolute', bottom: '100%', left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: 6,
                background: 'var(--navy-mid)',
                border: '1px solid rgba(201,150,58,0.4)',
                borderRadius: 5,
                padding: '3px 8px',
                fontSize: 11, color: 'var(--gold)',
                fontFamily: 'Cinzel, serif',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}>
                {formatYear(timelinePosition)}
              </div>
              {/* Circle */}
              <div style={{
                width: 14, height: 14, borderRadius: '50%',
                background: 'var(--gold)',
                border: '2px solid var(--deep-navy)',
                boxShadow: '0 0 12px rgba(201,150,58,0.6)',
              }} />
            </div>
          )}

          {/* Hover ghost */}
          {hoverPct !== null && thumbPct === null && (
            <div style={{
              position: 'absolute', top: '50%',
              left: `${hoverPct}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              width: 10, height: 10, borderRadius: '50%',
              background: 'rgba(201,150,58,0.25)',
              border: '1px solid rgba(201,150,58,0.3)',
            }} />
          )}
        </div>
      </div>

      {/* Clear filter */}
      {timelinePosition !== null && (
        <button
          onClick={() => setTimelinePosition(null)}
          style={{
            position: 'absolute', right: 14, bottom: 6,
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11, color: 'var(--text-muted)',
            cursor: 'pointer', transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear filter
        </button>
      )}
    </div>
  )
}
