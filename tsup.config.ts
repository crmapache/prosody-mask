import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
    target: 'es2020',
  },
  {
    // Framework wrappers ship ESM-only: their consumers are always bundler-based
    // (Vite/webpack/Rollup), so there's no CJS-only React/Vue user to serve.
    entry: {
      'react/index': 'src/react/index.tsx',
      'vue/index': 'src/vue/index.ts',
      'svelte/index': 'src/svelte/index.ts',
      'web-component/index': 'src/web-component/index.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    treeshake: true,
    target: 'es2020',
    // Framework runtimes stay (peer) dependencies of the consumer, never bundled in.
    external: ['react', 'react/jsx-runtime', 'vue'],
    esbuildOptions(options) {
      options.jsx = 'automatic'
    },
  },
])
