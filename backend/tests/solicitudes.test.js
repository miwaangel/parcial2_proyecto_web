// Pruebas de la API de solicitudes (issues #13 y #14). Correr con: npm test
// Las tablas se simulan en memoria: no se necesita MySQL.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto_de_prueba';

const { test, before, after, beforeEach, describe, mock } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const App = require('../src/app/App');
const SolicitudValidator = require('../src/services/SolicitudValidator');
const TurnoService = require('../src/services/TurnoService');
const {
  Solicitud, Municipio, NivelEducativo, Asunto, sequelize,
} = require('../src/models');

// ------------------------------------------------------------------ datos simulados

const MUNICIPIOS = { 1: { id: 1, nombre: 'Saltillo', activo: true }, 2: { id: 2, nombre: 'Torreón', activo: true }, 3: { id: 3, nombre: 'Viejo', activo: false } };
const NIVELES = { 1: { id: 1, nombre: 'Primaria', activo: true }, 2: { id: 2, nombre: 'Secundaria', activo: false } };
const ASUNTOS = { 1: { id: 1, nombre: 'Inscripción', activo: true } };

let filas;
let ultimaConsulta;

const conRelaciones = (fila) => ({
  ...fila,
  municipio: MUNICIPIOS[fila.municipioId],
  nivel: NIVELES[fila.nivelId],
  asunto: ASUNTOS[fila.asuntoId],
});

const registro = (fila) => ({
  ...fila,
  get: () => conRelaciones(fila),
  async update(cambios) { Object.assign(fila, cambios, { updatedAt: new Date() }); Object.assign(this, cambios); },
  async destroy() { filas = filas.filter((f) => f.id !== fila.id); },
});

const VALIDA = {
  curp: 'pegj050312hclrrn09',
  nombreCompleto: '  María   Pérez López ',
  nombre: 'Juan',
  paterno: 'Pérez',
  materno: '',
  telefono: '844 123-4567',
  celular: '8449876543',
  correo: 'Maria@Correo.COM',
  nivelId: 1,
  municipioId: 1,
  asuntoId: 1,
};

before(() => {
  const catalogo = (tabla) => async (id) => tabla[id] || null;
  mock.method(Municipio, 'findByPk', catalogo(MUNICIPIOS));
  mock.method(NivelEducativo, 'findByPk', catalogo(NIVELES));
  mock.method(Asunto, 'findByPk', catalogo(ASUNTOS));

  mock.method(Solicitud, 'findByPk', async (id) => {
    const fila = filas.find((f) => f.id === Number(id));
    return fila ? registro(fila) : null;
  });
  mock.method(Solicitud, 'findAll', async (opciones) => {
    ultimaConsulta = opciones;
    const { where } = opciones;
    return filas
      .filter((f) => (where.curp === undefined || f.curp === where.curp)
        && (where.turno === undefined || f.turno === where.turno)
        && (where.municipioId === undefined || f.municipioId === where.municipioId)
        && (where.estatus === undefined || f.estatus === where.estatus))
      .map(registro);
  });

  // TurnoService es de Angel: aqui solo se simula su resultado (siguiente turno del municipio)
  const siguienteTurno = (municipioId) => Math.max(0, ...filas.filter((f) => f.municipioId === municipioId).map((f) => f.turno)) + 1;
  mock.method(TurnoService, 'crearSolicitud', async (datos) => {
    const fila = { id: filas.length + 100, ...datos, turno: siguienteTurno(datos.municipioId), estatus: 'Pendiente', createdAt: new Date(), updatedAt: new Date() };
    filas.push(fila);
    return fila;
  });
  mock.method(TurnoService, 'asignarTurno', async (municipioId, transaccion) => {
    assert.ok(transaccion, 'asignarTurno debe recibir la transaccion');
    return siguienteTurno(municipioId);
  });
  mock.method(sequelize, 'transaction', async (fn) => fn({ LOCK: {} }));
});

