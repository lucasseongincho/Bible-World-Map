import { useState } from 'react'
import useMapStore from '../../store/useMapStore'
import journeys from '../../data/journeys.json'
import events from '../../data/events.json'

// Count events per category once at module level
const categoryCounts = events.reduce((acc, e) => {
  acc[e.category] = (acc[e.category] || 0) + 1
  return acc
}, {})

const LAYERS = [
  { key: 'oldTestament', label: 'Old Testament', color: '#F59E0B' },
  { key: 'newTestament', label: 'New Testament', color: '#22D3EE' },
  { key: 'journeys', label: 'Journeys', color: '#F97316' },
  { key: 'kingdoms', label: 'Kingdoms', color: '#8B5CF6' },
  { key: 'spread', label: 'Spread of Christianity', color: '#A78BFA' },
  { key: 'archaeology', label: 'Archaeological Sites', color: '#10B981' },
]

const CATEGORIES = [
  { key: 'creation', label: 'Creation / Origins', color: '#8B5CF6' },
  { key: 'covenant', label: 'Covenant / Promise', color: '#F59E0B' },
  { key: 'battle', label: 'Battle / War', color: '#EF4444' },
  { key: 'miracle', label: 'Miracle', color: '#3B82F6' },
  { key: 'prophecy', label: 'Prophecy', color: '#10B981' },
  { key: 'journey', label: 'Journey / Travel', color: '#F97316' },
  { key: 'birth-death', label: 'Birth / Death', color: '#EC4899' },
  { key: 'worship', label: 'Worship / Temple', color: '#6366F1' },
  { key: 'judgment', label: 'Judgment', color: '#DC2626' },
  { key: 'gospel', label: 'Gospel Event', color: '#FBBF24' },
  { key: 'apostolic', label: 'Apostolic', color: '#22D3EE' },
  { key: 'early-church', label: 'Early Church', color: '#A78BFA' },
]

const ALL_CATEGORY_KEYS = CATEGORIES.map(c => c.key)

const ALL_JOURNEY_IDS = journeys.map(j => j.id)

const PERSON_LABELS = {
  'abraham': 'Abraham',
  'moses': 'Moses / Exodus',
  'joseph-mary-jesus': 'Flight to Egypt',
  'jesus': 'Jesus',
  'paul': 'Paul',
  'john': 'John',
}

