import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.')
      }
    },
    server: {
      hmr: false
    },
    build: {
      rollupOptions: {
        input: path.resolve(import.meta.dirname, 'index.html')
      }
    }
  };
});
