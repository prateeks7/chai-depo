import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset URLs, so the build runs from any path (local preview, static host).
  base: './',
  plugins: [react()],
});
