import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    rollupOptions: {
      output: {
        // Only pin the framework packages every single route needs into
        // one small, long-lived "react-vendor" chunk. Everything else that
        // used to get lumped into one giant "vendor" file (socket.io,
        // emoji-mart, radix-ui, framer-motion, react-icons, ...) is left
        // for Rollup to place automatically based on which lazy route
        // chunk actually imports it — so a first-time visitor on "/" only
        // downloads react + the landing page, not the whole chat app.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) {
              return 'react-vendor'
            }
            // leave everything else unassigned -> auto-chunked per route
          }
        },
      },
    },
  },
})