import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Cohenix Warehouse',
        short_name: 'Cohenix WH',
        description: 'Cohenix Warehouse Management System',
        theme_color: '#1238B0',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'https://cohenix.com/favicon2.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: 'https://cohenix.com/favicon2.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cohenix.com/favicon2.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'https://cohenix.com/favicon2.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ]
});