import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/analyze':   'http://localhost:8000',
      '/health':    'http://localhost:8000',
      '/movements': 'http://localhost:8000',
      '/auth':      'http://localhost:8000',
    },
    headers: {
      // Required for SharedArrayBuffer used by some WASM runtimes
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision'],
  },
  assetsInclude: ['**/*.wasm', '**/*.task'],
})
