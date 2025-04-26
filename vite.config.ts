import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: 'local.vocalsmash.com',
    port: 443,
    strictPort: true, // This will make Vite fail if port 443 is not available
    https: {
      key: fs.readFileSync('./certs/local.vocalsmash.com-key.pem'),
      cert: fs.readFileSync('./certs/local.vocalsmash.com.pem'),
    },
    hmr: {
      protocol: 'wss',
      host: 'local.vocalsmash.com',
      port: 443,
    },
    watch: {
      usePolling: true,  // Ensures consistent file watching across platforms
      interval: 100,     // Check for changes every 100ms
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Vocal Smash',
        short_name: 'VocalSmash',
        description: 'Real-time vocal pitch detection and visualization',
        theme_color: '#4F46E5',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        runtimeCaching: [{
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }]
      }
    })
  ],
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'] // Exclude WebAssembly modules from optimization
  }
})
