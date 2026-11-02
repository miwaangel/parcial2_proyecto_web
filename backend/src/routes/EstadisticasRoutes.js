const { Router } = require('express');
const EstadisticasController = require('../controllers/EstadisticasController');

class EstadisticasRoutes {
  constructor(controller = new EstadisticasController()) {
    this.router = Router();
    this.router.get('/', controller.obtener);
  }
}

module.exports = EstadisticasRoutes;