beforeEach(() => {
  filas = [
    { id: 1, curp: 'GOMA900101HCLRRN09', nombreCompleto: 'Rosa Gómez', nombre: 'Ana', paterno: 'Gómez', materno: 'Ruiz', telefono: null, celular: '8441111111', correo: 'ana@correo.com', nivelId: 1, municipioId: 1, asuntoId: 1, turno: 1, estatus: 'Pendiente', createdAt: new Date(), updatedAt: new Date() },
    { id: 2, curp: 'GOMA900101HCLRRN09', nombreCompleto: 'Rosa Gómez', nombre: 'Ana', paterno: 'Gómez', materno: 'Ruiz', telefono: null, celular: '8441111111', correo: 'ana@correo.com', nivelId: 1, municipioId: 2, asuntoId: 1, turno: 1, estatus: 'Resuelto', createdAt: new Date(), updatedAt: new Date() },
  ];
});

after(() => mock.restoreAll());

// ------------------------------------------------------------------ validador

describe('SolicitudValidator', () => {
  const v = new SolicitudValidator();
  const todos = Object.keys(SolicitudValidator.CAMPOS);

  test('normaliza: espacios, CURP mayusculas, correo minusculas, telefono solo digitos, vacios -> null', () => {
    const limpio = v.validar(VALIDA, { permitidos: todos });
    assert.strictEqual(limpio.curp, 'PEGJ050312HCLRRN09');
    assert.strictEqual(limpio.nombreCompleto, 'María Pérez López');
    assert.strictEqual(limpio.correo, 'maria@correo.com');
    assert.strictEqual(limpio.telefono, '8441234567');
    assert.strictEqual(limpio.materno, null);
  });

  test('ignora campos que no estan permitidos (id, turno, estatus)', () => {
    const limpio = v.validar({ ...VALIDA, id: 9, turno: 99, estatus: 'Resuelto' }, { permitidos: todos });
    assert.ok(!('id' in limpio) && !('turno' in limpio) && !('estatus' in limpio));
  });

  const casos = [
    ['sin CURP', { curp: '' }, /CURP es obligatoria/],
    ['CURP invalida', { curp: 'ABC' }, /CURP no tiene un formato valido/],
    ['nombre con numeros', { nombre: 'Juan2' }, /solo admite letras/],
    ['celular corto', { celular: '844' }, /celular debe tener 10 digitos/],
    ['sin celular', { celular: null }, /celular es obligatorio/],
    ['correo sin @', { correo: 'correo.com' }, /correo no es valido/],
    ['nivel no numerico', { nivelId: 'x' }, /nivel no es valido/],
    ['nombre muy largo', { nombreCompleto: 'a'.repeat(151) }, /maximo 150/],
  ];
  for (const [nombre, cambio, error] of casos) {
    test(`${nombre} -> 400`, () => {
      assert.throws(() => v.validar({ ...VALIDA, ...cambio }, { permitidos: todos }), (e) => e.status === 400 && error.test(e.message));
    });
  }

  test('parcial: solo valida lo que viene y exige al menos un campo', () => {
    assert.deepStrictEqual(v.validar({ celular: '8440000000' }, { permitidos: todos, parcial: true }), { celular: '8440000000' });
    assert.throws(() => v.validar({}, { permitidos: todos, parcial: true }), /ningun campo/);
    assert.throws(() => v.validar({ celular: '' }, { permitidos: todos, parcial: true }), /obligatorio/);
  });
});

// ------------------------------------------------------------------ HTTP

let server;
let base;
const token = jwt.sign({ id: 1, usuario: 'admin', nombre: 'Administrador' }, 'secreto_de_prueba');
const JSON_H = { 'Content-Type': 'application/json' };
const ADMIN_H = { ...JSON_H, Authorization: `Bearer ${token}` };

before(() => {
  server = new App().listen(0);
  base = `http://localhost:${server.address().port}/api`;
});
after(() => server.close());

