// Pruebas de las estadisticas del dashboard (issue #9). Correr con: npm test
// La tabla se simula en memoria: no se necesita MySQL.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto_de_prueba';

const { test, before, after, describe, mock } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');

const App = require('../src/app/App');
const { Solicitud } = require('../src/models');

// Saltillo (1): 2 resueltas y 3 pendientes. Torreon (2): 1 pendiente. Arteaga (3): ninguna.
const FILAS = [
  { municipioId: 1, estatus: 'Resuelto' },
  { municipioId: 1, estatus: 'Resuelto' },
  { municipioId: 1, estatus: 'Pendiente' },
  { municipioId: 1, estatus: 'Pendiente' },
  { municipioId: 1, estatus: 'Pendiente' },
  { municipioId: 2, estatus: 'Pendiente' },
];

let server;
let base;
let ultimaConsulta;
const token = jwt.sign({ id: 1, usuario: 'admin', nombre: 'Administrador' }, 'secreto_de_prueba');
const conToken = { Authorization: `Bearer ${token}` };

before(() => {
  // Simula el GROUP BY estatus; MySQL regresa COUNT como texto
  mock.method(Solicitud, 'findAll', async (opciones) => {
    ultimaConsulta = opciones;
    const { municipioId } = opciones.where;
    const grupos = {};
    for (const fila of FILAS) {
      if (municipioId !== undefined && fila.municipioId !== municipioId) continue;
      grupos[fila.estatus] = (grupos[fila.estatus] || 0) + 1;
    }
    return Object.entries(grupos).map(([estatus, cantidad]) => ({ estatus, cantidad: String(cantidad) }));
  });

  server = new App().listen(0);
  base = `http://localhost:${server.address().port}/api`;
});

after(() => {
  mock.restoreAll();
  server.close();
});

const pedir = (query = '', headers = conToken) => fetch(`${base}/admin/estadisticas${query}`, { headers });

describe('GET /api/admin/estadisticas', () => {
  test('sin token -> 401', async () => {
    const res = await pedir('', {});
    assert.strictEqual(res.status, 401);
  });

  test('total de todas las solicitudes, agrupado por estatus', async () => {
    const res = await pedir();
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(await res.json(), { resuelto: 2, pendiente: 4, total: 6 });
    assert.deepStrictEqual(ultimaConsulta.group, ['estatus']);
    assert.deepStrictEqual(ultimaConsulta.where, {});
  });

  test('?municipioId=1 -> solo ese municipio', async () => {
    const res = await pedir('?municipioId=1');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(await res.json(), { resuelto: 2, pendiente: 3, total: 5 });
    assert.deepStrictEqual(ultimaConsulta.where, { municipioId: 1 });
  });

  test('municipio con un solo estatus -> el otro en 0', async () => {
    const res = await pedir('?municipioId=2');
    assert.deepStrictEqual(await res.json(), { resuelto: 0, pendiente: 1, total: 1 });
  });

  test('municipio sin solicitudes -> todo en 0', async () => {
    const res = await pedir('?municipioId=3');
    assert.deepStrictEqual(await res.json(), { resuelto: 0, pendiente: 0, total: 0 });
  });

  test('municipioId vacio -> igual que sin filtro', async () => {
    const res = await pedir('?municipioId=');
    assert.deepStrictEqual(await res.json(), { resuelto: 2, pendiente: 4, total: 6 });
  });

  test('municipioId invalido -> 400 con { error }', async () => {
    for (const valor of ['abc', '0', '-1', '1.5']) {
      const res = await pedir(`?municipioId=${valor}`);
      assert.strictEqual(res.status, 400, `municipioId=${valor}`);
      assert.deepStrictEqual(await res.json(), { error: 'El municipio no es valido' });
    }
  });
});
