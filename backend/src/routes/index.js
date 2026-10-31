const { Router } = require('express');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const HealthRoutes = require('./HealthRoutes');
const AuthRoutes = require('./AuthRoutes');
const SolicitudRoutes = require('./SolicitudRoutes');
const { CatalogoRoutes, CatalogoAdminRoutes } = require('./CatalogoRoutes');

/**
 * Router principal: monta cada grupo de rutas bajo /api.
 * ARCHIVO COMPARTIDO: para agregar un grupo, una linea en registrar(). Cambios pequenos.
 *
 * Todo lo que se monte DESPUES de la linea de AuthMiddleware con prefijo /admin
 * queda protegido con JWT automaticamente:
 *
 *   this.router.use('/admin/estadisticas', new EstadisticasRoutes().router);
 */
class ApiRouter {
  constructor() {
    this.router = Router();
    this.registrar();
  }

  registrar() {
    // Publicas
    this.router.use('/health', new HealthRoutes().router);
    this.router.use('/auth', new AuthRoutes().router);
    this.router.use('/solicitudes', new SolicitudRoutes().router);
    this.router.use('/catalogos', new CatalogoRoutes().router);

    // Privadas: todo /api/admin/* requiere token
    this.router.use('/admin', AuthMiddleware.verificar);
    this.router.use('/admin/catalogos', new CatalogoAdminRoutes().router);
  }
}

module.exports = ApiRouter;
