// Testes de arquitetura dos microfrontends: isolamento entre remotes, acesso só via BFF e contrato de federação.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APPS = ['shell', 'mfe-market', 'mfe-finance'];

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(jsx?|mjs)$/.test(entry.name) ? [path] : [];
  });
}

function imports(file) {
  const code = readFileSync(file, 'utf8');
  return [...code.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);
}

const filesOf = (app) => sourceFiles(join(ROOT, app, 'src'));
const read = (path) => readFileSync(join(ROOT, path), 'utf8');

test('nenhum microfrontend importa código-fonte de outro (só shared/ é comum)', () => {
  const problems = [];
  for (const app of APPS) {
    for (const file of filesOf(app)) {
      for (const spec of imports(file).filter((s) => s.startsWith('.'))) {
        const target = relative(ROOT, resolve(dirname(file), spec)).split(/[\\/]/)[0];
        const allowed = target === app || target === 'shared' || (target === 'shell' && spec.endsWith('.css'));
        if (!allowed) problems.push(`${relative(ROOT, file)} importa ${spec}`);
      }
    }
  }
  assert.deepEqual(problems, []);
});

test('telas não chamam fetch direto: todo acesso HTTP passa por shared/api.js', () => {
  const offenders = APPS.flatMap(filesOf).filter((f) => /\bfetch\s*\(/.test(readFileSync(f, 'utf8')));
  assert.deepEqual(offenders.map((f) => relative(ROOT, f)), []);
});

test('o frontend fala só com o Gateway/BFF, nunca com as portas dos microsserviços', () => {
  const all = [join(ROOT, 'shared', 'api.js'), ...APPS.flatMap(filesOf)];
  const offenders = all.filter((f) => /localhost:500[12]|market-service|finance-service/.test(readFileSync(f, 'utf8')));
  assert.deepEqual(offenders.map((f) => relative(ROOT, f)), []);
});

test('o shell só usa remotes que existem e expõem o módulo importado', () => {
  const shellConfig = read('shell/vite.config.js');
  const app = read('shell/src/App.jsx');
  const contracts = [
    { app: 'mfe-market', name: 'market', module: 'MarketApp', base: '/market/' },
    { app: 'mfe-finance', name: 'finance', module: 'FinanceApp', base: '/finance/' }
  ];
  for (const c of contracts) {
    const remoteConfig = read(`${c.app}/vite.config.js`);
    assert.match(remoteConfig, new RegExp(`name:\\s*'${c.name}'`), `${c.app} deve se chamar ${c.name}`);
    assert.match(remoteConfig, new RegExp(`'\\./${c.module}'`), `${c.app} deve expor ./${c.module}`);
    assert.match(remoteConfig, new RegExp(`base:\\s*'${c.base}'`), `${c.app} deve usar base ${c.base}`);
    assert.match(shellConfig, new RegExp(`${c.name}:\\s*\\w+`), `shell deve declarar o remote ${c.name}`);
    assert.match(app, new RegExp(`import\\('${c.name}/${c.module}'\\)`), `shell deve carregar ${c.name}/${c.module}`);
  }
});

test('react e react-dom são compartilhados (uma só instância do React)', () => {
  for (const app of APPS) {
    assert.match(read(`${app}/vite.config.js`), /shared:\s*\[\s*'react',\s*'react-dom'\s*\]/, app);
  }
});
