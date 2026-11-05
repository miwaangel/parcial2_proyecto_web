const { Router } = require('express');
const SolicitudController = require('../controllers/SolicitudController');
const ComprobanteController = require('../controllers/ComprobanteController');

/**
 * @openapi
 * /solicitudes:
 *   post:
 *     tags: [Solicitudes (publico)]
 *     summary: Registra una solicitud y asigna su turno
 *     description: >
 *       El turno lo asigna el servidor (consecutivo por municipio). Si el cliente manda
 *       id, turno o estatus se ignoran. Nivel, asunto y municipio deben existir y estar activos.
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/SolicitudEntrada' } } }
 *     responses:
 *       201:
 *         description: Creada, con su turno
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Solicitud' } } }
 *       400: { $ref: '#/components/responses/Error400' }
 * /solicitudes/buscar:
 *   get:
 *     tags: [Solicitudes (publico)]
 *     summary: Busca la solicitud del ciudadano con su CURP y turno
 *     parameters:
 *       - { name: curp, in: query, required: true, schema: { type: string }, example: PEGJ050312HCLRRN09 }
 *       - { name: turno, in: query, required: true, schema: { type: integer }, example: 1 }
 *       - { name: municipioId, in: query, required: false, schema: { type: integer }, description: 'Para desempatar si la CURP tiene el mismo turno en dos municipios' }
 *     responses:
 *       200:
 *         description: OK
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Solicitud' } } }
 *       400: { $ref: '#/components/responses/Error400' }
 *       404: { $ref: '#/components/responses/Error404' }
 * /solicitudes/{id}:
 *   put:
 *     tags: [Solicitudes (publico)]
 *     summary: El ciudadano modifica su solicitud
 *     description: >
 *       Manda la CURP y el turno actuales para comprobar que es suya. No se puede cambiar
 *       CURP, municipio, turno ni estatus. Si ya esta Resuelta responde 409.
 *     parameters: [{ $ref: '#/components/parameters/id' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [curp, turno]
 *             properties:
 *               curp: { type: string, example: PEGJ050312HCLRRN09 }
 *               turno: { type: integer, example: 1 }
 *               nombreCompleto: { type: string }
 *               nombre: { type: string }
 *               paterno: { type: string }
 *               materno: { type: string }
 *               telefono: { type: string }
 *               celular: { type: string, example: '8440000000' }
 *               correo: { type: string }
 *               nivelId: { type: integer }
 *               asuntoId: { type: integer }
 *     responses:
 *       200:
 *         description: Actualizada
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Solicitud' } } }
 *       400: { $ref: '#/components/responses/Error400' }
 *       404:
 *         description: No existe o la CURP / turno no coinciden
 *         content: { application/json: { example: { error: No existe una solicitud con esa CURP y turno } } }
 *       409:
 *         description: Ya fue resuelta
 *         content: { application/json: { example: { error: La solicitud ya fue resuelta y no se puede modificar } } }
 * /solicitudes/{id}/comprobante:
 *   get:
 *     tags: [Solicitudes (publico)]
 *     summary: Descarga el comprobante en PDF con codigo QR de la CURP
 *     parameters:
 *       - $ref: '#/components/parameters/id'
 *       - { name: curp, in: query, required: true, schema: { type: string }, example: PEGJ050312HCLRRN09 }
 *     responses:
 *       200:
 *         description: Archivo PDF
 *         content: { application/pdf: { schema: { type: string, format: binary } } }
 *       400: { $ref: '#/components/responses/Error400' }
 *       404: { $ref: '#/components/responses/Error404' }
 */
class SolicitudRoutes {
  constructor(controller = new SolicitudController(), comprobanteController = new ComprobanteController()) {
    this.router = Router();
    this.router.post('/', controller.crear);
    this.router.get('/buscar', controller.buscar);
    this.router.put('/:id', controller.actualizarPublica);
    this.router.get('/:id/comprobante', comprobanteController.descargar);
  }
}

/**
 * @openapi
 * /admin/solicitudes:
 *   get:
 *     tags: [Solicitudes (admin)]
 *     summary: Busca solicitudes por CURP o nombre, con filtros
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: q, in: query, schema: { type: string }, example: juan perez, description: 'Cada palabra se busca en CURP, nombre, apellidos y nombre de quien tramita' }
 *       - { name: municipioId, in: query, schema: { type: integer } }
 *       - { name: estatus, in: query, schema: { $ref: '#/components/schemas/Estatus' } }
 *     responses:
 *       200:
 *         description: Lista (mas recientes primero, maximo 500)
 *         content: { application/json: { schema: { type: array, items: { $ref: '#/components/schemas/Solicitud' } } } }
 *       400: { $ref: '#/components/responses/Error400' }
 *       401: { $ref: '#/components/responses/Error401' }
 *   post:
 *     tags: [Solicitudes (admin)]
 *     summary: Registra una solicitud desde el panel (igual que la publica)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/SolicitudEntrada' } } }
 *     responses:
 *       201:
 *         description: Creada
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Solicitud' } } }
 *       400: { $ref: '#/components/responses/Error400' }
 *       401: { $ref: '#/components/responses/Error401' }
 * /admin/solicitudes/{id}:
 *   get:
 *     tags: [Solicitudes (admin)]
 *     summary: Obtiene una solicitud
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/id' }]
 *     responses:
 *       200:
 *         description: OK
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Solicitud' } } }
 *       401: { $ref: '#/components/responses/Error401' }
 *       404: { $ref: '#/components/responses/Error404' }
 *   put:
 *     tags: [Solicitudes (admin)]
 *     summary: Edita cualquier dato (y estatus)
 *     description: Si cambia el municipio, recibe el siguiente turno de ese municipio.
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/id' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/SolicitudEntrada'
 *               - type: object
 *                 properties: { estatus: { $ref: '#/components/schemas/Estatus' } }
 *     responses:
 *       200:
 *         description: Actualizada
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Solicitud' } } }
 *       400: { $ref: '#/components/responses/Error400' }
 *       401: { $ref: '#/components/responses/Error401' }
 *       404: { $ref: '#/components/responses/Error404' }
 *   delete:
 *     tags: [Solicitudes (admin)]
 *     summary: Elimina una solicitud
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/id' }]
 *     responses:
 *       204: { description: Eliminada }
 *       401: { $ref: '#/components/responses/Error401' }
 *       404: { $ref: '#/components/responses/Error404' }
 * /admin/solicitudes/{id}/estatus:
 *   patch:
 *     tags: [Solicitudes (admin)]
 *     summary: Cambia el estatus (Pendiente / Resuelto)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/id' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estatus]
 *             properties: { estatus: { $ref: '#/components/schemas/Estatus' } }
 *     responses:
 *       200:
 *         description: Actualizada
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Solicitud' } } }
 *       400: { $ref: '#/components/responses/Error400' }
 *       401: { $ref: '#/components/responses/Error401' }
 *       404: { $ref: '#/components/responses/Error404' }
 */
class SolicitudAdminRoutes {
  constructor(controller = new SolicitudController()) {
    this.router = Router();
    this.router.get('/', controller.listar);
    this.router.post('/', controller.crear);
    this.router.get('/:id', controller.obtener);
    this.router.put('/:id', controller.actualizar);
    this.router.patch('/:id/estatus', controller.cambiarEstatus);
    this.router.delete('/:id', controller.eliminar);
  }
}

module.exports = { SolicitudRoutes, SolicitudAdminRoutes };
