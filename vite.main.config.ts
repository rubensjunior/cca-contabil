import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['electron', 'sqlite3', 'better-sqlite3'],
    },
  },
  resolve: {
    // Load the Node.js entry.
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
});
