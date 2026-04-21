import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      nodePolyfills({
        include: ['events', 'buffer', 'process', 'util'],
        globals: {
          global: true,
          process: true,
          Buffer: true
        }
      }),
      vue(),
      tailwindcss()
    ],
    define: {
      // Já coberto pelo plugin, mas mantido se necessário
    }
  }
})
