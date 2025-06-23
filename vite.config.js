import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  base: '/', // Replace 'Portfolio' with your GitHub repo name
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    open: true
  }
})