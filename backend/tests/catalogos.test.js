// Pruebas del CRUD de catalogos (issue #12). Correr con: npm test
// Las tablas se simulan en memoria: no se necesita MySQL.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto_de_prueba';

const { test, before, after, beforeEach, describe, mock } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');

const App = require('../src/app/App');
const { Municipio, NivelEducativo, Asunto, Solicitud } = require('../src/models');

/** Tabla en memoria con lo minimo que usa CatalogoService. */
function simularTabla(modelo, filasIniciales) {
  let filas = [];
  let siguienteId = 1;

  const registro = (fila) => ({
    ...fila,
    async update(cambios) {
      if (cambios.nombre && filas.some((f) => f.nombre === cambios.nombre && f.id !== fila.id)) {
        throw { name: 'SequelizeUniqueConstraintError', errors: [{ path: 'nombre' }] };
      }
      Object.assign(fila, cambios);
      Object.assign(this, cambios);
    },
    async destroy() { filas = filas.filter((f) => f.id !== fila.id); },
  });

  const reiniciar = () => {
    filas = filasIniciales.map((f, i) => ({ id: i + 1, activo: true, ...f }));
    siguienteId = filas.length + 1;
  };
  reiniciar();

  mock.method(modelo, 'findAll', async ({ where, order } = {}) => {
    let resultado = filas.filter((f) => !where || f.activo === where.activo);
    if (order) resultado = [...resultado].sort((a, b) => a.nombre.localeCompare(b.nombre));
    return resultado.map((f) => ({ id: f.id, nombre: f.nombre, activo: f.activo }));
  });
  mock.method(modelo, 'findByPk', async (id) => {
    const fila = filas.find((f) => f.id === id);
    return fila ? registro(fila) : null;
  });
  mock.method(modelo, 'create', async ({ nombre, activo }) => {
    if (filas.some((f) => f.nombre === nombre)) {
      throw { name: 'SequelizeUniqueConstraintError', errors: [{ path: 'nombre' }] };
    }
    const fila = { id: siguienteId++, nombre, activo };
    filas.push(fila);
    return registro(fila);
  });
  return { reiniciar, filas: () => filas };
}

let server;
let base;
let tablas;
const token = jwt.sign({ id: 1, usuario: 'admin', nombre: 'Administrador' }, 'secreto_de_prueba');
const conToken = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

before(() => {
  tablas = [
    simularTabla(Municipio, [{ nombre: 'Saltillo' }, { nombre: 'Arteaga' }, { nombre: 'Torreón', activo: false }]),
    simularTabla(NivelEducativo, [{ nombre: 'Primaria' }, { nombre: 'Secundaria' }]),
    simularTabla(Asunto, [{ nombre: 'Inscripción' }]),
  ];
  // Saltillo (id 1) tiene 3 solicitudes; lo demas no esta en uso
  mock.method(Solicitud, 'count', async ({ where }) => (where.municipioId === 1 ? 3 : 0));

  server = new App().listen(0);
  base = `http://localhost:${server.address().port}/api`;
});

beforeEach(() => tablas.forEach((t) => t.reiniciar()));

after(() => {
  mock.restoreAll();
  server.close();
});

const pedir = (metodo, ruta, body, headers = conToken) => fetch(`${base}${ruta}`, {
  method: metodo,
  headers,
  body: body === undefined ? undefined : JSON.stringify(body),
});

describe('GET /api/catalogos/:tipo (publico)', () => {
  test('regresa solo activos, ordenados por nombre, con { id, nombre, activo }', async () => {
    const res = await fetch(`${base}/catalogos/municipios`);
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(await res.json(), [
      { id: 2, nombre: 'Arteaga', activo: true },
      { id: 1, nombre: 'Saltillo', activo: true },
    ]);
  });

  test('funciona para niveles y asuntos', async () => {
    assert.strictEqual((await (await fetch(`${base}/catalogos/niveles`)).json()).length, 2);
    assert.strictEqual((await (await fetch(`${base}/catalogos/asuntos`)).json()).length, 1);
  });

  test('tipo desconocido -> 404', async () => {
    const res = await fetch(`${base}/catalogos/escuelas`);
    assert.strictEqual(res.status, 404);
    assert.match((await res.json()).error, /municipios, niveles o asuntos/);
  });

  test('no se puede escribir por la ruta publica', async () => {
    const res = await pedir('POST', '/catalogos/municipios', { nombre: 'X' });
    assert.strictEqual(res.status, 404);
  });
});

