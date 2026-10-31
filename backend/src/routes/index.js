const { Router } = require('express');
const HealthRoutes = require('./HealthRoutes');

/**
 * Router principal: monta cada grupo de rutas bajo /api.
 * ARCHIVO COMPARTIDO: para agregar un grupo, una linea en registrar(). Cambios pequenos.
 *
 *   this.router.use('/catalogos', new CatalogoRoutes().router);
 *   this.router.use('/admin/estadisticas', new EstadisticasRoutes().router);
 */
class ApiRouter {
  constructor() {
    this.router = Router();
    this.registrar();
  }

  registrar() {
    this.router.use('/health', new HealthRoutes().router);
  }
}

module.exports = ApiRouter;
