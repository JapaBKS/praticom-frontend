import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuery, createApi, resolveBaseUrl } from '../shared/api.js';

function fakeFetch(responses) {
  const calls = [];
  const impl = async (url, options) => {
    calls.push({ url, options });
    const { status = 200, body = {}, type = 'application/json' } = responses.shift() ?? {};
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: { get: () => type },
      json: async () => body,
      text: async () => String(body)
    };
  };
  return { impl, calls };
}

test('resolveBaseUrl usa a URL informada (sem barra final) ou o padrão local', () => {
  assert.equal(resolveBaseUrl('https://gw.azurewebsites.net/api/'), 'https://gw.azurewebsites.net/api');
  assert.equal(resolveBaseUrl(''), 'http://localhost:5000/api');
});

test('buildQuery ignora filtros vazios', () => {
  assert.equal(buildQuery({ type: 'INCOME', status: '', category: undefined }), '?type=INCOME');
  assert.equal(buildQuery({}), '');
});

test('chamadas vão para o Gateway/BFF com método e corpo corretos', async () => {
  const { impl, calls } = fakeFetch([{ status: 201, body: { id: 1 } }, { body: [] }]);
  const api = createApi({ baseUrl: 'https://gw/api', fetchImpl: impl });

  await api.createMarketProduct({ name: 'Água', price: 4.5 });
  await api.getFinancialTransactions({ type: 'EXPENSE', status: '' });

  assert.equal(calls[0].url, 'https://gw/api/market/products');
  assert.equal(calls[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].options.body), { name: 'Água', price: 4.5 });
  assert.equal(calls[1].url, 'https://gw/api/financial/transactions?type=EXPENSE');
});

test('erro do Gateway vira exceção com a mensagem do backend', async () => {
  const { impl } = fakeFetch([{ status: 400, body: { error: 'Estoque insuficiente' } }]);
  const api = createApi({ baseUrl: 'https://gw/api', fetchImpl: impl });
  await assert.rejects(api.checkoutMarket({ items: [] }), /Estoque insuficiente/);
});

test('resposta que não é JSON é rejeitada', async () => {
  const { impl } = fakeFetch([{ body: '<html>', type: 'text/html' }]);
  const api = createApi({ baseUrl: 'https://gw/api', fetchImpl: impl });
  await assert.rejects(api.getUnits(), /formato inválido/);
});
