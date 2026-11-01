const { Router } = require('express');
const SolicitudController = require('../controllers/SolicitudController');
const ComprobanteController = require('../controllers/ComprobanteController');

/** Publicas: /api/solicitudes (issues #13 y #15). */
class SolicitudRoutes {
  constructor(controller = new SolicitudController(), comprobanteController = new ComprobanteController()) {
    this.router = Router();
    this.router.post('/', controller.crear);
    this.router.get('/buscar', controller.buscar);
    this.router.put('/:id', controller.actualizarPublica);
    this.router.get('/:id/comprobante', comprobanteController.descargar);
  }
}

/** Privadas: /api/admin/solicitudes (issue #14). Protegidas por AuthMiddleware en routes/index.js. */
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
