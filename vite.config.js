import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  base: '/', // Served from the custom domain in CNAME, so assets resolve from the root
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    open: true
  }
})