import { useState } from 'react'
import useMapStore from '../../store/useMapStore'
import journeys from '../../data/journeys.json'
import events from '../../data/events.json'

const categoryCounts = events.reduce((acc, e) => {
  acc[e.category] = (acc[e.category] || 0) + 1
  return acc
}, {})

const LAYERS = [
  { key: 'oldTestament',  label: 'Old Testament',          color: '#d4943a' },
  { key: 'newTestament',  label: 'New Testament',          color: '#38b0c8' },
  { key: 'journeys',      label: 'Journeys',               color: '#e07830' },
  { key: 'kingdoms',      label: 'Kingdoms',               color: '#9060c8' },
  { key: 'spread',        label: 'Spread of Christianity', color: '#a880e8' },
  { key: 'archaeology',   label: 'Archaeological Sites',   color: '#38b880' },
]

const CATEGORIES = [
  { key: 'creation',    label: 'Creation',        color: '#8B5CF6' },
  { key: 'covenant',    label: 'Covenant',         color: '#d4943a' },
  { key: 'battle',      label: 'Battle / War',     color: '#c84848' },
  { key: 'miracle',     label: 'Miracle',          color: '#3B82F6' },
  { key: 'prophecy',    label: 'Prophecy',         color: '#38b880' },
  { key: 'journey',     label: 'Journey',          color: '#e07830' },
  { key: 'birth-death', label: 'Birth / Death',    color: '#d04898' },
  { key: 'worship',     label: 'Worship',          color: '#6060c8' },
  { key: 'judgment',    label: 'Judgment',         color: '#b83030' },
  { key: 'gospel',      label: 'Gospel Event',     color: '#e8b840' },
  { key: 'apostolic',   label: 'Apostolic',        color: '#38b0c8' },
  { key: 'early-church',label: 'Early Church',     color: '#a880e8' },
]

const ALL_CATEGORY_KEYS = CATEGORIES.map(c => c.key)
const ALL_JOURNEY_IDS   = journeys.map(j => j.id)

