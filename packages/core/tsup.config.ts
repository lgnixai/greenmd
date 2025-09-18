import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
<<<<<<< Current (Your changes)

    '@lginxai/greenmd-types',
    '@lginxai/greenmd-shared',
 
=======
    '@dtinsight/molecule-types',
    '@dtinsight/molecule-shared',
    '@dtinsight/molecule-core-legacy',
>>>>>>> Incoming (Background Agent changes)
    'zustand',
    'immer'
  ]
})