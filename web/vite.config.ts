import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The frontend is static; everything that touches the working tree goes through
// the bridge service (see ../bridge).
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
})
