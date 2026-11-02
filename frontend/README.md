# Frontend — Ticket de turno

## Desarrollo local

```bash
npm install
copy .env.example .env
npm run dev
```

Para una demostración sin MySQL, usa `VITE_USE_MOCKS=true` en `.env`. El usuario
de demostración es `admin` y la contraseña `admin123`. Los servicios mantienen
la misma forma de datos que el contrato de la API.

Para integración con el backend, usa `VITE_USE_MOCKS=false` y verifica que
`VITE_API_URL` apunte a `http://localhost:3000/api`.

## Validación

```bash
npm run lint
npm run build
```

Flujo manual de humo: solicitar un turno, consultarlo por CURP y turno,
modificarlo, iniciar sesión, revisar el dashboard, cambiar el estatus de una
solicitud y crear/editar/desactivar un catálogo.

Los formularios validan en cliente y servidor: CURP de 18 caracteres con fecha,
sexo, entidad y consonantes internas consistentes; nombres con caracteres
permitidos; teléfonos de exactamente 10 dígitos; correo electrónico; catálogos
obligatorios y turnos enteros positivos. El backend siempre repite estas
validaciones para no confiar en datos enviados desde el navegador.
