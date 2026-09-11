import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// This file runs under Node, but the web package carries browser types, not
// Node's. One ambient line for the one global read here, rather than a whole
// @types/node dependency for it.
declare const process: { env: Record<string, string | undefined> }

// The frontend is static; everything that touches the working tree goes through
// the bridge service (see ../bridge).
export default defineConfig({
  server: {
    // 5173 by default, or the port a launcher assigns through PORT - so a
    // preview can run beside a dev server already holding 5173. Strict when
    // assigned: silently falling back to another port would leave the launcher
    // pointing at one that nothing is listening on.
    port: Number(process.env.PORT) || 5173,
    strictPort: Boolean(process.env.PORT),
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
})
