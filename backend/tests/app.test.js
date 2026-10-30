// Pruebas de la estructura base (issue #2). Correr con: npm test
process.env.NODE_ENV = 'test';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const App = require('../src/app/App');

let server;
let base;

before(() => {
  server = new App().listen(0); // puerto libre al azar
  base = `http://localhost:${server.address().port}/api`;
});

after(() => server.close());

test('GET /api/health responde 200 { status: "ok" }', async () => {
  const res = await fetch(`${base}/health`);
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(await res.json(), { status: 'ok' });
});

test('ruta inexistente responde 404 con { error }', async () => {
  const res = await fetch(`${base}/no-existe`);
  assert.strictEqual(res.status, 404);
  const body = await res.json();
  assert.ok(typeof body.error === 'string');
});

test('JSON mal formado responde 400 con { error }', async () => {
  const res = await fetch(`${base}/health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ esto no es json',
  });
  assert.strictEqual(res.status, 400);
  assert.ok((await res.json()).error);
});
