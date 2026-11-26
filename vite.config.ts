import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { attachGlobalWorldHub } from './globalHub.mjs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'speaksharp-global-ws-hub',
      configureServer(server) {
        if (server.httpServer) {
          attachGlobalWorldHub(server.httpServer);
        }
      },
    },
  ],
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: ['**/public/models/**'],
    },
  },
  preview: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