export default function LayerPanel() {
  const {
    layers, activeCategories, activeJourneys, spreadYear,
    layerPanelOpen, setLayerPanelOpen,
    toggleLayer, toggleCategory, resetCategories,
    toggleJourney, resetJourneys, setSpreadYear,
  } = useMapStore()
  const [categoriesExpanded, setCategoriesExpanded] = useState(false)
  const [journeysExpanded, setJourneysExpanded] = useState(false)

  const isCategoryOn = (key) => activeCategories === null || activeCategories.has(key)
  const allCatsOn = activeCategories === null

  const isJourneyOn = (id) => activeJourneys === null || activeJourneys.has(id)
  const allJourneysOn = activeJourneys === null

  return (
    <>
      {/* Panel — slides left/right independently */}
      <div
        className={`fixed left-0 top-16 z-30 w-52 transition-transform duration-300 ${
          layerPanelOpen ? 'translate-x-0' : '-translate-x-52'
        }`}
      >
      <div className="bg-gray-900/95 backdrop-blur border border-gray-700 rounded-r-lg shadow-xl w-52 max-h-[calc(100vh-5rem)] overflow-y-auto">
        {/* Layers section */}
        <div className="p-3 border-b border-gray-700">
          <div className="font-cinzel text-xs uppercase tracking-wider text-amber-500">Layers</div>
        </div>
        <div className="p-2 space-y-1">
          {LAYERS.map(layer => (
            <div key={layer.key}>
              <button
                onClick={() => toggleLayer(layer.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  layers[layer.key]
                    ? 'bg-gray-800 text-gray-100'
                    : 'text-gray-500 hover:bg-gray-800/50 hover:text-gray-400'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: layers[layer.key] ? layer.color : '#374151' }}
                />
                <span>{layer.label}</span>
                {layers[layer.key] && (
                  <svg className="w-3.5 h-3.5 ml-auto text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>

              {/* Spread year slider — inline under the Spread toggle */}
              {layer.key === 'spread' && layers.spread && (
                <div className="px-3 pb-2 pt-1">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>AD 30</span>
                    <span className="text-amber-400 font-medium">AD {spreadYear}</span>
                    <span>AD 500</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={500}
                    step={5}
                    value={spreadYear}
                    onChange={e => setSpreadYear(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #A78BFA ${((spreadYear - 30) / 470) * 100}%, #374151 ${((spreadYear - 30) / 470) * 100}%)`
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Journeys sub-filter — only when Journeys layer is on */}
        {layers.journeys && (
          <div className="border-t border-gray-700">
            <button
              onClick={() => setJourneysExpanded(!journeysExpanded)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-cinzel uppercase tracking-wider text-amber-500 hover:text-amber-400 transition-colors"
            >
              <span>Journey Routes</span>
              <div className="flex items-center gap-1.5">
                {!allJourneysOn && (
                  <span className="bg-amber-500/20 text-amber-400 rounded px-1 py-0.5 text-xs font-sans normal-case tracking-normal">
                    {activeJourneys?.size ?? 0}/{journeys.length}
                  </span>
                )}
                <svg
                  className={`w-3 h-3 transition-transform ${journeysExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {journeysExpanded && (
              <div className="pb-2">
                <div className="flex gap-2 px-3 pb-2">
                  <button
                    onClick={resetJourneys}
                    className="text-xs text-gray-400 hover:text-amber-400 transition-colors underline-offset-2 hover:underline"
                  >
                    All
                  </button>
                  <span className="text-gray-700">·</span>
                  <button
                    onClick={() => useMapStore.setState({ activeJourneys: new Set() })}
                    className="text-xs text-gray-400 hover:text-red-400 transition-colors underline-offset-2 hover:underline"
                  >
                    None
                  </button>
                </div>
                <div className="space-y-0.5 px-2">
                  {journeys.map(journey => {
                    const on = isJourneyOn(journey.id)
                    return (
                      <button
                        key={journey.id}
                        onClick={() => toggleJourney(journey.id, ALL_JOURNEY_IDS)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                          on ? 'text-gray-200' : 'text-gray-600 hover:text-gray-500'
                        }`}
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: on ? journey.color : '#374151' }}
                        />
                        <div className="text-left">
                          <div>{journey.title}</div>
                          <div className="text-gray-500 text-xs">{journey.reference}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Categories sub-filter section */}
        <div className="border-t border-gray-700">
          <button
            onClick={() => setCategoriesExpanded(!categoriesExpanded)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-cinzel uppercase tracking-wider text-amber-500 hover:text-amber-400 transition-colors"
          >
            <span>Event Types</span>
            <div className="flex items-center gap-1.5">
              {!allCatsOn && (
                <span className="bg-amber-500/20 text-amber-400 rounded px-1 py-0.5 text-xs font-sans normal-case tracking-normal">
                  {[...activeCategories].reduce((sum, k) => sum + (categoryCounts[k] ?? 0), 0)} shown
                </span>
              )}
              <svg
                className={`w-3 h-3 transition-transform ${categoriesExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {categoriesExpanded && (
            <div className="pb-2">
              <div className="flex gap-2 px-3 pb-2">
                <button
                  onClick={resetCategories}
                  className="text-xs text-gray-400 hover:text-amber-400 transition-colors underline-offset-2 hover:underline"
                >
                  All
                </button>
                <span className="text-gray-700">·</span>
                <button
                  onClick={() => useMapStore.setState({ activeCategories: new Set() })}
                  className="text-xs text-gray-400 hover:text-red-400 transition-colors underline-offset-2 hover:underline"
                >
                  None
                </button>
              </div>

              <div className="space-y-0.5 px-2">
                {CATEGORIES.map(cat => {
                  const on = isCategoryOn(cat.key)
                  return (
                    <button
                      key={cat.key}
                      onClick={() => toggleCategory(cat.key, ALL_CATEGORY_KEYS)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                        on ? 'text-gray-200' : 'text-gray-500 hover:text-gray-400'
                      }`}
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0 transition-all"
                        style={{ background: on ? cat.color : '#374151' }}
                      />
                      <span className="text-left flex-1">{cat.label}</span>
                      <span className={`text-xs tabular-nums ${on ? 'text-gray-500' : 'text-gray-700'}`}>
                        {categoryCounts[cat.key] ?? 0}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Toggle button — fixed independently so it stays visible when the panel is closed */}
      <button
        onClick={() => setLayerPanelOpen(!layerPanelOpen)}
        aria-label={layerPanelOpen ? 'Close layer panel' : 'Open layer panel'}
        className={`fixed top-20 z-30 bg-gray-900/95 border border-gray-700 rounded-r-md p-1.5 text-gray-400 hover:text-amber-400 transition-transform duration-300 ${
          layerPanelOpen ? 'translate-x-52' : 'translate-x-0'
        }`}
        style={{ left: 0 }}
      >
        <svg
          className={`w-4 h-4 transition-transform ${layerPanelOpen ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </>
  )
}
