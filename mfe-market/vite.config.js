import federation from '@originjs/vite-plugin-federation';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Microfrontend REMOTO: expõe a tela de Mercadinho para o shell via Module Federation.
// O build vai para ../dist/market, publicado junto com o shell (mesmo site no Azure).
export default defineConfig({
  base: '/market/',
  plugins: [
    react(),
    federation({
      name: 'market',
      filename: 'remoteEntry.js',
      exposes: { './MarketApp': './src/views/MarketInventoryView.jsx' },
      shared: ['react', 'react-dom']
    })
  ],
  build: {
    target: 'esnext',
    modulePreload: false,
    cssCodeSplit: false,
    outDir: '../dist/market',
    emptyOutDir: true
  },
  server: { port: 3001 },
  preview: { port: 3001 }
});
