import React, { useEffect, useState } from 'react';
import { AlertTriangle, DollarSign, Package, Receipt, RefreshCw, ShoppingCart } from 'lucide-react';
import { api } from '../../../shared/api.js';

const money = (value) => `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const PAYMENT_LABEL = { PIX: 'Pix', CARD: 'Cartão', CONDO_FEE: 'Cota condominial' };

// Visão geral: UMA chamada ao BFF (/api/bff/dashboard), que agrega Mercadinho (MongoDB) e Financeiro (Azure SQL).
export default function OverviewView({ setCurrentView, showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setData(await api.getDashboard());
    } catch (err) {
      showToast(err.message || 'Erro ao carregar a visão geral.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const metrics = data?.metrics ?? {};
  const sales = data?.market?.recentSales ?? [];
  const lowStock = data?.market?.lowStock ?? [];

  return (
    <div>
      <div className="welcome-banner">
        <div>
          <h2 className="welcome-banner-title">Bem-vindo(a) ao PratiCom!</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Dados do Mercadinho e do Financeiro reunidos pelo BFF em uma única resposta.
          </p>
        </div>
        <button className="btn btn-suave" onClick={load} disabled={loading}>
          <RefreshCw size={16} /> {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {data?.warnings?.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-warning)', marginBottom: '20px' }}>
          <strong><AlertTriangle size={16} /> Parte dos dados indisponível</strong>
          <ul style={{ margin: '8px 0 0 18px', color: 'var(--text-muted)' }}>
            {data.warnings.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </div>
      )}

      <div className="metrics-grid">
        <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('financial')}>
          <div className="metric-icon-box" style={{ background: 'var(--accent-mint)', color: 'var(--accent-mint-text)' }}>
            <DollarSign size={26} />
          </div>
          <div className="metric-info">
            <h4>Saldo em caixa</h4>
            <div className="value">{metrics.balance === null || metrics.balance === undefined ? '—' : money(metrics.balance)}</div>
            <div className="subtext">Microsserviço Financeiro (Azure SQL)</div>
          </div>
        </div>

        <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('financial')}>
          <div className="metric-icon-box" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
            <Receipt size={26} />
          </div>
          <div className="metric-info">
            <h4>Em atraso</h4>
            <div className="value">{metrics.overdueAmount === null || metrics.overdueAmount === undefined ? '—' : money(metrics.overdueAmount)}</div>
            <div className="subtext">{metrics.overdueCount ?? 0} unidade(s) · inadimplência {metrics.defaultRate ?? 0}%</div>
          </div>
        </div>

        <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('market')}>
          <div className="metric-icon-box" style={{ background: 'var(--accent-info-bg)', color: 'var(--accent-info-text)' }}>
            <Package size={26} />
          </div>
          <div className="metric-info">
            <h4>Produtos no mercadinho</h4>
            <div className="value">{data?.market ? data.market.productsCount : '—'}</div>
            <div className="subtext">{metrics.lowStockItems ?? 0} abaixo do estoque mínimo</div>
          </div>
        </div>

        <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('financial')}>
          <div className="metric-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#d97706' }}>
            <ShoppingCart size={26} />
          </div>
          <div className="metric-info">
            <h4>Compras na cota a receber</h4>
            <div className="value">{data?.finance ? data.finance.pendingCondoBills.length : '—'}</div>
            <div className="subtext">Geradas pelo Service Bus</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '12px' }}>Últimas vendas do mercadinho</h3>
        {sales.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhuma venda registrada ainda.</p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Venda</th>
                  <th>Unidade</th>
                  <th>Morador</th>
                  <th>Pagamento</th>
                  <th>Total</th>
                  <th>Lançamento no Financeiro</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>#{sale.id}</td>
                    <td>{sale.block ? `${sale.block} - Apto ${sale.unit_number}` : '—'}</td>
                    <td>{sale.resident_name ?? '—'}</td>
                    <td>{PAYMENT_LABEL[sale.payment_method] ?? sale.payment_method}</td>
                    <td>{money(sale.total_amount)}</td>
                    <td>
                      {sale.financial_entry
                        ? <span className="badge badge-success">#{sale.financial_entry.id} · vence {sale.financial_entry.due_date}</span>
                        : sale.payment_method === 'CONDO_FEE'
                          ? <span className="badge badge-warning">aguardando mensagem</span>
                          : <span style={{ color: 'var(--text-dim)' }}>não se aplica</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {lowStock.length > 0 && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '8px' }}>Repor estoque</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            {lowStock.map((p) => `${p.name} (${p.stock_quantity})`).join(' • ')}
          </p>
        </div>
      )}
    </div>
  );
}
