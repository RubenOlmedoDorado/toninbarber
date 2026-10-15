import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.png', 'logo-tonin.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Toñín Barber',
        short_name: 'Toñín Barber',
        description: 'Barbería urbana en San Fernando de Henares. Cortes precisos, degradados y arreglos de barba.',
        theme_color: '#F59E0B',
        background_color: '#121212',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
