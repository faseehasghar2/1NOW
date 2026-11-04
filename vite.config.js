import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Project Pages URL: https://faseehasghar2.github.io/1NOW/
export default defineConfig({
  plugins: [react()],
  base: '/1NOW/',
});
