# 🌍 Bible World Map

> **Every verse has an address.**

An interactive 2D map for exploring the entire Bible geographically — trace the journeys of Abraham, Moses, Paul, and Jesus, filter events by timeline era, layer kingdoms and missionary spread, and read the scripture for any location, all in one place.

---

## ✨ Features

- 🗺️ **Interactive Map** — Smooth, zoomable map powered by Leaflet with terrain tiles + border overlays
- 📍 **Event Markers** — Thousands of geolocated biblical events from Genesis to Revelation
- 🔍 **Fuzzy Search** — Instantly find any person, place, or event with Fuse.js powered search
- 📖 **Scripture Panel** — Click any marker to read the linked Bible verse fetched from the Bible API
- 🕰️ **Timeline Bar** — Drag a scrubber across 4,500 years of biblical history (4000 BC → AD 500) with era labeling
- 🗂️ **Layer Panel** — Toggle Old/New Testament, journeys, kingdom overlays, and the early church spread animation
- 🚶 **Journey Paths** — Animated polyline routes for key figures (Moses, Paul, Jesus, Abraham, etc.)
- 👑 **Kingdom Overlays** — Polygon regions showing historical empires and kingdoms synced to the timeline
- 🌐 **Spread Animation** — Visualize the spread of early Christianity across the ancient world
- 🎠 **Guided Tours** — Auto-playing curated tours that fly you through key biblical narratives
- 📱 **PWA Ready** — Installable as a Progressive Web App with offline support
- ♿ **Accessible** — Skip-to-content link, keyboard navigation, and screen reader support

---

## 🛠️ Tech Stack

### Frontend Framework
| Technology | Version | Purpose |
|---|---|---|
| [React](https://react.dev/) | ^19 | UI component framework |
| [Vite](https://vitejs.dev/) | ^8 | Build tool & dev server |
| [React Router](https://reactrouter.com/) | ^7 | Client-side routing |

### Map & Visualization
| Technology | Version | Purpose |
|---|---|---|
| [Leaflet](https://leafletjs.com/) | ^1.9 | 2D interactive map engine |
| [React Leaflet](https://react-leaflet.js.org/) | ^5 | React bindings for Leaflet |
| [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) | ^1.5 | Marker clustering at low zoom |
| [Cesium](https://cesium.com/) / [Resium](https://resium.reearth.io/) | ^1.139 / ^1.19 | 3D globe engine (bundled) |

### State Management
| Technology | Version | Purpose |
|---|---|---|
| [Zustand](https://zustand-demo.pmnd.rs/) | ^5 | Lightweight global state store |

### Search
| Technology | Version | Purpose |
|---|---|---|
| [Fuse.js](https://www.fusejs.io/) | ^7 | Fuzzy search over events & locations |

### Styling & Design
| Technology | Version | Purpose |
|---|---|---|
| [Tailwind CSS](https://tailwindcss.com/) | ^4 | Utility-first CSS framework |
| CSS Custom Properties | — | Design tokens (gold, navy, etc.) |
| [Google Fonts — Cinzel](https://fonts.google.com/specimen/Cinzel) | — | Ancient-era typography |

### Data
| File | Contents |
|---|---|
| `events.json` | ~1,000+ geolocated biblical events with dates, categories, testament |
| `journeys.json` | Polyline paths for major biblical journeys |
| `locations.json` | Named biblical place database |
| `kingdoms.json` | Kingdom/empire polygon regions |
| `spread.json` | Early church spread animation waypoints |
| `tours.json` | Curated guided tour definitions |

### Tooling & DevOps
| Technology | Purpose |
|---|---|
| [Vite PWA Plugin](https://github.com/vite-pwa/vite-plugin-pwa) | Service worker & PWA manifest generation |
| [vite-plugin-static-copy](https://github.com/sapphi-red/vite-plugin-static-copy) | Copy Cesium static assets at build time |
| [ESLint](https://eslint.org/) | Code linting (react-hooks + react-refresh plugins) |
| [Vercel](https://vercel.com/) | Hosting & deployment with custom security headers |

### External APIs
| API | Purpose |
|---|---|
| [bible-api.com](https://bible-api.com/) | Fetch live scripture text by reference |
| [ArcGIS World Shaded Relief](https://www.arcgis.com/) | Terrain base tile layer |
| [CartoDB Voyager No Labels](https://carto.com/) | Border/coast overlay tile layer |

---

## 📁 Project Structure

```
bible-word-map/
├── public/                   # Static assets (favicon, PWA icons, OG image)
├── src/
│   ├── components/
│   │   ├── Globe/            # Map engine components
│   │   │   ├── Globe.jsx             # Main map container & filtering logic
│   │   │   ├── EventMarkers.jsx      # Clustered marker layer
│   │   │   ├── JourneyPaths.jsx      # Animated polyline routes
│   │   │   ├── KingdomOverlays.jsx   # Kingdom polygon layer
│   │   │   └── SpreadAnimation.jsx   # Early church spread visualizer
│   │   ├── UI/               # Interface components
│   │   │   ├── TimelineBar.jsx       # Draggable timeline scrubber
│   │   │   ├── LayerPanel.jsx        # Layer & category toggles
│   │   │   ├── SearchBar.jsx         # Fuzzy search input
│   │   │   ├── ScripturePanel.jsx    # Selected event + Bible verse panel
│   │   │   ├── TourPlayer.jsx        # Guided tour controls
│   │   │   └── Tooltip.jsx           # Hover tooltip
│   │   └── Layout/
│   │       └── AppShell.jsx          # Top-level layout & overlay composition
│   ├── data/                 # JSON data files (events, journeys, kingdoms…)
│   ├── store/
│   │   └── useMapStore.js    # Zustand global state (layers, selection, timeline)
│   ├── utils/                # Helper utilities
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css             # Global styles & CSS design tokens
├── index.html                # Entry HTML with SEO meta & PWA tags
├── vite.config.js
├── vercel.json               # Vercel routing & security headers
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm / yarn / pnpm

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/bible-word-map.git
cd bible-word-map

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🌐 Deployment

The project is configured for **Vercel** out of the box:

- `vercel.json` handles SPA rewrites (all routes → `index.html`)
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`
- Long-lived caching for static assets and Cesium workers

Simply connect the repo to Vercel and it deploys automatically on every push.

---

## 🗺️ Map Tile Layers

The map blends two tile layers for a historical aesthetic:

1. **ESRI World Shaded Relief** — Terrain base with elevation shading (no modern labels)
2. **CartoDB Voyager No Labels** — Subtle border and coastline overlay at 38% opacity

---

## 📜 License

MIT — feel free to use, fork, and contribute.

---

<p align="center">Made with ❤️ and a lot of scripture references.</p>
