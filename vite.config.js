import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // This repo lives on a Windows-mounted path (/mnt/c/...) under WSL2.
    // Chokidar's default native file-watching doesn't reliably see change
    // events on DrvFs mounts, so edits can silently fail to trigger HMR or
    // a public/ re-scan. Polling trades a little CPU for actually working.
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
})