// Pruebas de login JWT + captcha (issues #10 y #11). Correr con: npm test
// Google reCAPTCHA se simula: no se necesita internet.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto_de_prueba';
process.env.RECAPTCHA_SECRET = 'llave_secreta_de_prueba';

const { test, before, after, describe, mock } = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const App = require('../src/app/App');
const CaptchaService = require('../src/services/CaptchaService');
const { Usuario } = require('../src/models');

const PASSWORD = 'Admin123!';
const CAPTCHA_OK = 'token-captcha-valido';

let server;
let base;
const fetchReal = globalThis.fetch;
const llamadasGoogle = [];

before(() => {
  // Tabla usuarios simulada: un admin activo y uno desactivado (no se necesita MySQL)
  const usuarios = [
    { id: 1, usuario: 'admin', nombre: 'Administrador', activo: true, passwordHash: bcrypt.hashSync(PASSWORD, 4) },
    { id: 2, usuario: 'baja', nombre: 'Dado de baja', activo: false, passwordHash: bcrypt.hashSync(PASSWORD, 4) },
  ];
  mock.method(Usuario, 'scope', (nombre) => {
    assert.strictEqual(nombre, 'conPassword', 'el login debe pedir el passwordHash con el scope');
    return {
      findOne: async ({ where }) => usuarios.find(
        (u) => u.usuario === where.usuario && u.activo === where.activo,
      ) || null,
    };
  });

  // Simula Google: solo CAPTCHA_OK es valido. Las demas URL usan el fetch real.
  globalThis.fetch = async (url, opciones) => {
    if (String(url) === CaptchaService.VERIFY_URL) {
      const params = new URLSearchParams(opciones.body);
      llamadasGoogle.push(params);
      return { json: async () => ({ success: params.get('response') === CAPTCHA_OK }) };
    }
    return fetchReal(url, opciones);
  };

  server = new App().listen(0);
  base = `http://localhost:${server.address().port}/api`;
});

after(() => {
  mock.restoreAll();
  globalThis.fetch = fetchReal;
  server.close();
});

const login = (body) => fetch(`${base}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

describe('POST /api/auth/login', () => {
  test('sin captcha -> 400 y no consulta a Google', async () => {
    const antes = llamadasGoogle.length;
    const res = await login({ usuario: 'admin', password: PASSWORD });
    assert.strictEqual(res.status, 400);
    assert.match((await res.json()).error, /captcha/i);
    assert.strictEqual(llamadasGoogle.length, antes);
  });

  test('captcha invalido -> 400 aunque el password sea correcto', async () => {
    const res = await login({ usuario: 'admin', password: PASSWORD, captchaToken: 'falso' });
    assert.strictEqual(res.status, 400);
    assert.match((await res.json()).error, /captcha/i);
  });

  test('manda la llave secreta y el token a Google', async () => {
    await login({ usuario: 'admin', password: PASSWORD, captchaToken: CAPTCHA_OK });
    const ultima = llamadasGoogle.at(-1);
    assert.strictEqual(ultima.get('secret'), 'llave_secreta_de_prueba');
    assert.strictEqual(ultima.get('response'), CAPTCHA_OK);
  });

  test('password incorrecto -> 401', async () => {
    const res = await login({ usuario: 'admin', password: 'mal', captchaToken: CAPTCHA_OK });
    assert.strictEqual(res.status, 401);
    assert.deepStrictEqual(await res.json(), { error: 'Usuario o password incorrectos' });
  });

  test('usuario inexistente -> 401 con el mismo mensaje', async () => {
    const res = await login({ usuario: 'nadie', password: PASSWORD, captchaToken: CAPTCHA_OK });
    assert.strictEqual(res.status, 401);
    assert.deepStrictEqual(await res.json(), { error: 'Usuario o password incorrectos' });
  });

  test('usuario desactivado -> 401', async () => {
    const res = await login({ usuario: 'baja', password: PASSWORD, captchaToken: CAPTCHA_OK });
    assert.strictEqual(res.status, 401);
  });

  test('faltan campos -> 400', async () => {
    const res = await login({ usuario: 'admin', captchaToken: CAPTCHA_OK });
    assert.strictEqual(res.status, 400);
  });

  test('correcto -> 200 { token, usuario } con la forma del contrato', async () => {
    const res = await login({ usuario: 'admin', password: PASSWORD, captchaToken: CAPTCHA_OK });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.deepStrictEqual(body.usuario, { id: 1, usuario: 'admin', nombre: 'Administrador' });
    assert.ok(!('passwordHash' in body.usuario));
    const datos = jwt.verify(body.token, 'secreto_de_prueba');
    assert.strictEqual(datos.usuario, 'admin');
    assert.ok(datos.exp > datos.iat, 'el token debe expirar');
  });
});

describe('AuthMiddleware en /api/admin/*', () => {
  const admin = (headers = {}) => fetch(`${base}/admin/ruta-de-prueba`, { headers });

  test('sin token -> 401', async () => {
    const res = await admin();
    assert.strictEqual(res.status, 401);
    assert.deepStrictEqual(await res.json(), { error: 'Falta el token de autenticacion' });
  });

  test('token invalido -> 401', async () => {
    const res = await admin({ Authorization: 'Bearer abc.def.ghi' });
    assert.strictEqual(res.status, 401);
    assert.deepStrictEqual(await res.json(), { error: 'Token invalido' });
  });

  test('token expirado -> 401 con mensaje de sesion', async () => {
    const vencido = jwt.sign({ id: 1, usuario: 'admin' }, 'secreto_de_prueba', { expiresIn: -10 });
    const res = await admin({ Authorization: `Bearer ${vencido}` });
    assert.strictEqual(res.status, 401);
    assert.match((await res.json()).error, /expiro/);
  });

  test('token firmado con otro secreto -> 401', async () => {
    const ajeno = jwt.sign({ id: 1, usuario: 'admin' }, 'otro_secreto');
    const res = await admin({ Authorization: `Bearer ${ajeno}` });
    assert.strictEqual(res.status, 401);
  });

  test('token valido pasa el middleware (404 porque la ruta de prueba no existe)', async () => {
    const { token } = await (await login({ usuario: 'admin', password: PASSWORD, captchaToken: CAPTCHA_OK })).json();
    const res = await admin({ Authorization: `Bearer ${token}` });
    assert.strictEqual(res.status, 404);
  });
});
