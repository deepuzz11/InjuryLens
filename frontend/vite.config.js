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
      // Required for SharedArrayBuffer used by MediaPipe WASM runtime.
      // same-origin-allow-popups lets OAuth pop-ups through while still
      // satisfying the COOP isolation requirement for SharedArrayBuffer.
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      // 'credentialless' satisfies the SharedArrayBuffer isolation requirement
      // without blocking CDN resources (e.g. MediaPipe models) that lack CORP headers.
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision'],
  },
  assetsInclude: ['**/*.wasm', '**/*.task'],
})
