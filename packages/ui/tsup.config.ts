import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true, // Enable DTS generation for proper type declarations
  splitting: false,
  sourcemap: true, // Enable sourcemap for better debugging
  clean: true,
  external: ['react', 'react-dom'],
  treeshake: true,
})

