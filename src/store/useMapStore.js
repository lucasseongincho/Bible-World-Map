import { create } from 'zustand'

const useMapStore = create((set) => ({
  layers: {
    oldTestament: true,
    newTestament: true,
    journeys: true,
    kingdoms: false,
    spread: false,
    archaeology: false,
  },

  // Category sub-filters: null = all enabled; Set = only these categories shown
  activeCategories: null,

  // Journey IDs currently visible (null = all on)
  activeJourneys: null,
  timelineRange: { start: -4000, end: 500 },
  timelinePosition: null,

  // Spread of Christianity: year slider (30–500 AD)
  spreadYear: 100,

  // Camera fly-to: { lat, lng, height } — Globe watches and executes, then clears
  pendingCameraFly: null,
  selectedEvent: null,
  selectedPerson: null,
  cameraPosition: { lat: 31.5, lng: 35.0, height: 3000000 },
  layerPanelOpen: true,
  scripturePanelOpen: false,
  activeTour: null,
  tourStep: 0,
  searchQuery: '',
  searchResults: [],
  hoveredEvent: null,
  tooltipPosition: { x: 0, y: 0 },

  setSelectedEvent: (event) => set({ selectedEvent: event, scripturePanelOpen: !!event }),
  setHoveredEvent: (event, position) => set({ hoveredEvent: event, tooltipPosition: position || { x: 0, y: 0 } }),
  toggleLayer: (layer) => set((state) => ({ layers: { ...state.layers, [layer]: !state.layers[layer] } })),
  setTimelinePosition: (pos) => set({ timelinePosition: pos }),
  setLayerPanelOpen: (open) => set({ layerPanelOpen: open }),
  setScripturePanelOpen: (open) => set({ scripturePanelOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),

  toggleCategory: (category, allCategoryKeys) =>
    set((state) => {
      const current = state.activeCategories ?? new Set(allCategoryKeys)
      const next = new Set(current)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      if (next.size === allCategoryKeys.length) return { activeCategories: null }
      return { activeCategories: next }
    }),

  resetCategories: () => set({ activeCategories: null }),

  toggleJourney: (journeyId, allJourneyIds) =>
    set((state) => {
      const current = state.activeJourneys ?? new Set(allJourneyIds)
      const next = new Set(current)
      if (next.has(journeyId)) {
        next.delete(journeyId)
      } else {
        next.add(journeyId)
      }
      if (next.size === allJourneyIds.length) return { activeJourneys: null }
      return { activeJourneys: next }
    }),

  resetJourneys: () => set({ activeJourneys: null }),

  setSpreadYear: (year) => set({ spreadYear: year }),

  setCameraFly: (target) => set({ pendingCameraFly: target }),

  // Tour actions
  startTour: (tourId) => set({ activeTour: tourId, tourStep: 0 }),
  endTour: () => set({ activeTour: null, tourStep: 0 }),
  setTourStep: (step) => set({ tourStep: step }),
}))

export default useMapStore
