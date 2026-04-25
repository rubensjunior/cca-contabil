import { defineConfig } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config
export default defineConfig({
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
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src')
    }
  }
});
