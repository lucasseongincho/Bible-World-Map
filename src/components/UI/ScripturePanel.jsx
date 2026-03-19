import { useEffect, useRef, useState, useCallback } from 'react'
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
  'creation':    'Creation / Origins',
  'covenant':    'Covenant / Promise',
  'battle':      'Battle / War',
  'miracle':     'Miracle',
  'prophecy':    'Prophecy',
  'journey':     'Journey / Travel',
  'birth-death': 'Birth / Death',
  'worship':     'Worship / Temple',
  'judgment':    'Judgment',
  'gospel':      'Gospel Event',
  'apostolic':   'Apostolic',
  'early-church':'Early Church',
}

export default function ScripturePanel() {
  const { selectedEvent, scripturePanelOpen, setSelectedEvent, setScripturePanelOpen, setSearchResults } = useMapStore()
  const [scripture, setScripture] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const isMobile = useIsMobile()
  const retryRef = useRef(0)

  const loadScripture = useCallback((event, signal) => {
    if (!event?.reference) { setScripture(null); setLoading(false); setFetchError(false); return }
    setScripture(null)
    setLoading(true)
    setFetchError(false)
    const { book, chapter, verse_start, verse_end } = event.reference
    fetchScripture(book, chapter, verse_start, verse_end, signal)
      .then(data => { setScripture(data); setLoading(false) })
      .catch(err => { if (err?.name !== 'AbortError') { setLoading(false); setFetchError(true) } })
  }, [])

  useEffect(() => {
    if (!selectedEvent) return
    const controller = new AbortController()
    retryRef.current = 0
    loadScripture(selectedEvent, controller.signal)
    if (!window.location.hash.includes(selectedEvent.id)) {
      window.location.hash = `/event/${selectedEvent.id}`
    }
    return () => controller.abort()
  }, [selectedEvent, loadScripture])

  // Escape key to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && selectedEvent) handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }) // no deps — handleClose references selectedEvent

  const [copied, setCopied] = useState(false)

  const handleClose = () => {
    setSelectedEvent(null)
    setScripturePanelOpen(false)
    setSearchResults([])   // restore normal map filtering when panel is closed
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

  // Layout — desktop: below header (52px) and above timeline (64px)
  //           mobile: above timeline (64px) as bottom sheet
  const mobileStyle = {
    position: 'fixed', bottom: 64, left: 0, right: 0,
    maxHeight: 'calc(65vh - 64px)', zIndex: 1090,
    transform: scripturePanelOpen ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
  }
  const desktopStyle = {
    position: 'fixed', right: 0, top: 52,
    height: 'calc(100% - 116px)',
    width: 320, zIndex: 1090,
    transform: scripturePanelOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
  }

  return (
    <div style={isMobile ? mobileStyle : desktopStyle}>
      {/* Mobile drag handle */}
      {isMobile && (
        <div style={{
          display: 'flex', justifyContent: 'center', padding: '10px 0 6px',
          background: 'var(--panel-bg)',
          borderRadius: '14px 14px 0 0',
          borderTop: `1px solid ${color}40`,
        }}>
          <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
        </div>
      )}

      <div style={{
        background: 'var(--panel-bg)',
        borderLeft: isMobile ? 'none' : `1px solid var(--panel-border)`,
        borderTop: isMobile ? 'none' : 'none',
        height: isMobile ? `calc(65vh - 64px - 19px)` : '100%',
        maxHeight: isMobile ? `calc(65vh - 64px - 19px)` : '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: isMobile ? 'none' : '-12px 0 48px rgba(0,0,0,0.5)',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '16px 18px 14px',
          borderBottom: '1px solid var(--panel-border)',
          borderLeft: `3px solid ${color}`,
          background: `linear-gradient(to right, ${color}10 0%, transparent 60%)`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Category label */}
              <div style={{
                fontSize: 9, fontFamily: 'Cinzel, serif',
                letterSpacing: '0.18em', marginBottom: 6,
                color, textTransform: 'uppercase',
              }}>
                {CATEGORY_LABELS[selectedEvent.category] || selectedEvent.category}
              </div>
              {/* Event title */}
              <h2 style={{
                fontFamily: 'Cinzel, serif',
                fontSize: 16, fontWeight: 600, lineHeight: 1.3,
                color: 'var(--ivory)', marginBottom: 5,
              }}>
                {selectedEvent.title}
              </h2>
              {/* Reference + date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--text-body)' }}>
                  {selectedEvent.reference.book} {selectedEvent.reference.chapter}:{selectedEvent.reference.verse_start}
                  {selectedEvent.reference.verse_end &&
                   selectedEvent.reference.verse_end !== selectedEvent.reference.verse_start
                    ? `–${selectedEvent.reference.verse_end}` : ''}
                </span>
                <span style={{ fontSize: 11, color: 'var(--gold-dim)', fontStyle: 'italic' }}>
                  {selectedEvent.date_label}
                </span>
              </div>
            </div>
            {/* Close */}
            <button
              onClick={handleClose}
              style={{ color: 'var(--text-muted)', padding: 4, marginTop: 2, flexShrink: 0, cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--ivory)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>

          {/* Location */}
          <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span style={{ fontSize: 12, color: 'var(--text-body)' }}>{selectedEvent.location.name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>· {selectedEvent.location.accuracy}</span>
          </div>

          {/* Description */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 15, lineHeight: 1.7, color: 'var(--ivory-dim)',
            }}>
              {selectedEvent.description}
            </p>
          </div>

          {/* Scripture */}
          <div style={{ padding: '14px 18px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12
            }}>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: '0.18em', color: 'var(--gold)', textTransform: 'uppercase' }}>
                Scripture
              </span>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(201,150,58,0.2), transparent)' }} />
            </div>

            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid var(--gold)',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Loading…
              </div>
            ) : scripture?.verses ? (
              <div style={{
                background: 'rgba(201,150,58,0.04)',
                border: '1px solid rgba(201,150,58,0.12)',
                borderRadius: 8, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {scripture.verses.map(v => (
                    <p key={v.verse} style={{
                      fontFamily: 'Cormorant Garamond, Georgia, serif',
                      fontSize: 15.5, lineHeight: 1.75, color: 'var(--ivory)',
                    }}>
                      <sup style={{ color: 'var(--gold)', fontSize: 10, marginRight: 3, fontFamily: 'Cinzel, serif' }}>{v.verse}</sup>
                      {v.text}
                    </p>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'right' }}>
                  {scripture.translation_name || 'KJV'}
                </div>
              </div>
            ) : scripture?.text ? (
              <div style={{
                background: 'rgba(201,150,58,0.04)',
                border: '1px solid rgba(201,150,58,0.12)',
                borderRadius: 8, padding: '14px 16px',
              }}>
                <p style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: 15.5, lineHeight: 1.75, color: 'var(--ivory)',
                }}>
                  {scripture.text}
                </p>
              </div>
            ) : fetchError ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Could not load scripture.</p>
                <button
                  onClick={() => loadScripture(selectedEvent, new AbortController().signal)}
                  style={{
                    alignSelf: 'flex-start', fontSize: 12, padding: '5px 12px', borderRadius: 6,
                    background: 'rgba(201,150,58,0.1)', border: '1px solid rgba(201,150,58,0.25)',
                    color: 'var(--gold)', cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Scripture unavailable</p>
            )}
          </div>

          {/* People */}
          {selectedEvent.people?.length > 0 && (
            <div style={{ padding: '0 18px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: '0.18em', color: 'var(--gold)', textTransform: 'uppercase', margin: '12px 0 8px' }}>
                People
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedEvent.people.map(person => (
                  <span key={person} style={{
                    padding: '3px 9px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 20,
                    fontSize: 12, color: 'var(--ivory-dim)',
                    textTransform: 'capitalize',
                  }}>
                    {person.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {selectedEvent.tags?.length > 0 && (
            <div style={{ padding: '0 18px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {selectedEvent.tags.map(tag => (
                  <span key={tag} style={{
                    padding: '2px 8px',
                    background: `${color}15`,
                    border: `1px solid ${color}30`,
                    borderRadius: 4,
                    fontSize: 11, color,
                    textTransform: 'capitalize',
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Copy link */}
          <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={handleCopyLink}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
                color: copied ? '#38b880' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'color 0.2s',
              }}
              onMouseEnter={e => { if (!copied) e.currentTarget.style.color = 'var(--gold)' }}
              onMouseLeave={e => { if (!copied) e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              {copied ? (
                <>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Link copied!
                </>
              ) : (
                <>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Copy link to this event
                </>
              )}
            </button>
          </div>

          <div style={{ height: 16 }} />
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
