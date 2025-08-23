import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
  },
  base: "./",
  optimizeDeps: {
    exclude: ['lucide-react'],
     
  },
   server: {
    proxy: {
      '/api': 'http://localhost:4000', // or whatever port your backend runs on
    },
  },
});
