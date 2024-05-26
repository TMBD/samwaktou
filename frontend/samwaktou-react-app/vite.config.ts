import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'build',
    rollupOptions: {
      input: 'public/index.html'
    }
  },
  server: {
    open: true
  },
  // resolve: {
  //   alias: {
  //     '@': '/src'
  //   }
  // }
});
