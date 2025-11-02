import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');

  const frontendPort = Number.parseInt(env.FRONTEND_PORT ?? '5173', 10);
  const backendPort = env.BACKEND_PORT ?? '3000';
  const defineEnv: Record<string, string> = {
    'process.env.VITE_API_BASE_URL':
      env.VITE_API_BASE_URL !== undefined ? JSON.stringify(env.VITE_API_BASE_URL) : 'undefined',
    'process.env.VITE_ORGANIZER_ID':
      env.VITE_ORGANIZER_ID !== undefined ? JSON.stringify(env.VITE_ORGANIZER_ID) : 'undefined'
  };

  return {
    root: __dirname,
    plugins: [react()],
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, '../shared')
      }
    },
    server: {
      port: frontendPort,
      proxy: {
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    define: defineEnv,
  };
});
