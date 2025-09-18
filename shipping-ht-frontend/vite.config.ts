import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,  // For mobile testing
    port: 5173,
  },
  base: '/',  // For deployment
});