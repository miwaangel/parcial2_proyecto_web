const { Router } = require('express');
const CatalogoController = require('../controllers/CatalogoController');

/** Publicas: /api/catalogos/:tipo (solo lectura, solo activos). */
class CatalogoRoutes {
  constructor(controller = new CatalogoController()) {
    this.router = Router();
    this.router.get('/:tipo', controller.listarActivos);
  }
}

/** Privadas: /api/admin/catalogos/:tipo (ya protegidas por AuthMiddleware en routes/index.js). */
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
