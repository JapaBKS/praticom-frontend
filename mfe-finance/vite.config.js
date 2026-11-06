import federation from '@originjs/vite-plugin-federation';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Microfrontend REMOTO: expõe a tela Financeiro para o shell via Module Federation.
// O build vai para ../dist/finance, publicado junto com o shell (mesmo site no Azure).
export default defineConfig({
  base: '/finance/',
  plugins: [
    react(),
    federation({
      name: 'finance',
      filename: 'remoteEntry.js',
      exposes: { './FinanceApp': './src/views/FinancialView.jsx' },
      shared: ['react', 'react-dom']
    })
  ],
  build: {
    target: 'esnext',
    modulePreload: false,
    cssCodeSplit: false,
    outDir: '../dist/finance',
    emptyOutDir: true
  },
  server: { port: 3002 },
  preview: { port: 3002 }
});
