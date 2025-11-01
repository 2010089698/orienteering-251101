import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');

  const frontendPort = Number.parseInt(env.FRONTEND_PORT ?? '5173', 10);
  const backendPort = env.BACKEND_PORT ?? '3000';

  return {
    root: __dirname,
    plugins: [react()],
    server: {
      port: frontendPort,
      proxy: {
        '/events': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
