import { defineConfig } from 'vite'
import react            from '@vitejs/plugin-react'
import tailwindcss      from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/uploads': {
        target: process.env.VITE_UPLOADS_PROXY,
        changeOrigin: true,
      },
    },
  },
})
