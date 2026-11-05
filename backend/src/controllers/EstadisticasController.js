const BaseController = require('./BaseController');
const EstadisticasService = require('../services/EstadisticasService');

class EstadisticasController extends BaseController {
  constructor(service = new EstadisticasService()) {
    super();
    this.service = service;
  }

  async obtener(req, res) {
    return this.ok(res, await this.service.obtener(req.query.municipioId));
  }
}

module.exports = EstadisticasController;
