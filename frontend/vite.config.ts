import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // This exposes the server to the network
    port: 5174,
    proxy: {
      '/api/v2': {
        target: process.env.VITE_WEARABLES_SERVICE_URL || 'http://localhost:6644', // HCGateway API server
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
