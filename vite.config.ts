import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    // Force disable caching in development
    hmr: {
      overlay: true
    },
    // Disable browser caching
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      }
    }
  },
  base: '/',
  // Force clear cache on each build
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
})