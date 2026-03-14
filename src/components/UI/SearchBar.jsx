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
  const { setSelectedEvent, setCameraFly } = useMapStore()
  const inputRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(() => {
      const r = fuse.search(query).slice(0, 8)
      setResults(r.map(r => r.item))
      setOpen(true)
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (event) => {
    setSelectedEvent(event)
    setCameraFly({
      lat: event.location.lat,
      lng: event.location.lng,
      height: 120000,
    })
    // Update URL hash for deep-link sharing
    window.location.hash = `/event/${event.id}`
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-gray-800/90 backdrop-blur border border-gray-600 rounded-lg px-3 py-1.5 w-36 sm:w-64 focus-within:border-amber-500 transition-colors">
        <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search events, places, people..."
          className="bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none w-full"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]) }}
            className="text-gray-500 hover:text-gray-300"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900/98 backdrop-blur border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
          {results.map(event => (
            <button
              key={event.id}
              onMouseDown={() => handleSelect(event)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800 transition-colors text-left"
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: getCategoryColor(event.category) }}
              />
              <div className="min-w-0">
                <div className="text-sm text-gray-200 truncate">{event.title}</div>
                <div className="text-xs text-gray-500 truncate">
                  {event.reference.book} {event.reference.chapter} · {event.date_label}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
