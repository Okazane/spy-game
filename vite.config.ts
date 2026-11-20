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
      includeAssets: ['favicon.svg', 'icons/*.png', 'avatars/*.webp'],
      manifest: {
        name: 'Ai Là Gián Điệp? — Trò Chơi Hội Bạn Thân',
        short_name: 'Ai Là Gián Điệp',
        lang: 'vi',
        description: 'Trò chơi bàn tròn suy luận xã hội 3 phe (3–20 người) chơi chung trên 1 điện thoại — hoạt động 100% offline.',
        theme_color: '#FAF4E8',
        background_color: '#FAF4E8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
