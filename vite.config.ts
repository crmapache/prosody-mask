import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// The playground is a standalone Vite app that consumes the library from source
// (aliased below), so it always previews the latest core. `vite build` emits a
// static site into playground/dist, ready to deploy to Vercel on its own.
export default defineConfig({
  root: 'playground',
  resolve: {
    alias: {
      'prosody-mask': resolve(__dirname, 'src/index.ts'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
