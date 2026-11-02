const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

/**
 * Documentacion de la API (issue #16).
 * Las rutas se documentan con comentarios @openapi en src/routes/*.js;
 * aqui van las piezas comunes: esquemas, errores y seguridad.
 *
 *   /api/docs       -> pagina de Swagger UI
 *   /api/docs.json  -> especificacion OpenAPI en JSON
 */
class SwaggerConfig {
  static especificacion() {
    return swaggerJsdoc({
      definition: {
        openapi: '3.0.3',
        info: {
          title: 'API Ticket de Turno',
          version: '1.0.0',
          description: 'Solicitud de turnos por municipio y panel de administracion. '
            + 'Errores siempre con la forma `{ "error": "mensaje" }`. '
            + 'Para probar rutas de admin: haz login, copia el `token` y pegalo en **Authorize**.',
        },
        servers: [{ url: '/api' }],
        tags: [
          { name: 'Salud' },
          { name: 'Autenticacion' },
          { name: 'Catalogos' },
          { name: 'Solicitudes (publico)' },
          { name: 'Solicitudes (admin)' },
          { name: 'Catalogos (admin)' },
        ],
        components: SwaggerConfig.componentes(),
      },
      // swagger-jsdoc recibe el patrón como glob; normalizarlo evita que
      // las rutas se ignoren en Windows por los separadores invertidos.
      apis: [path.join(__dirname, '../routes/*.js').replace(/\\/g, '/')],
    });
  }

  static componentes() {
    const error = (descripcion, ejemplo) => ({
      description: descripcion,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: ejemplo } } },
    });
    const catalogoAnidado = {
      type: 'object',
      properties: { id: { type: 'integer' }, nombre: { type: 'string' } },
    };

    return {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      parameters: {
        id: { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } },
        tipoCatalogo: {
          name: 'tipo', in: 'path', required: true, schema: { type: 'string', enum: ['municipios', 'niveles', 'asuntos'] },
        },
      },
      responses: {
        Error400: error('Datos invalidos', 'La CURP no tiene un formato valido (18 caracteres)'),
        Error401: error('Sin token, token invalido o expirado', 'Falta el token de autenticacion'),
        Error404: error('No existe', 'No existe el registro'),
        Error409: error('Conflicto', 'Ya existe un registro con ese nombre'),
      },
      schemas: {
        Error: {
          type: 'object', required: ['error'], properties: { error: { type: 'string' } },
        },
        Catalogo: {
          type: 'object',
          properties: { id: { type: 'integer', example: 30 }, nombre: { type: 'string', example: 'Saltillo' }, activo: { type: 'boolean', example: true } },
        },
        Estatus: { type: 'string', enum: ['Pendiente', 'Resuelto'] },
        Solicitud: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 15 },
            curp: { type: 'string', example: 'PEGJ050312HCLRRN09' },
            nombreCompleto: { type: 'string', example: 'María Pérez López', description: 'Quien realiza el tramite' },
            nombre: { type: 'string', example: 'Juan' },
            paterno: { type: 'string', example: 'Pérez' },
            materno: { type: 'string', nullable: true, example: 'García' },
            telefono: { type: 'string', nullable: true, example: '8441234567' },
            celular: { type: 'string', example: '8449876543' },
            correo: { type: 'string', example: 'maria@correo.com' },
            turno: { type: 'integer', example: 7, description: 'Lo asigna el servidor; empieza en 1 por municipio' },
            estatus: { $ref: '#/components/schemas/Estatus' },
            municipio: catalogoAnidado,
            nivel: catalogoAnidado,
            asunto: catalogoAnidado,
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        SolicitudEntrada: {
          type: 'object',
          required: ['curp', 'nombreCompleto', 'nombre', 'paterno', 'celular', 'correo', 'nivelId', 'municipioId', 'asuntoId'],
          properties: {
            curp: { type: 'string', example: 'PEGJ050312HCLRRN09' },
            nombreCompleto: { type: 'string', example: 'María Pérez López' },
            nombre: { type: 'string', example: 'Juan' },
            paterno: { type: 'string', example: 'Pérez' },
            materno: { type: 'string', example: 'García' },
            telefono: { type: 'string', example: '8441234567', description: '10 digitos, opcional' },
            celular: { type: 'string', example: '8449876543', description: '10 digitos' },
            correo: { type: 'string', example: 'maria@correo.com' },
            nivelId: { type: 'integer', example: 2 },
            municipioId: { type: 'integer', example: 30 },
            asuntoId: { type: 'integer', example: 1 },
          },
        },
      },
    };
  }

  /** Monta /api/docs y /api/docs.json en la app de Express. */
  static montar(app) {
    const especificacion = SwaggerConfig.especificacion();
    app.get('/api/docs.json', (req, res) => res.json(especificacion));
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(especificacion, {
      customSiteTitle: 'API Ticket de Turno',
      swaggerOptions: { persistAuthorization: true },
    }));
  }
}

module.exports = SwaggerConfig;
