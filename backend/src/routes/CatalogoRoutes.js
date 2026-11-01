const { Router } = require('express');
const CatalogoController = require('../controllers/CatalogoController');

/**
 * @openapi
 * /catalogos/{tipo}:
 *   get:
 *     tags: [Catalogos]
 *     summary: Lista los registros activos de un catalogo (para los selects del formulario)
 *     parameters: [{ $ref: '#/components/parameters/tipoCatalogo' }]
 *     responses:
 *       200:
 *         description: Registros activos ordenados por nombre
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Catalogo' } }
 *       404: { $ref: '#/components/responses/Error404' }
 */
class CatalogoRoutes {
  constructor(controller = new CatalogoController()) {
    this.router = Router();
    this.router.get('/:tipo', controller.listarActivos);
  }
}

/**
 * @openapi
 * /admin/catalogos/{tipo}:
 *   get:
 *     tags: [Catalogos (admin)]
 *     summary: Lista todos los registros, incluye inactivos
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/tipoCatalogo' }]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Catalogo' } }
 *       401: { $ref: '#/components/responses/Error401' }
 *   post:
 *     tags: [Catalogos (admin)]
 *     summary: Crea un registro
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/tipoCatalogo' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties: { nombre: { type: string, example: Universidad } }
 *     responses:
 *       201:
 *         description: Creado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Catalogo' } } }
 *       400: { $ref: '#/components/responses/Error400' }
 *       401: { $ref: '#/components/responses/Error401' }
 *       409: { $ref: '#/components/responses/Error409' }
 * /admin/catalogos/{tipo}/{id}:
 *   put:
 *     tags: [Catalogos (admin)]
 *     summary: Cambia el nombre y/o lo activa o desactiva
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/tipoCatalogo'
 *       - $ref: '#/components/parameters/id'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre: { type: string, example: Saltillo }
 *               activo: { type: boolean, example: false }
 *     responses:
 *       200:
 *         description: Actualizado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Catalogo' } } }
 *       400: { $ref: '#/components/responses/Error400' }
 *       401: { $ref: '#/components/responses/Error401' }
 *       404: { $ref: '#/components/responses/Error404' }
 *       409: { $ref: '#/components/responses/Error409' }
 *   delete:
 *     tags: [Catalogos (admin)]
 *     summary: Elimina un registro (409 si tiene solicitudes; mejor desactivarlo)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/tipoCatalogo'
 *       - $ref: '#/components/parameters/id'
 *     responses:
 *       204: { description: Eliminado }
 *       401: { $ref: '#/components/responses/Error401' }
 *       404: { $ref: '#/components/responses/Error404' }
 *       409:
 *         description: Tiene solicitudes
 *         content:
 *           application/json:
 *             example: { error: 'No se puede eliminar "Saltillo": tiene 7 solicitud(es). Puedes desactivarlo.' }
 */
class CatalogoAdminRoutes {
  constructor(controller = new CatalogoController()) {
    this.router = Router();
    this.router.get('/:tipo', controller.listarTodos);
    this.router.post('/:tipo', controller.crear);
    this.router.put('/:tipo/:id', controller.actualizar);
    this.router.delete('/:tipo/:id', controller.eliminar);
  }
}

module.exports = { CatalogoRoutes, CatalogoAdminRoutes };
