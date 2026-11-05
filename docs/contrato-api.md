# Contrato de API — Ticket de turno

> Este documento es el acuerdo del equipo. **Nadie cambia un nombre de campo o endpoint sin avisar a los otros dos.**
> Si algo cambia, se actualiza aquí en el mismo PR.

| Integrante | Usuario GitHub | Rama | Responsable de |
|---|---|---|---|
| Angel | `miwaangel` | `miwa` | Base de datos (Sequelize/MySQL), turnos, estadísticas |
| Orlando | `Tusked-D` | `orlando` | Backend (Express, MVC, auth, API, PDF) |
| Alanis | `Angel-Alanis` | `alanis` | Frontend (React) |

---

## 1. Modelo de datos

Convenciones:
- Nombres de tablas en minúsculas y plural (se define `tableName` en cada modelo de Sequelize).
- Columnas y campos JSON en **camelCase**.
- Todas las tablas tienen `id` (INT, autoincremental, PK), `createdAt` y `updatedAt`.

### Catálogos

**`municipios`** · modelo `Municipio`
| Campo | Tipo | Reglas |
|---|---|---|
| id | INT | PK |
| nombre | VARCHAR(100) | obligatorio, único |
| activo | BOOLEAN | default `true` |

**`niveles_educativos`** · modelo `NivelEducativo`
| Campo | Tipo | Reglas |
|---|---|---|
| id | INT | PK |
| nombre | VARCHAR(100) | obligatorio, único (ej. Primaria, Secundaria, Bachillerato) |
| activo | BOOLEAN | default `true` |

**`asuntos`** · modelo `Asunto`
| Campo | Tipo | Reglas |
|---|---|---|
| id | INT | PK |
| nombre | VARCHAR(150) | obligatorio, único (ej. Inscripción, Cambio de escuela) |
| activo | BOOLEAN | default `true` |

### Principal

**`solicitudes`** · modelo `Solicitud`
| Campo | Tipo | Reglas |
|---|---|---|
| id | INT | PK |
| curp | CHAR(18) | obligatorio, mayúsculas, formato CURP |
| nombreCompleto | VARCHAR(150) | obligatorio — persona que realiza el trámite |
| nombre | VARCHAR(80) | obligatorio — alumno |
| paterno | VARCHAR(80) | obligatorio |
| materno | VARCHAR(80) | opcional |
| telefono | VARCHAR(15) | opcional |
| celular | VARCHAR(15) | obligatorio |
| correo | VARCHAR(120) | obligatorio, formato email |
| nivelId | INT | FK → niveles_educativos.id |
| municipioId | INT | FK → municipios.id |
| asuntoId | INT | FK → asuntos.id |
| turno | INT | asignado por el sistema, **empieza en 1 por municipio** |
| estatus | ENUM('Pendiente','Resuelto') | default `Pendiente` |

Índice único: **`(municipioId, turno)`**

Validación de CURP (regex): `^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$`

### Seguridad

**`usuarios`** · modelo `Usuario`
| Campo | Tipo | Reglas |
|---|---|---|
| id | INT | PK |
| usuario | VARCHAR(50) | obligatorio, único |
| passwordHash | VARCHAR(255) | bcrypt, **nunca se devuelve en la API** |
| nombre | VARCHAR(100) | obligatorio |
| activo | BOOLEAN | default `true` |

### Relaciones
- `Solicitud.belongsTo(Municipio)` / `Municipio.hasMany(Solicitud)`
- `Solicitud.belongsTo(NivelEducativo)` / `NivelEducativo.hasMany(Solicitud)`
- `Solicitud.belongsTo(Asunto)` / `Asunto.hasMany(Solicitud)`

---

## 2. Formato de respuestas

### Solicitud (así la devuelve la API en todos los endpoints)
```json
{
  "id": 15,
  "curp": "PEGJ050312HCLRRN09",
  "nombreCompleto": "María Pérez López",
  "nombre": "Juan",
  "paterno": "Pérez",
  "materno": "García",
  "telefono": "8441234567",
  "celular": "8449876543",
  "correo": "maria@correo.com",
  "turno": 7,
  "estatus": "Pendiente",
  "municipio": { "id": 30, "nombre": "Saltillo" },
  "nivel":     { "id": 2,  "nombre": "Secundaria" },
  "asunto":    { "id": 1,  "nombre": "Inscripción" },
  "createdAt": "2026-10-28T18:00:00.000Z",
  "updatedAt": "2026-10-28T18:00:00.000Z"
}
```

### Elemento de catálogo
```json
{ "id": 30, "nombre": "Saltillo", "activo": true }
```

### Errores (todos los endpoints)
```json
{ "error": "Mensaje entendible para el usuario" }
```
| Código | Cuándo |
|---|---|
| 400 | Datos inválidos (falta un campo, CURP mal formada, captcha inválido) |
| 401 | Sin token, token inválido o expirado, usuario/contraseña incorrectos |
| 404 | No existe el registro |
| 409 | Conflicto (ej. nombre de catálogo repetido, modificar una solicitud ya resuelta) |
| 500 | Error del servidor |
| 502 | No se pudo verificar el captcha con Google (reintentar) |

