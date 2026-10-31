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

**Mientras no exista el modelo `Usuario`** el login usa `ADMIN_USER` / `ADMIN_PASS_HASH` del `.env`:
```bash
npm run hash -- Admin123      # copia el resultado en ADMIN_PASS_HASH
```
Cuando Angel suba el modelo, solo se cambia `AuthService.buscarUsuario()` (el comentario dice cómo).

**reCAPTCHA:** el `.env.example` trae la llave secreta de **prueba** de Google (siempre aprueba). Para el front, la llave pública de prueba es `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`. Para la entrega, registrar el sitio en https://www.google.com/recaptcha/admin (v2 "No soy un robot", dominio `localhost`) y cambiar ambas llaves.

## Agregar un recurso nuevo
1. `services/XService.js` — clase con la lógica.
2. `controllers/XController.js` — `class XController extends BaseController`.
3. `routes/XRoutes.js` — clase con `this.router`.
4. Una línea en `routes/index.js` → `this.router.use('/x', new XRoutes().router);`
