import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'

const hmrHost = process.env.VITE_HMR_HOST
const hmrPort = process.env.VITE_HMR_PORT ? Number(process.env.VITE_HMR_PORT) : undefined

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listen on 0.0.0.0
    port: 5173,
    strictPort: true,
    hmr: {
      host: hmrHost,
      port: hmrPort,
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        stages: resolve(__dirname, 'index-stages.html'),
      },
    },
  },
})
