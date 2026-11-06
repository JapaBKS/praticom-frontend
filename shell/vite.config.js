import federation from '@originjs/vite-plugin-federation';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Microfrontend HOST (shell): menu, tema e notificações; carrega as telas remotas em tempo de execução.
// Por padrão os remotes ficam no mesmo site (/market e /finance). Para apontar para outro endereço,
// defina MARKET_REMOTE_URL / FINANCE_REMOTE_URL no build.
const marketRemote = process.env.MARKET_REMOTE_URL || '/market/assets/remoteEntry.js';
const financeRemote = process.env.FINANCE_REMOTE_URL || '/finance/assets/remoteEntry.js';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        market: marketRemote,
        finance: financeRemote
      },
      shared: ['react', 'react-dom']
    })
  ],
  build: {
    target: 'esnext',
    modulePreload: false,
    outDir: '../dist',
    emptyOutDir: true
  },
  // "vite preview" serve a pasta dist inteira (shell + remotes), igual ao Azure.
  preview: { port: 3000 },
  server: { port: 3000 }
});
