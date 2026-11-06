// Execução isolada do microfrontend (npm run dev -w mfe-market), sem o shell.
// Dentro do shell, quem é carregado é o módulo exposto no vite.config.js.
import React from 'react';
import ReactDOM from 'react-dom/client';
import MarketInventoryView from './views/MarketInventoryView.jsx';
import '../../shell/src/index.css';

const showToast = (message, type) => console.log(`[${type ?? 'info'}] ${message}`);
document.documentElement.setAttribute('data-theme', 'dark');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <main className="content-body">
      <MarketInventoryView showToast={showToast} />
    </main>
  </React.StrictMode>
);
