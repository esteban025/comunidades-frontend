// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server', // SSR por defecto para todas las páginas
  vite: {
    plugins: [tailwindcss()]
  }
});