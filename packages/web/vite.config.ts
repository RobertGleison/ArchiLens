import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Must match the server's default (packages/server/src/config.ts).
const DEFAULT_SERVER_PORT = 4317;
const serverPort = process.env.ARCHILENS_PORT ?? String(DEFAULT_SERVER_PORT);

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    proxy: {
      // changeOrigin rewrites Host to the server's, which its DNS-rebinding guard requires.
      '/api': { target: `http://127.0.0.1:${serverPort}`, changeOrigin: true },
    },
  },
});
