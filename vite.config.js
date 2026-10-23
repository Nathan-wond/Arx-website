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
      hmr: false,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        '.vercel.app',
        '.ngrok-free.dev',
        '.ngrok.io',
        '.ngrok.app',
        'hesitate-posting-nacho.ngrok-free.dev'
      ]
    },
    build: {
      rollupOptions: {
        input: path.resolve(import.meta.dirname, 'index.html')
      }
    }
  };
});
