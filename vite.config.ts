import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [tailwindcss()],
  server: { port: 4323, strictPort: true },
  preview: { port: 4323, strictPort: true },
  build: { rollupOptions: { input: ['index.html', 'preview.html'] } },
});
