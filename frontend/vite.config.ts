import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'BizTrack',
        short_name: 'BizTrack',
        description: 'Purchase and sales management',
        theme_color: '#0b1220',
        background_color: '#f5f7fb',
        display: 'standalone',
        start_url: '/',
        icons: []
      },
      workbox: { navigateFallback: '/index.html' }
    })
  ],
})
