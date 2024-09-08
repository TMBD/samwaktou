import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html'
    }
  },
  server: {
    open: true,
    port: 3000
  },
  // resolve: {
  //   alias: {
  //     '@': '/src'
  //   }
  // }
});
