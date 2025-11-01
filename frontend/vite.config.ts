import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const frontendPort = Number(process.env.FRONTEND_PORT ?? 5173);
const backendPort = process.env.BACKEND_PORT ?? 3000;

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    port: frontendPort,
    proxy: {
      '/api/events': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