---

## 3. Endpoints

Base URL: `http://localhost:3000/api`
Rutas `/admin/*` requieren header: `Authorization: Bearer <token>`

### Públicos
| Método | Ruta | Body / Query | Respuesta |
|---|---|---|---|
| GET | `/health` | — | `{ "status": "ok" }` |
| GET | `/catalogos/municipios` | — | `[catálogo]` (solo activos) |
| GET | `/catalogos/niveles` | — | `[catálogo]` |
| GET | `/catalogos/asuntos` | — | `[catálogo]` |
| POST | `/solicitudes` | Solicitud sin `id`, `turno`, `estatus`; con `municipioId`, `nivelId`, `asuntoId` | `201` + Solicitud (ya con turno) |
| GET | `/solicitudes/buscar?curp=X&turno=N&municipioId=M` | — | Solicitud o `404` (`400` si CURP + turno existe en varios municipios y no se mandó `municipioId`) |
| PUT | `/solicitudes/:id` | campos a modificar + `curp` y `turno` para verificar | Solicitud actualizada o `404` si no coinciden; `409` si ya está Resuelta. No cambia `curp`, `municipioId`, `turno` ni `estatus` |
| GET | `/solicitudes/:id/comprobante?curp=X` | — | Archivo PDF (`application/pdf`) |
| POST | `/auth/login` | `{ "usuario", "password", "captchaToken" }` | `{ "token", "usuario": { "id", "usuario", "nombre" } }` |

> Nota: como el turno se repite entre municipios (cada uno empieza en 1), la búsqueda pública usa **CURP + turno**, y opcionalmente `municipioId` para desempatar.

### Administración (requieren token)
| Método | Ruta | Body / Query | Respuesta |
|---|---|---|---|
| GET | `/admin/solicitudes?q=texto&municipioId=M&estatus=E` | busca por CURP o nombre/apellidos; `municipioId` y `estatus` opcionales | `[Solicitud]` |
| GET | `/admin/solicitudes/:id` | — | Solicitud |
| POST | `/admin/solicitudes` | igual que el POST público | `201` + Solicitud |
| PUT | `/admin/solicitudes/:id` | campos a modificar (incluye `estatus`); si cambia `municipioId` se asigna el siguiente turno de ese municipio | Solicitud |
| DELETE | `/admin/solicitudes/:id` | — | `204` |
| PATCH | `/admin/solicitudes/:id/estatus` | `{ "estatus": "Resuelto" }` | Solicitud |
| GET | `/admin/catalogos/:tipo` | `tipo` = municipios \| niveles \| asuntos | `[catálogo]` (incluye inactivos) |
| POST | `/admin/catalogos/:tipo` | `{ "nombre" }` | `201` + catálogo |
| PUT | `/admin/catalogos/:tipo/:id` | `{ "nombre", "activo" }` | catálogo |
| DELETE | `/admin/catalogos/:tipo/:id` | — | `204` (o `409` si tiene solicitudes) |
| GET | `/admin/estadisticas?municipioId=M` | `municipioId` opcional | `{ "resuelto": 12, "pendiente": 30, "total": 42 }` |

---

## 4. Carpetas y dueños (para evitar conflictos en Git)

```
backend/
  src/
    app/            Orlando   (clase App, servidor)
    config/         Angel     (Database.js - Singleton)
    models/         Angel     (modelos + index.js)
    migrations/     Angel
    seeders/        Angel
    services/       Orlando   (excepto TurnoService.js y EstadisticasService.js → Angel)
    controllers/    Orlando   (excepto EstadisticasController.js → Angel)
    routes/         Orlando   (index.js es compartido: cambios pequeños)
    middlewares/    Orlando
frontend/           Alanis
docs/               Todos
```

## 5. Interfaces acordadas

**Backend**
```js
// Angel implementa, Orlando usa
const Database = require('./config/Database');
const sequelize = Database.getInstance();

const { Solicitud, Municipio, NivelEducativo, Asunto, Usuario } = require('./models');

const TurnoService = require('./services/TurnoService');
const turno = await TurnoService.asignarTurno(municipioId, transaction);
```

**Frontend**
- Toda llamada a la API pasa por `src/services/*Service.js`.
- Variable `VITE_USE_MOCKS=true` → los servicios devuelven datos de `src/mocks/*.json` con la misma forma de este documento.
- Variable `VITE_API_URL=http://localhost:3000/api`.

## 6. Flujo de Git

- `main`: solo código que funciona. Nadie hace push directo después del kickoff.
- `develop`: integración. Todo entra aquí por **Pull Request**.
- Ramas personales: `miwa`, `orlando`, `alanis`. Antes de empezar a trabajar: `git pull origin develop`.
- Mensajes de commit: `tipo: descripción` → `feat: modelo Solicitud`, `fix: validación CURP`, `docs: contrato api`.
- Al abrir el PR escribir `Closes #N` para cerrar el issue.
