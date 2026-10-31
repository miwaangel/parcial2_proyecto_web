const { Router } = require('express');
const ComprobanteController = require('../controllers/ComprobanteController');

/**
 * Rutas publicas de /api/solicitudes.
 * El issue #13 agrega aqui POST /, GET /buscar y PUT /:id.
 */
class SolicitudRoutes {
  constructor(comprobanteController = new ComprobanteController()) {
    this.router = Router();
    this.router.get('/:id/comprobante', comprobanteController.descargar);
  }
}

module.exports = SolicitudRoutes;
