// Cliente HTTP compartilhado pelos microfrontends. O frontend fala SOMENTE com o Gateway/BFF,
// nunca direto com os microsserviços. A URL vem de VITE_API_URL no build (ex.: https://<gateway>.azurewebsites.net/api).
const DEFAULT_API_URL = 'http://localhost:5000/api';

export function resolveBaseUrl(value) {
  const fromEnv = value ?? (import.meta.env ? import.meta.env.VITE_API_URL : undefined);
  return (fromEnv || DEFAULT_API_URL).replace(/\/$/, '');
}

export function buildQuery(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const qs = new URLSearchParams(clean).toString();
  return qs ? `?${qs}` : '';
}

export function createApi({ baseUrl = resolveBaseUrl(), fetchImpl = (...args) => fetch(...args) } = {}) {
  async function request(endpoint, options = {}) {
    const res = await fetchImpl(`${baseUrl}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) {
      const detail = typeof data === 'object' && data ? data.error : null;
      throw new Error(detail || `O Gateway respondeu HTTP ${res.status}.`);
    }
    if (typeof data === 'string') {
      throw new Error('O Gateway respondeu em formato inválido (esperado JSON).');
    }
    return data;
  }

  const send = (method) => (endpoint, body) =>
    request(endpoint, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  const post = send('POST');
  const patch = send('PATCH');
  const del = send('DELETE');

  return {
    request,

    // Agregações do BFF
    getDashboard: () => request('/bff/dashboard'),
    getGatewayStatus: () => request('/bff/status'),

    // Dados de referência (servidos pelo BFF)
    getUnits: () => request('/units'),
    getResidents: () => request('/residents'),

    // Mercadinho (microsserviço MongoDB)
    getMarketProducts: (params = {}) => request(`/market/products${buildQuery(params)}`),
    createMarketProduct: (data) => post('/market/products', data),
    updateMarketProduct: (id, data) => patch(`/market/products/${id}`, data),
    deleteMarketProduct: (id) => del(`/market/products/${id}`),
    updateMarketStock: (id, data) => patch(`/market/products/${id}/stock`, data),
    checkoutMarket: (data) => post('/market/checkout', data),
    getMarketSales: () => request('/market/sales'),

    // Financeiro (microsserviço Azure SQL)
    getFinancialSummary: () => request('/financial/summary'),
    getFinancialTransactions: (params = {}) => request(`/financial/transactions${buildQuery(params)}`),
    createFinancialTransaction: (data) => post('/financial/transactions', data),
    updateFinancialTransaction: (id, data) => patch(`/financial/transactions/${id}`, data),
    deleteFinancialTransaction: (id) => del(`/financial/transactions/${id}`),
    payFinancialTransaction: (id) => patch(`/financial/transactions/${id}/pay`),

    // Linha de produtos (LPS) do Praticom original: nesta versão o Mercadinho está sempre ativo.
    getFeatures: async () => ({ ENABLE_MARKETPLACE: true }),
    updateFeature: async (feature, enabled) => ({ feature, enabled })
  };
}

export const api = createApi();
