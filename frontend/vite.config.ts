import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // This exposes the server to the network
    port: 5174,
    proxy: {
      '/api/v1': {
        target: 'http://192.168.137.1:3000', // CloudCare Backend API server
        changeOrigin: true,
        secure: false,
      },
      '/api/v2': {
        target: 'http://10.44.0.82:6644', // HCGateway API server
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
