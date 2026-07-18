import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: { loader: { '.js': 'jsx' } },
  },
  server: {
    host: 'localhost',
    port: 5174,
    open: true,
  },
  build: {
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          utils: ['axios', 'date-fns', 'clsx', 'papaparse'],
        },
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
    extensions: ['.mjs', '.js', '.jsx', '.json'],
  },
});
