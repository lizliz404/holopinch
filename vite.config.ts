import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5188,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: new URL('./index.html', import.meta.url).pathname,
        zh: new URL('./zh/index.html', import.meta.url).pathname,
      },
    },
  },
});
