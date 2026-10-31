const { Router } = require('express');
const HealthController = require('../controllers/HealthController');

class HealthRoutes {
  constructor(controller = new HealthController()) {
    this.router = Router();
    this.router.get('/', controller.estado);
  }
}

module.exports = HealthRoutes;
