import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'fonts/**/*'],
      manifest: {
        name: 'Ai Là Gián Điệp? — Trò Chơi Hội Bạn Thân',
        short_name: 'Ai Là Gián Điệp',
        description: 'Trò chơi bàn tròn suy luận xã hội 3 phe (3–20 người) chơi chung trên 1 điện thoại.',
        theme_color: '#FAF4E8',
        background_color: '#FAF4E8',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
      },
    }),
  ],
})
