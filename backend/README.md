# Backend — API REST (Express, MVC orientado a objetos)

## Correr
```bash
npm install
cp .env.example .env     # llenar valores
npm run dev              # http://localhost:3000/api/health
npm test                 # pruebas (node:test, sin dependencias extra)
```

## Arquitectura
Cada capa es una **clase**. Una petición recorre:

```
server.js → App → routes/ → controllers/ → services/ → models/ (Sequelize) → MySQL
                     └─ middlewares/ (AuthMiddleware, ErrorMiddleware)
```

| Carpeta | Responsabilidad | Ejemplo |
|---|---|---|
| `app/` | Arranque y piezas comunes: `App` (servidor), `Config` (.env), `HttpError` | `new App().listen()` |
| `routes/` | Solo URL → método del controlador. `index.js` (`ApiRouter`) monta todo bajo `/api` | `HealthRoutes` |
| `controllers/` | Leen `req`, llaman al servicio y responden. Heredan de `BaseController` | `HealthController.estado` |
| `services/` | Lógica de negocio y acceso a modelos. No conocen `req`/`res` | `HealthService` |
| `middlewares/` | Se ejecutan antes/después de los controladores | `ErrorMiddleware` |
| `config/`, `models/`, `migrations/`, `seeders/` | Base de datos (Angel) | `Database.getInstance()` |

## Errores
No se usa `try/catch` en controladores: se lanza un `HttpError` y `ErrorMiddleware` responde con el formato del contrato.

```js
const HttpError = require('../app/HttpError');
throw HttpError.notFound('No existe la solicitud');   // → 404 { "error": "No existe la solicitud" }
```

## Autenticación (login + captcha)
`POST /api/auth/login` con `{ usuario, password, captchaToken }` → `{ token, usuario: { id, usuario, nombre } }`.

1. `CaptchaService` valida `captchaToken` con Google **antes** de revisar el password (400 si falla).
2. `AuthService` compara el password con bcrypt y firma un JWT (`JWT_EXPIRES_IN`, default 8h).
3. `AuthMiddleware` está montado en `routes/index.js` para **todo** `/api/admin/*`: cualquier ruta que se monte bajo `/admin` ya exige `Authorization: Bearer <token>`.

El usuario sale de la tabla `usuarios` (`Usuario.scope('conPassword')`, solo activos). El admin inicial lo crea el seeder con `SEED_ADMIN_USER` / `SEED_ADMIN_PASSWORD` del `.env` (por defecto `admin` / `Admin123!`).

**reCAPTCHA:** el `.env.example` trae la llave secreta de **prueba** de Google (siempre aprueba). Para el front, la llave pública de prueba es `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`. Para la entrega, registrar el sitio en https://www.google.com/recaptcha/admin (v2 "No soy un robot", dominio `localhost`) y cambiar ambas llaves.

## Comprobante PDF con QR
`GET /api/solicitudes/:id/comprobante?curp=X` → descarga `comprobante-turno-N.pdf`.

- La CURP es obligatoria: así nadie descarga el comprobante de otra persona cambiando el `id`. Si no coincide → 404 (mismo mensaje que si no existe).
- El PDF (PDFKit) lleva logo, número de turno, municipio, datos de la solicitud y un **QR que contiene solo la CURP** (`qrcode`).
- La solicitud sale de la BD con `Solicitud.findByPk(id, { include: ['municipio', 'nivel', 'asunto'] })`.

Probar (después de `npm run db:reset`): toma un `id` y su `curp` de la tabla `solicitudes` y abre
`http://localhost:3000/api/solicitudes/<id>/comprobante?curp=<curp>`

## Catálogos (municipios, niveles, asuntos)
| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/catalogos/:tipo` | Solo activos, por nombre → para los selects del formulario |
| GET | `/api/admin/catalogos/:tipo` | Todos, incluye inactivos |
| POST | `/api/admin/catalogos/:tipo` `{ nombre }` | `201` · `400` sin nombre · `409` repetido |
| PUT | `/api/admin/catalogos/:tipo/:id` `{ nombre?, activo? }` | `200` · `404` · `409` repetido |
| DELETE | `/api/admin/catalogos/:tipo/:id` | `204` · `409` si tiene solicitudes (mejor desactivarlo) |

`:tipo` = `municipios` | `niveles` | `asuntos`. Una sola clase (`CatalogoService`) atiende los tres.

## Errores del ORM
`ErrorMiddleware.traducirSequelize` convierte: validación del modelo → 400, valor único repetido → 409, borrar algo referenciado → 409.

## Pruebas
`npm test` **no necesita MySQL**: los modelos se simulan con `mock.method` de `node:test`.

## Patrones de diseño
| Patrón | Dónde | Para qué |
|---|---|---|
| **Factory** | `services/documentos/DocumentoFactory.js` | `DocumentoFactory.crear('comprobante')` regresa un `GeneradorDocumento` (clase abstracta). El controlador no sabe qué clase concreta genera el archivo; agregar otro documento = clase nueva + una línea en `TIPOS`. |
| **Singleton** | `config/Database.js` (Angel) | `Database.getInstance()`: una sola conexión a MySQL para toda la app. |

## Agregar un recurso nuevo
1. `services/XService.js` — clase con la lógica.
2. `controllers/XController.js` — `class XController extends BaseController`.
3. `routes/XRoutes.js` — clase con `this.router`.
4. Una línea en `routes/index.js` → `this.router.use('/x', new XRoutes().router);`
