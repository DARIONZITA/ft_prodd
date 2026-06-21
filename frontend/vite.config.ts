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
    allowedHosts: ['ft_prodd'],
    host: true,
    proxy: {
      '/api': {
        target:  process.env.VITE_UPLOADS_PROXY,   // ← usa 127.0.0.1 em vez de localhost
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path.replace(/^\/api/, ''), // só se o backend não usar /api
      },
      '/uploads': {
        target: process.env.VITE_UPLOADS_PROXY,
        changeOrigin: true,
      },
    },
  },
})
