import { defineConfig } from 'vite';

const proxyTarget = process.env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:8080';

export default defineConfig({
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 3000,
    strictPort: true
  }
});