const pedir = async (metodo, ruta, body, headers = JSON_H) => {
  const res = await fetch(`${base}${ruta}`, { method: metodo, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const texto = await res.text();
  return { status: res.status, body: texto ? JSON.parse(texto) : null };
};

describe('#13 publico: POST /api/solicitudes', () => {
  test('crea con turno asignado por el servidor y forma del contrato', async () => {
    const { status, body } = await pedir('POST', '/solicitudes', { ...VALIDA, turno: 999, estatus: 'Resuelto' });
    assert.strictEqual(status, 201);
    assert.strictEqual(body.turno, 2, 'Saltillo ya tenia el turno 1');
    assert.strictEqual(body.estatus, 'Pendiente');
    assert.strictEqual(body.curp, 'PEGJ050312HCLRRN09');
    assert.deepStrictEqual(body.municipio, { id: 1, nombre: 'Saltillo' });
    assert.deepStrictEqual(body.nivel, { id: 1, nombre: 'Primaria' });
    assert.deepStrictEqual(body.asunto, { id: 1, nombre: 'Inscripción' });
    assert.deepStrictEqual(Object.keys(body), [
      'id', 'curp', 'nombreCompleto', 'nombre', 'paterno', 'materno', 'telefono', 'celular', 'correo',
      'turno', 'estatus', 'municipio', 'nivel', 'asunto', 'createdAt', 'updatedAt',
    ]);
  });

  test('otro municipio empieza en turno 1', async () => {
    filas = filas.filter((f) => f.municipioId !== 2);
    const { body } = await pedir('POST', '/solicitudes', { ...VALIDA, municipioId: 2 });
    assert.strictEqual(body.turno, 1);
  });

  test('nivel inactivo -> 400', async () => {
    const { status, body } = await pedir('POST', '/solicitudes', { ...VALIDA, nivelId: 2 });
    assert.strictEqual(status, 400);
    assert.match(body.error, /nivel seleccionado no existe o no esta activo/);
  });

  test('municipio inactivo -> 400', async () => {
    const { status } = await pedir('POST', '/solicitudes', { ...VALIDA, municipioId: 3 });
    assert.strictEqual(status, 400);
  });

  test('datos invalidos -> 400 con mensaje', async () => {
    const { status, body } = await pedir('POST', '/solicitudes', { ...VALIDA, correo: 'mal' });
    assert.strictEqual(status, 400);
    assert.match(body.error, /correo/);
  });
});

describe('#13 publico: GET /api/solicitudes/buscar', () => {
  test('CURP + turno + municipio -> la solicitud', async () => {
    const { status, body } = await pedir('GET', '/solicitudes/buscar?curp=goma900101hclrrn09&turno=1&municipioId=2');
    assert.strictEqual(status, 200);
    assert.strictEqual(body.id, 2);
  });

  test('CURP + turno repetidos en dos municipios sin municipioId -> 400 pide el municipio', async () => {
    const { status, body } = await pedir('GET', '/solicitudes/buscar?curp=GOMA900101HCLRRN09&turno=1');
    assert.strictEqual(status, 400);
    assert.match(body.error, /indica el municipio/);
  });

  test('no existe -> 404', async () => {
    const { status } = await pedir('GET', '/solicitudes/buscar?curp=GOMA900101HCLRRN09&turno=7');
    assert.strictEqual(status, 404);
  });

  test('sin turno -> 400', async () => {
    const { status } = await pedir('GET', '/solicitudes/buscar?curp=GOMA900101HCLRRN09');
    assert.strictEqual(status, 400);
  });
});

describe('#13 publico: PUT /api/solicitudes/:id', () => {
  const verificacion = { curp: 'GOMA900101HCLRRN09', turno: 1 };

  test('modifica solo campos editables (ignora municipio, turno, estatus, curp)', async () => {
    const { status, body } = await pedir('PUT', '/solicitudes/1', {
      ...verificacion, celular: '8440000000', municipioId: 2, estatus: 'Resuelto',
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(body.celular, '8440000000');
    assert.strictEqual(body.municipio.id, 1);
    assert.strictEqual(body.estatus, 'Pendiente');
    assert.strictEqual(body.turno, 1);
  });

  test('CURP o turno que no coinciden -> 404', async () => {
    assert.strictEqual((await pedir('PUT', '/solicitudes/1', { curp: 'GOMA900101HCLRRN09', turno: 5, celular: '8440000000' })).status, 404);
    assert.strictEqual((await pedir('PUT', '/solicitudes/1', { curp: 'PEGJ050312HCLRRN09', turno: 1, celular: '8440000000' })).status, 404);
  });

  test('solicitud ya resuelta -> 409', async () => {
    const { status, body } = await pedir('PUT', '/solicitudes/2', { ...verificacion, celular: '8440000000' });
    assert.strictEqual(status, 409);
    assert.match(body.error, /ya fue resuelta/);
  });

  test('sin cambios -> 400', async () => {
    assert.strictEqual((await pedir('PUT', '/solicitudes/1', verificacion)).status, 400);
  });
});

describe('#14 admin: /api/admin/solicitudes', () => {
  test('sin token -> 401', async () => {
    assert.strictEqual((await pedir('GET', '/admin/solicitudes')).status, 401);
  });

  test('busqueda q: cada palabra busca en CURP, nombre, apellidos y nombreCompleto', async () => {
    const { status, body } = await pedir('GET', '/admin/solicitudes?q=ana%20gomez', undefined, ADMIN_H);
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(body));
    const condiciones = ultimaConsulta.where[Op.and];
    assert.strictEqual(condiciones.length, 2);
    const campos = condiciones[0][Op.or].map((c) => Object.keys(c)[0]);
    assert.deepStrictEqual(campos, ['curp', 'nombre', 'paterno', 'materno', 'nombreCompleto']);
    assert.deepStrictEqual(condiciones[1][Op.or][0].curp, { [Op.like]: '%gomez%' });
  });

  test('filtros municipio y estatus', async () => {
    const { body } = await pedir('GET', '/admin/solicitudes?municipioId=2&estatus=Resuelto', undefined, ADMIN_H);
    assert.deepStrictEqual(body.map((s) => s.id), [2]);
  });

  test('estatus invalido -> 400', async () => {
    assert.strictEqual((await pedir('GET', '/admin/solicitudes?estatus=Otro', undefined, ADMIN_H)).status, 400);
  });

  test('GET /:id y 404', async () => {
    assert.strictEqual((await pedir('GET', '/admin/solicitudes/1', undefined, ADMIN_H)).body.id, 1);
    assert.strictEqual((await pedir('GET', '/admin/solicitudes/99', undefined, ADMIN_H)).status, 404);
  });

  test('POST crea igual que el publico', async () => {
    const { status, body } = await pedir('POST', '/admin/solicitudes', VALIDA, ADMIN_H);
    assert.strictEqual(status, 201);
    assert.strictEqual(body.turno, 2);
  });

  test('PUT puede editar cualquier dato y el estatus', async () => {
    const { status, body } = await pedir('PUT', '/admin/solicitudes/1', { curp: 'PEGJ050312HCLRRN09', estatus: 'Resuelto' }, ADMIN_H);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.curp, 'PEGJ050312HCLRRN09');
    assert.strictEqual(body.estatus, 'Resuelto');
  });

  test('PUT que cambia el municipio asigna el siguiente turno de ese municipio', async () => {
    const { body } = await pedir('PUT', '/admin/solicitudes/1', { municipioId: 2 }, ADMIN_H);
    assert.strictEqual(body.municipio.id, 2);
    assert.strictEqual(body.turno, 2, 'Torreon ya tenia el turno 1');
  });

  test('PUT vacio -> 400', async () => {
    assert.strictEqual((await pedir('PUT', '/admin/solicitudes/1', {}, ADMIN_H)).status, 400);
  });

  test('PATCH /:id/estatus', async () => {
    const ok = await pedir('PATCH', '/admin/solicitudes/1/estatus', { estatus: 'Resuelto' }, ADMIN_H);
    assert.strictEqual(ok.body.estatus, 'Resuelto');
    const mal = await pedir('PATCH', '/admin/solicitudes/1/estatus', { estatus: 'Cancelado' }, ADMIN_H);
    assert.strictEqual(mal.status, 400);
  });

  test('DELETE -> 204 y luego 404', async () => {
    assert.strictEqual((await pedir('DELETE', '/admin/solicitudes/1', undefined, ADMIN_H)).status, 204);
    assert.strictEqual((await pedir('DELETE', '/admin/solicitudes/1', undefined, ADMIN_H)).status, 404);
  });
});
