import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // relative base so the build works under any GitHub Pages subpath
  // (e.g. https://user.github.io/binpulse/); the app uses hash routing,
  // so no server-side base path is needed.
  base: './',
  plugins: [react()],
  server: { open: true, port: 5173 },
})
