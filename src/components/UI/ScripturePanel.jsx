import { useEffect, useState, useCallback } from 'react'
import useMapStore from '../../store/useMapStore'
import { fetchScripture } from '../../utils/scriptureApi'
import { getCategoryColor } from '../../utils/colorMap'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

const CATEGORY_LABELS = {
  'creation': 'Creation / Origins',
  'covenant': 'Covenant / Promise',
  'battle': 'Battle / War',
  'miracle': 'Miracle',
  'prophecy': 'Prophecy',
  'journey': 'Journey / Travel',
  'birth-death': 'Birth / Death',
  'worship': 'Worship / Temple',
  'judgment': 'Judgment',
  'gospel': 'Gospel Event',
  'apostolic': 'Apostolic',
  'early-church': 'Early Church',
}

export default function ScripturePanel() {
  const { selectedEvent, scripturePanelOpen, setSelectedEvent, setScripturePanelOpen } = useMapStore()
  const [scripture, setScripture] = useState(null)
  const [loading, setLoading] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!selectedEvent) return
    // Guard: skip API call if reference metadata is missing
    if (!selectedEvent.reference) {
      setScripture(null)
      setLoading(false)
      return
    }
    setScripture(null)
    setLoading(true)

    // B2: Cancel in-flight fetch when the selected event changes (rapid clicking)
    const controller = new AbortController()
    const { book, chapter, verse_start, verse_end } = selectedEvent.reference
    fetchScripture(book, chapter, verse_start, verse_end, controller.signal).then(data => {
      setScripture(data)
      setLoading(false)
    })
    // Update URL hash for deep-linking (but only if not already set by search/tour)
    if (!window.location.hash.includes(selectedEvent.id)) {
      window.location.hash = `/event/${selectedEvent.id}`
    }
    return () => controller.abort()
  }, [selectedEvent])

  const [copied, setCopied] = useState(false)

  const handleClose = () => {
    setSelectedEvent(null)
    setScripturePanelOpen(false)
    window.location.hash = ''
  }

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}#/event/${selectedEvent.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [selectedEvent])

  if (!selectedEvent) return null
  const color = getCategoryColor(selectedEvent.category)

  const positionClasses = isMobile
    ? 'fixed bottom-0 left-0 right-0 max-h-[65vh] z-40'
    : 'fixed right-0 top-0 h-full w-80 z-40'

  const transformClass = isMobile
    ? (scripturePanelOpen ? 'translate-y-0' : 'translate-y-full')
    : (scripturePanelOpen ? 'translate-x-0' : 'translate-x-full')

  return (
    <div
      className={`${positionClasses} transform transition-transform duration-300 ${transformClass}`}
    >
      {/* Drag handle — mobile only */}
      {isMobile && (
        <div className="flex justify-center pt-2 pb-1 bg-gray-900/95 rounded-t-xl">
          <div className="w-10 h-1 rounded-full bg-gray-600" />
        </div>
      )}
      <div className={`${isMobile ? 'max-h-[calc(65vh-1.5rem)]' : 'h-full'} bg-gray-900/95 backdrop-blur ${isMobile ? 'border-t' : 'border-l'} border-gray-700 flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700" style={{ borderLeftColor: color, borderLeftWidth: 4 }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color }}>
                {CATEGORY_LABELS[selectedEvent.category] || selectedEvent.category}
              </div>
              <h2 className="font-cinzel text-lg font-semibold text-amber-100 leading-tight">
                {selectedEvent.title}
              </h2>
              <div className="text-xs text-gray-400 mt-1">
                {selectedEvent.reference.book} {selectedEvent.reference.chapter}:{selectedEvent.reference.verse_start}
                {selectedEvent.reference.verse_end &&
                  selectedEvent.reference.verse_end !== selectedEvent.reference.verse_start
                  ? `–${selectedEvent.reference.verse_end}`
                  : ''}
              </div>
              <div className="text-xs text-amber-600 mt-0.5">{selectedEvent.date_label}</div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-300 transition-colors mt-1 shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Location */}
          <div className="px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{selectedEvent.location.name}</span>
              <span className="text-gray-600 capitalize">({selectedEvent.location.accuracy})</span>
            </div>
          </div>

          {/* Description */}
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-sm text-gray-300 leading-relaxed">{selectedEvent.description}</p>
          </div>

          {/* Scripture Text */}
          <div className="px-4 py-3">
            <h3 className="font-cinzel text-xs uppercase tracking-wider text-amber-500 mb-2">Scripture</h3>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </div>
            ) : scripture?.verses ? (
              <div>
                <div className="space-y-2">
                  {scripture.verses.map(v => (
                    <p key={v.verse} className="text-sm text-gray-200 leading-relaxed">
                      <sup className="text-amber-500 text-xs mr-1">{v.verse}</sup>
                      {v.text}
                    </p>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-600">{scripture.translation_name || 'KJV'}</div>
              </div>
            ) : scripture?.text ? (
              <p className="text-sm text-gray-200 leading-relaxed">{scripture.text}</p>
            ) : (
              <p className="text-sm text-gray-500 italic">Scripture unavailable</p>
            )}
          </div>

          {/* People */}
          {selectedEvent.people?.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-800">
              <h3 className="font-cinzel text-xs uppercase tracking-wider text-amber-500 mb-2">People</h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedEvent.people.map(person => (
                  <span
                    key={person}
                    className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300 capitalize"
                  >
                    {person.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {selectedEvent.tags?.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-800">
              <div className="flex flex-wrap gap-1.5">
                {selectedEvent.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-xs capitalize"
                    style={{ background: color + '20', color }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Copy link */}
          <div className="px-4 py-3 border-t border-gray-800">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-amber-400 transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-400">Link copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Copy link to this event
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
