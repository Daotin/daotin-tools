import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 过渡版：只发一个注销自己的 service worker，把各设备上装着的旧版和它的缓存清掉。
      // 缓存外壳对这个站没用（四个工具打开都要拉 Supabase），只带来"部署完刷新不生效"。
      // 等设备都打开过一次，下一版把整个插件换成静态 manifest。
      selfDestroying: true,
      registerType: 'prompt',
      manifest: {
        name: 'Daotin 的工具箱',
        short_name: '工具箱',
        description: '个人小工具站',
        lang: 'zh-CN',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        // = DESIGN.md 的 --background 浅色值 oklch(0.965 0.012 285)
        theme_color: '#f2f2fb',
        background_color: '#f2f2fb',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 只预缓存外壳（构建产物），Supabase 的请求一律走网络、不缓存
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/rest\//, /^\/auth\//],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // 两个大依赖各自成 chunk：换版本时另一个的缓存不失效，主包也不再超 500 kB
        advancedChunks: {
          groups: [
            { name: 'react', test: /node_modules\/(react|react-dom|scheduler)\// },
            { name: 'supabase', test: /node_modules\/@supabase\// },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
})
