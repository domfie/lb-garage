import { defineConfig } from 'vite';
export default defineConfig({
  root: 'src',
  publicDir: '../public',
  base: '/lb-garage/',
  build: { outDir: '../dist', emptyOutDir: true, target: 'es2022' },
});
