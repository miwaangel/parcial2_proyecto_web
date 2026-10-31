const BaseController = require('./BaseController');
const HealthService = require('../services/HealthService');

class HealthController extends BaseController {
  constructor(healthService = new HealthService()) {
    super();
    this.healthService = healthService;
  }

  /** GET /api/health -> 200 { "status": "ok" } */
  estado(req, res) {
    return this.ok(res, this.healthService.obtenerEstado());
  }
}

module.exports = HealthController;
