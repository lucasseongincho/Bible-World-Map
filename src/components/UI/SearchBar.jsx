import { useState, useEffect, useRef } from 'react'
import Fuse from 'fuse.js'
import events from '../../data/events.json'
import useMapStore from '../../store/useMapStore'
import { getCategoryColor } from '../../utils/colorMap'

const fuse = new Fuse(events, {
  keys: ['title', 'description', 'reference.book', 'people', 'tags', 'location.name'],
  threshold: 0.3,
  includeScore: true,
})

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const { setSelectedEvent, setCameraFly, setSearchResults } = useMapStore()
  const inputRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSearchResults([])
      return
    }
    const timer = setTimeout(() => {
      const hits = fuse.search(query).slice(0, 8).map(r => r.item)
      setResults(hits)
      setSearchResults(hits)   // mirror to store so Globe shows only these on the map
      setOpen(true)
    }, 200)
    return () => clearTimeout(timer)
  }, [query]) // eslint-disable-line

  const handleSelect = (event) => {
    setSelectedEvent(event)
    setCameraFly({ lat: event.location.lat, lng: event.location.lng, height: 120000 })
    window.location.hash = `/event/${event.id}`
    setQuery('')
    setResults([])
    setSearchResults([])   // restore normal map filtering
    setOpen(false)
  }

  return (
    <div className="relative" style={{ width: 'clamp(180px, 30vw, 320px)' }}>
      {/* Input */}
      <div
        className="flex items-center gap-2.5"
        style={{
          padding: '7px 12px',
          background: focused ? 'rgba(201,150,58,0.06)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(201,150,58,0.4)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 8,
          transition: 'all 0.2s',
          boxShadow: focused ? '0 0 0 3px rgba(201,150,58,0.08)' : 'none',
        }}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          style={{ color: focused ? 'var(--gold)' : 'var(--text-muted)', flexShrink: 0, transition: 'color 0.2s' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { setFocused(true); results.length > 0 && setOpen(true) }}
          onBlur={() => { setFocused(false); setTimeout(() => setOpen(false), 200) }}
          onKeyDown={e => {
            if (e.key === 'Escape') { setQuery(''); setResults([]); setSearchResults([]); setOpen(false); inputRef.current?.blur() }
          }}
          placeholder="Search events, places, people…"
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 13,
            color: 'var(--ivory)',
            width: '100%',
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setSearchResults([]) }}
            style={{ color: 'var(--text-muted)', flexShrink: 0, padding: 2 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--ivory-dim)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results */}
      {open && results.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 overflow-hidden"
          style={{
            background: 'var(--panel-bg)',
            border: '1px solid var(--panel-border)',
            borderRadius: 10,
            boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,150,58,0.06)',
            animation: 'slideInUp 0.15s ease-out',
            zIndex: 1300,
          }}
        >
          {results.map((event, idx) => {
            const color = getCategoryColor(event.category)
            return (
              <button
                key={event.id}
                onMouseDown={() => handleSelect(event)}
                className="w-full flex items-center gap-3 text-left"
                style={{
                  padding: '9px 14px',
                  borderBottom: idx < results.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,150,58,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Category dot */}
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 5px ${color}80` }} />
                <div className="min-w-0 flex-1">
                  <div style={{ color: 'var(--ivory)', fontSize: 13, fontWeight: 600, marginBottom: 1 }} className="truncate">
                    {event.title}
                  </div>
                  <div style={{ color: 'var(--text-body)', fontSize: 11 }} className="truncate">
                    {event.reference.book} {event.reference.chapter} · {event.date_label}
                  </div>
                </div>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                  style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
