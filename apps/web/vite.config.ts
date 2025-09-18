import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@\/(.*)$/,
        replacement: path.resolve(__dirname, '../../packages/ui/src/$1'),
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
      {
        find: '@dtinsight/molecule-core',
        replacement: path.resolve(__dirname, '../../packages/core/src'),
      },
      {
        find: '@dtinsight/molecule-ui',
        replacement: path.resolve(__dirname, '../../packages/ui/src'),
      },
    ],
  },
  server: {
    port: 3000,
  },
})