describe('/api/admin/catalogos/:tipo (requiere token)', () => {
  test('sin token -> 401', async () => {
    const res = await pedir('GET', '/admin/catalogos/municipios', undefined, {});
    assert.strictEqual(res.status, 401);
  });

  test('GET incluye inactivos', async () => {
    const res = await pedir('GET', '/admin/catalogos/municipios');
    const nombres = (await res.json()).map((m) => m.nombre);
    assert.deepStrictEqual(nombres, ['Arteaga', 'Saltillo', 'Torreón']);
  });

  test('POST crea -> 201 y limpia espacios del nombre', async () => {
    const res = await pedir('POST', '/admin/catalogos/asuntos', { nombre: '  Cambio   de escuela ' });
    assert.strictEqual(res.status, 201);
    assert.deepStrictEqual(await res.json(), { id: 2, nombre: 'Cambio de escuela', activo: true });
  });

  test('POST sin nombre -> 400', async () => {
    const res = await pedir('POST', '/admin/catalogos/asuntos', {});
    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(await res.json(), { error: 'El nombre es obligatorio' });
  });

  test('POST con nombre demasiado largo -> 400', async () => {
    const res = await pedir('POST', '/admin/catalogos/niveles', { nombre: 'x'.repeat(101) });
    assert.strictEqual(res.status, 400);
  });

  test('POST con nombre repetido -> 409', async () => {
    const res = await pedir('POST', '/admin/catalogos/niveles', { nombre: 'Primaria' });
    assert.strictEqual(res.status, 409);
    assert.deepStrictEqual(await res.json(), { error: 'Ya existe un registro con ese nombre' });
  });

  test('PUT cambia nombre y activo', async () => {
    const res = await pedir('PUT', '/admin/catalogos/municipios/2', { nombre: 'Arteaga Centro', activo: false });
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(await res.json(), { id: 2, nombre: 'Arteaga Centro', activo: false });
  });

  test('PUT a un nombre que ya existe -> 409', async () => {
    const res = await pedir('PUT', '/admin/catalogos/municipios/2', { nombre: 'Saltillo' });
    assert.strictEqual(res.status, 409);
  });

  test('PUT con activo que no es booleano -> 400', async () => {
    const res = await pedir('PUT', '/admin/catalogos/municipios/2', { activo: 'si' });
    assert.strictEqual(res.status, 400);
  });

  test('PUT sin cambios -> 400', async () => {
    const res = await pedir('PUT', '/admin/catalogos/municipios/2', {});
    assert.strictEqual(res.status, 400);
  });

  test('PUT de un id inexistente -> 404', async () => {
    const res = await pedir('PUT', '/admin/catalogos/municipios/99', { nombre: 'X' });
    assert.strictEqual(res.status, 404);
  });

  test('DELETE sin solicitudes -> 204', async () => {
    const res = await pedir('DELETE', '/admin/catalogos/municipios/2');
    assert.strictEqual(res.status, 204);
    assert.strictEqual(tablas[0].filas().some((f) => f.id === 2), false);
  });

  test('DELETE de un catalogo con solicitudes -> 409 y no se borra', async () => {
    const res = await pedir('DELETE', '/admin/catalogos/municipios/1');
    assert.strictEqual(res.status, 409);
    assert.match((await res.json()).error, /tiene 3 solicitud\(es\)\. Puedes desactivarlo/);
    assert.ok(tablas[0].filas().some((f) => f.id === 1));
  });

  test('DELETE con id invalido -> 400', async () => {
    const res = await pedir('DELETE', '/admin/catalogos/municipios/abc');
    assert.strictEqual(res.status, 400);
  });
});