export default function LayerPanel() {
  const {
    layers, activeCategories, activeJourneys, spreadYear,
    layerPanelOpen, setLayerPanelOpen,
    toggleLayer, toggleCategory, resetCategories,
    toggleJourney, resetJourneys, setSpreadYear,
  } = useMapStore()
  const [categoriesExpanded, setCategoriesExpanded] = useState(false)
  const [journeysExpanded,   setJourneysExpanded]   = useState(false)

  const isCategoryOn   = (key) => activeCategories === null || activeCategories.has(key)
  const allCatsOn      = activeCategories === null
  const isJourneyOn    = (id)  => activeJourneys  === null || activeJourneys.has(id)

  const panelW = 220

  return (
    <>
      {/* ── Panel ── */}
      <div
        className="fixed left-0 z-30"
        style={{
          top: 52,
          width: panelW,
          maxHeight: 'calc(100vh - 116px)',
          transform: layerPanelOpen ? 'translateX(0)' : `translateX(-${panelW}px)`,
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div
          className="overflow-y-auto"
          style={{
            background: 'var(--panel-bg)',
            border: '1px solid var(--panel-border)',
            borderLeft: 'none',
            borderRadius: '0 10px 10px 0',
            maxHeight: 'calc(100vh - 116px)',
            boxShadow: '8px 0 40px rgba(0,0,0,0.5)',
          }}
        >
          {/* Panel header */}
          <div style={{ padding: '12px 14px 10px' }}>
            <span
              className="font-cinzel"
              style={{ color: 'var(--gold)', fontSize: 9, letterSpacing: '0.2em' }}
            >
              MAP LAYERS
            </span>
          </div>
          <div className="gold-rule mx-3" />

          {/* Layer toggles */}
          <div style={{ padding: '8px 8px' }}>
            {LAYERS.map(layer => {
              const on = layers[layer.key]
              return (
                <div key={layer.key}>
                  <button
                    onClick={() => toggleLayer(layer.key)}
                    className="w-full flex items-center gap-2.5 text-left"
                    style={{
                      padding: '8px 10px',
                      borderRadius: 7,
                      background: on ? `${layer.color}12` : 'transparent',
                      border: `1px solid ${on ? `${layer.color}30` : 'transparent'}`,
                      marginBottom: 3,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                    onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Dot indicator */}
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: on ? layer.color : 'var(--panel-border)',
                      boxShadow: on ? `0 0 6px ${layer.color}80` : 'none',
                      transition: 'all 0.2s',
                    }} />
                    <span style={{
                      fontSize: 12.5,
                      color: on ? 'var(--ivory)' : 'var(--text-body)',
                      flex: 1,
                      transition: 'color 0.2s',
                    }}>
                      {layer.label}
                    </span>
                    {/* Toggle pill */}
                    <div style={{
                      width: 28, height: 15, borderRadius: 8,
                      background: on ? layer.color : 'rgba(255,255,255,0.08)',
                      position: 'relative',
                      flexShrink: 0,
                      transition: 'background 0.2s',
                    }}>
                      <div style={{
                        width: 11, height: 11, borderRadius: '50%',
                        background: on ? 'var(--deep-navy)' : 'rgba(255,255,255,0.3)',
                        position: 'absolute',
                        top: 2,
                        left: on ? 15 : 2,
                        transition: 'left 0.2s, background 0.2s',
                      }} />
                    </div>
                  </button>

                  {/* Spread year slider */}
                  {layer.key === 'spread' && layers.spread && (
                    <div style={{ padding: '2px 10px 8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
                        <span>AD 30</span>
                        <span style={{ color: 'var(--gold)', fontWeight: 600 }}>AD {spreadYear}</span>
                        <span>AD 500</span>
                      </div>
                      <input
                        type="range" min={30} max={500} step={5} value={spreadYear}
                        onChange={e => setSpreadYear(Number(e.target.value))}
                        style={{
                          width: '100%',
                          background: `linear-gradient(to right, #a880e8 ${((spreadYear - 30) / 470) * 100}%, rgba(255,255,255,0.1) ${((spreadYear - 30) / 470) * 100}%)`,
                        }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Journey Routes */}
          {layers.journeys && (
            <>
              <div className="gold-rule mx-3" />
              <button
                onClick={() => setJourneysExpanded(!journeysExpanded)}
                className="w-full flex items-center justify-between"
                style={{ padding: '10px 14px' }}
              >
                <span className="font-cinzel" style={{ color: 'var(--gold)', fontSize: 9, letterSpacing: '0.15em' }}>
                  JOURNEY ROUTES
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {activeJourneys !== null && (
                    <span style={{
                      background: 'rgba(201,150,58,0.15)',
                      color: 'var(--gold)',
                      borderRadius: 4, padding: '1px 6px', fontSize: 10,
                    }}>
                      {activeJourneys.size}/{journeys.length}
                    </span>
                  )}
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                    style={{ color: 'var(--text-muted)', transform: journeysExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {journeysExpanded && (
                <div style={{ padding: '0 8px 8px' }}>
                  {/* All / None */}
                  <div style={{ display: 'flex', gap: 8, padding: '0 6px 6px' }}>
                    <button onClick={resetJourneys}
                      style={{ fontSize: 11, color: 'var(--text-body)', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-body)'}
                    >All</button>
                    <span style={{ color: 'var(--text-muted)' }}>·</span>
                    <button onClick={() => useMapStore.setState({ activeJourneys: new Set() })}
                      style={{ fontSize: 11, color: 'var(--text-body)', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#c84848'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-body)'}
                    >None</button>
                  </div>
                  {journeys.map(journey => {
                    const on = isJourneyOn(journey.id)
                    return (
                      <button
                        key={journey.id}
                        onClick={() => toggleJourney(journey.id, ALL_JOURNEY_IDS)}
                        className="w-full flex items-center gap-2.5 text-left"
                        style={{ padding: '6px 8px', borderRadius: 6, transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                          background: on ? journey.color : 'var(--panel-border)',
                          boxShadow: on ? `0 0 4px ${journey.color}80` : 'none',
                        }} />
                        <div>
                          <div style={{ fontSize: 12, color: on ? 'var(--ivory)' : 'var(--text-muted)' }}>
                            {journey.title}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                            {journey.reference}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Event Types */}
          <div className="gold-rule mx-3" />
          <button
            onClick={() => setCategoriesExpanded(!categoriesExpanded)}
            className="w-full flex items-center justify-between"
            style={{ padding: '10px 14px' }}
          >
            <span className="font-cinzel" style={{ color: 'var(--gold)', fontSize: 9, letterSpacing: '0.15em' }}>
              EVENT TYPES
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {!allCatsOn && (
                <span style={{
                  background: 'rgba(201,150,58,0.15)',
                  color: 'var(--gold)',
                  borderRadius: 4, padding: '1px 6px', fontSize: 10,
                }}>
                  {[...activeCategories].reduce((s, k) => s + (categoryCounts[k] ?? 0), 0)} shown
                </span>
              )}
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                style={{ color: 'var(--text-muted)', transform: categoriesExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {categoriesExpanded && (
            <div style={{ padding: '0 8px 8px' }}>
              <div style={{ display: 'flex', gap: 8, padding: '0 6px 6px' }}>
                <button onClick={resetCategories}
                  style={{ fontSize: 11, color: 'var(--text-body)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-body)'}
                >All</button>
                <span style={{ color: 'var(--text-muted)' }}>·</span>
                <button onClick={() => useMapStore.setState({ activeCategories: new Set() })}
                  style={{ fontSize: 11, color: 'var(--text-body)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#c84848'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-body)'}
                >None</button>
              </div>
              {CATEGORIES.map(cat => {
                const on = isCategoryOn(cat.key)
                const count = categoryCounts[cat.key] ?? 0
                return (
                  <button
                    key={cat.key}
                    onClick={() => toggleCategory(cat.key, ALL_CATEGORY_KEYS)}
                    className="w-full flex items-center gap-2.5 text-left"
                    style={{ padding: '5px 8px', borderRadius: 6, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: on ? cat.color : 'var(--panel-border)',
                      boxShadow: on ? `0 0 4px ${cat.color}70` : 'none',
                      transition: 'all 0.2s',
                    }} />
                    <span style={{ fontSize: 12, color: on ? 'var(--ivory-dim)' : 'var(--text-muted)', flex: 1, transition: 'color 0.2s' }}>
                      {cat.label}
                    </span>
                    <span style={{ fontSize: 10, color: on ? 'var(--text-muted)' : 'var(--text-muted)', opacity: on ? 0.7 : 0.35, fontVariantNumeric: 'tabular-nums' }}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <div style={{ height: 8 }} />
        </div>
      </div>

      {/* ── Toggle tab ── */}
      <button
        onClick={() => setLayerPanelOpen(!layerPanelOpen)}
        aria-label={layerPanelOpen ? 'Close layer panel' : 'Open layer panel'}
        style={{
          position: 'fixed',
          top: 72,
          left: 0,
          zIndex: 30,
          background: 'var(--panel-bg)',
          border: '1px solid var(--panel-border)',
          borderLeft: 'none',
          borderRadius: '0 6px 6px 0',
          padding: '8px 6px',
          cursor: 'pointer',
          transform: layerPanelOpen ? `translateX(${panelW}px)` : 'translateX(0)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          color: 'var(--text-body)',
          display: 'flex',
          alignItems: 'center',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-body)'}
      >
        <svg
          width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          style={{ transform: layerPanelOpen ? 'rotate(0)' : 'rotate(180deg)', transition: 'transform 0.28s' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </>
  )
}
