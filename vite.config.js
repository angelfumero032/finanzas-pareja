import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Aplicar actualizaciones al instante: el SW nuevo toma el control
      // sin esperar a cerrar la app instalada
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Finanzas en pareja',
        short_name: 'Finanzas',
        description: 'Control de finanzas mensuales compartido en pareja.',
        lang: 'es',
        dir: 'ltr',
        theme_color: '#f2f2f7',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        // NOTA (Etapa 1): faltan los PNG reales del icono; se añaden en la Etapa 3.
        // Sin ellos la app funciona en dev; solo no se cachea el icono de instalación.
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
