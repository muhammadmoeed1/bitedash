import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API + websocket calls to the backend in dev so the frontend can use
      // same-origin relative URLs (no CORS juggling locally).
      '/api': { target: 'http://localhost:6006', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:6006', changeOrigin: true, ws: true },
    },
  },
})
