import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      // 1. Satellite Systems Reverse Proxy Gateway (Single-Origin Architecture)
      '/satellites/proxy/asset_inventory': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/satellites\/proxy\/asset_inventory/, '')
      },
      // When Asset Inventory scripts make API calls to their own endpoints
      '/api/devices': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/api/columns': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/api/import': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/api/logs': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/api/export': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/api/admin': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/api/events': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/login.html': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/view.html': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      // 2. Main TDS Backend API Proxy
      '/api': {
        target: 'http://localhost:5555',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1000
  },
  define: {
    'process.env': {}
  }
});
