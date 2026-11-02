const { Router } = require('express');
const HealthController = require('../controllers/HealthController');

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Salud]
 *     summary: Verifica que la API esta funcionando
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example: { status: ok }
 */
class HealthRoutes {
  constructor(controller = new HealthController()) {
    this.router = Router();
    this.router.get('/', controller.estado);
  }
}

module.exports = HealthRoutes;
