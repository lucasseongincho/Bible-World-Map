import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        { src: 'node_modules/cesium/Build/Cesium/Workers', dest: '' },
        { src: 'node_modules/cesium/Build/Cesium/ThirdParty', dest: '' },
        { src: 'node_modules/cesium/Build/Cesium/Assets', dest: '' },
        { src: 'node_modules/cesium/Build/Cesium/Widgets', dest: '' },
      ],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Bible World Map',
        short_name: 'BibleMap',
        description: 'Interactive 3D globe for exploring the Bible geographically — every verse has an address.',
        theme_color: '#0a0e1a',
        background_color: '#0a0e1a',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Cesium bundle exceeds Workbox's default 2 MB limit — raise to 6 MB
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // Cache all static assets aggressively
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Cache Cesium's worker scripts (large, rarely change)
        runtimeCaching: [
          {
            urlPattern: /\/Workers\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cesium-workers',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
            },
          },
          {
            urlPattern: /\/Assets\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cesium-assets',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          // Cache Bing/OSM map tiles
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-osm',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /^https:\/\/ecn\.t\d\.tiles\.virtualearth\.net\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-bing',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          // Cache Bible API responses
          {
            urlPattern: /^https:\/\/bible-api\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'bible-api',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
        ],
      },
    }),
  ],
  define: {
    CESIUM_BASE_URL: JSON.stringify('/'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Raise chunk warning limit — CesiumJS is inherently large
    chunkSizeWarningLimit: 6000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Cesium into its own chunk
          if (id.includes('node_modules/cesium') || id.includes('node_modules/resium')) {
            return 'cesium'
          }
          // React ecosystem
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react'
          }
          // Other vendor libs
          if (id.includes('node_modules/')) {
            return 'vendor'
          }
        },
      },
    },
  },
})
