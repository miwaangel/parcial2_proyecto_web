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

## Agregar un recurso nuevo
1. `services/XService.js` — clase con la lógica.
2. `controllers/XController.js` — `class XController extends BaseController`.
3. `routes/XRoutes.js` — clase con `this.router`.
4. Una línea en `routes/index.js` → `this.router.use('/x', new XRoutes().router);`
