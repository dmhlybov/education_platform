import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5175,
    allowedHosts: ['learning.smmwall.org'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8003',
      },
      '/health': 'http://127.0.0.1:8003',
      '/uploads': 'http://127.0.0.1:8003',
      '/scorm': 'http://127.0.0.1:8003',
    }
  }
});
