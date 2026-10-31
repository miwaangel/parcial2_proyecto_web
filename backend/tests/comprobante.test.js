// Pruebas del comprobante PDF con QR y del patron Factory (issue #15). Correr con: npm test
process.env.NODE_ENV = 'test';

const { test, before, after, describe, mock } = require('node:test');
const assert = require('node:assert');

const App = require('../src/app/App');
const DocumentoFactory = require('../src/services/documentos/DocumentoFactory');
const GeneradorDocumento = require('../src/services/documentos/GeneradorDocumento');
const ComprobantePdf = require('../src/services/documentos/ComprobantePdf');
const { Solicitud } = require('../src/models');
const solicitud = require('./solicitudEjemplo');

// Modelo simulado: no se necesita MySQL para correr las pruebas
before(() => {
  mock.method(Solicitud, 'findByPk', async (id, opciones) => {
    assert.deepStrictEqual(opciones.include, ['municipio', 'nivel', 'asunto']);
    return Number(id) === solicitud.id ? { get: () => ({ ...solicitud }) } : null;
  });
});
after(() => mock.restoreAll());

describe('DocumentoFactory (patron Factory)', () => {
  test('crear("comprobante") regresa un GeneradorDocumento de tipo PDF', () => {
    const documento = DocumentoFactory.crear('comprobante');
    assert.ok(documento instanceof GeneradorDocumento);
    assert.ok(documento instanceof ComprobantePdf);
    assert.strictEqual(documento.contentType, 'application/pdf');
  });

  test('tipo desconocido lanza error', () => {
    assert.throws(() => DocumentoFactory.crear('factura'), /no soportado/);
  });

  test('GeneradorDocumento es abstracta: no se puede instanciar', () => {
    assert.throws(() => new GeneradorDocumento(), /abstracta/);
  });
});

describe('ComprobantePdf', () => {
  test('genera un PDF valido', async () => {
    const pdf = await new ComprobantePdf().generar(solicitud);
    assert.ok(Buffer.isBuffer(pdf));
    assert.strictEqual(pdf.subarray(0, 5).toString(), '%PDF-');
    assert.ok(pdf.length > 2000);
  });

  test('el QR contiene SOLO la CURP', async () => {
    const comprobante = new ComprobantePdf();
    let contenidoQr;
    const original = comprobante.generarQr.bind(comprobante);
    comprobante.generarQr = (texto) => { contenidoQr = texto; return original(texto); };

    await comprobante.generar(solicitud);
    assert.strictEqual(contenidoQr, solicitud.curp);
  });

  test('aguanta campos vacios y turnos grandes', async () => {
    const pdf = await new ComprobantePdf().generar({
      ...solicitud, turno: 12345, materno: null, telefono: '', asunto: undefined,
    });
    assert.strictEqual(pdf.subarray(0, 5).toString(), '%PDF-');
  });

  test('nombre de archivo con el turno', () => {
    assert.strictEqual(new ComprobantePdf().nombreArchivo(solicitud), 'comprobante-turno-7.pdf');
  });
});

describe('GET /api/solicitudes/:id/comprobante', () => {
  let server;
  let base;

  before(() => {
    server = new App().listen(0);
    base = `http://localhost:${server.address().port}/api/solicitudes`;
  });
  after(() => server.close());

  test('id y CURP correctos -> 200 PDF como descarga', async () => {
    const res = await fetch(`${base}/${solicitud.id}/comprobante?curp=${solicitud.curp}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('content-type'), 'application/pdf');
    assert.match(res.headers.get('content-disposition'), /attachment; filename="comprobante-turno-7\.pdf"/);
    const cuerpo = Buffer.from(await res.arrayBuffer());
    assert.strictEqual(cuerpo.subarray(0, 5).toString(), '%PDF-');
  });

  test('la CURP en minusculas tambien funciona', async () => {
    const res = await fetch(`${base}/${solicitud.id}/comprobante?curp=${solicitud.curp.toLowerCase()}`);
    assert.strictEqual(res.status, 200);
  });

  test('sin CURP -> 400', async () => {
    const res = await fetch(`${base}/${solicitud.id}/comprobante`);
    assert.strictEqual(res.status, 400);
    assert.match((await res.json()).error, /CURP/);
  });

  test('CURP con formato invalido -> 400', async () => {
    const res = await fetch(`${base}/${solicitud.id}/comprobante?curp=ABC123`);
    assert.strictEqual(res.status, 400);
  });

  test('CURP de otra persona -> 404 (no revela que el id existe)', async () => {
    const res = await fetch(`${base}/${solicitud.id}/comprobante?curp=GOMA900101HCLRRN09`);
    assert.strictEqual(res.status, 404);
    assert.deepStrictEqual(await res.json(), { error: 'No existe una solicitud con esos datos' });
  });

  test('id inexistente -> 404 con el mismo mensaje', async () => {
    const res = await fetch(`${base}/999/comprobante?curp=${solicitud.curp}`);
    assert.strictEqual(res.status, 404);
    assert.deepStrictEqual(await res.json(), { error: 'No existe una solicitud con esos datos' });
  });

  test('id no numerico -> 400', async () => {
    const res = await fetch(`${base}/abc/comprobante?curp=${solicitud.curp}`);
    assert.strictEqual(res.status, 400);
  });
});
