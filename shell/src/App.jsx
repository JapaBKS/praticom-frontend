import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  DollarSign,
  Info,
  LayoutDashboard,
  Moon,
  ShoppingCart,
  Sun,
  X
} from 'lucide-react';
import RemoteBoundary from './components/RemoteBoundary.jsx';
import OverviewView from './views/OverviewView.jsx';

// Microfrontends remotos carregados via Module Federation (em tempo de execução).
const MarketApp = lazy(() => import('market/MarketApp'));
const FinanceApp = lazy(() => import('finance/FinanceApp'));

const VIEWS = {
  overview: { label: 'Visão geral', icon: LayoutDashboard, title: 'Visão geral', subtitle: 'Resumo agregado pelo BFF' },
  market: { label: 'Mercadinho & Estoque', icon: ShoppingCart, title: 'Mercadinho Autônomo', subtitle: 'Microfrontend remoto · microsserviço MongoDB' },
  financial: { label: 'Financeiro & Taxas', icon: DollarSign, title: 'Gestão Financeira', subtitle: 'Microfrontend remoto · microsserviço Azure SQL' }
};

export default function App() {
  const [currentView, setCurrentView] = useState('overview');
  const [theme, setTheme] = useState('dark');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const info = VIEWS[currentView];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">
            <Building2 size={24} />
          </div>
          <div className="brand-text">
            <h2>praticom</h2>
            <span>Gestão Condominial</span>
          </div>
        </div>

        <ul className="nav-links">
          {Object.entries(VIEWS).map(([id, item]) => {
            const Icon = item.icon;
            const isActive = currentView === id;
            return (
              <li key={id}>
                <button
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setCurrentView(id)}
                  style={{ width: '100%', background: isActive ? undefined : 'transparent', border: 'none', textAlign: 'left' }}
                >
                  <div className="nav-item-content">
                    <Icon size={19} />
                    <span>{item.label}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <div className="page-title">
              <h1>{info.title}</h1>
              <p>{info.subtitle}</p>
            </div>
          </div>
          <div className="topbar-right">
            <button
              className="theme-toggle-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Alternar tema claro/escuro"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <main className="content-body">
          {currentView === 'overview' && <OverviewView setCurrentView={setCurrentView} showToast={showToast} />}

          {currentView !== 'overview' && (
            <RemoteBoundary name={info.label}>
              <Suspense fallback={<div className="card">Carregando módulo...</div>}>
                {currentView === 'market' && <MarketApp showToast={showToast} />}
                {currentView === 'financial' && <FinanceApp showToast={showToast} />}
              </Suspense>
            </RemoteBoundary>
          )}
        </main>
      </div>

      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast"
            style={{
              borderLeft: toast.type === 'success' ? '4px solid var(--accent-success)'
                : toast.type === 'danger' ? '4px solid var(--accent-danger)'
                  : toast.type === 'warning' ? '4px solid var(--accent-warning)' : '4px solid var(--accent-primary)'
            }}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} color="var(--accent-success)" />}
            {(toast.type === 'danger' || toast.type === 'warning') && <AlertTriangle size={18} color={`var(--accent-${toast.type})`} />}
            {toast.type === 'info' && <Info size={18} color="var(--accent-primary)" />}
            <div style={{ flex: 1 }}>{toast.message}</div>
            <button
              style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
