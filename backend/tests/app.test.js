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

test('ErrorMiddleware traduce errores de Sequelize al formato del contrato', () => {
  const ErrorMiddleware = require('../src/middlewares/ErrorMiddleware');
  const t = (err) => ErrorMiddleware.traducirSequelize(err);

  assert.deepStrictEqual(
    t({ name: 'SequelizeValidationError', errors: [{ message: 'CURP con formato inválido' }] }),
    { status: 400, error: 'CURP con formato inválido' },
  );
  assert.deepStrictEqual(
    t({ name: 'SequelizeUniqueConstraintError', errors: [{ path: 'nombre' }] }),
    { status: 409, error: 'Ya existe un registro con ese nombre' },
  );
  assert.strictEqual(t({ name: 'SequelizeForeignKeyConstraintError', sql: 'DELETE FROM `municipios`' }).status, 409);
  assert.strictEqual(t({ name: 'SequelizeForeignKeyConstraintError', sql: 'INSERT INTO `solicitudes`' }).status, 400);
  assert.strictEqual(t(new Error('otro')), null);
});

test('GET /api/docs.json documenta todas las rutas de la API (#16)', async () => {
  const res = await fetch(`${base}/docs.json`);
  assert.strictEqual(res.status, 200);
  const spec = await res.json();
  assert.strictEqual(spec.openapi, '3.0.3');
  const operaciones = Object.entries(spec.paths)
    .flatMap(([ruta, ops]) => Object.keys(ops).map((metodo) => `${metodo.toUpperCase()} ${ruta}`));
  for (const esperada of [
    'GET /health', 'POST /auth/login', 'GET /catalogos/{tipo}',
    'POST /solicitudes', 'GET /solicitudes/buscar', 'PUT /solicitudes/{id}', 'GET /solicitudes/{id}/comprobante',
    'GET /admin/solicitudes', 'PATCH /admin/solicitudes/{id}/estatus', 'DELETE /admin/catalogos/{tipo}/{id}',
  ]) {
    assert.ok(operaciones.includes(esperada), `falta documentar ${esperada}`);
  }
  assert.strictEqual(operaciones.length, 17);
});

test('GET /api/docs sirve la pagina de Swagger UI', async () => {
  const res = await fetch(`${base}/docs/`);
  assert.strictEqual(res.status, 200);
  assert.match(await res.text(), /swagger-ui/i);
});
