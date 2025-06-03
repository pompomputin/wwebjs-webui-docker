// vue-frontend/vue-whatsapp-frontend/vite.config.js
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 8787,        // Vite dev server port
    strictPort: true,
    proxy: {
      // Your existing HTTP API proxies
      '/auth': {
        target: 'http://localhost:3000', // Backend for HTTP
        changeOrigin: true,
      },
      '/session': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/sessions': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // WebSocket proxy for Socket.IO
      '/socket.io': {
        target: 'ws://localhost:3000', // Use ws:// for WebSocket target
        ws: true,                      // Enable WebSocket proxying
        changeOrigin: true             // Often needed
      }
    }
  }
})
