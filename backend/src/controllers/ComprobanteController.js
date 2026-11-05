const BaseController = require('./BaseController');
const ComprobanteService = require('../services/ComprobanteService');

class ComprobanteController extends BaseController {
  constructor(comprobanteService = new ComprobanteService()) {
    super();
    this.comprobanteService = comprobanteService;
  }

  /**
   * GET /api/solicitudes/:id/comprobante?curp=X
   * Respuesta: 200 application/pdf (descarga)
   * Errores:   400 id o CURP invalidos, 404 no existe o la CURP no coincide
   */
  async descargar(req, res) {
    const { archivo, contentType, nombre } = await this.comprobanteService.generar(
      req.params.id,
      req.query.curp,
    );

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${nombre}"`,
      'Content-Length': archivo.length,
      'Cache-Control': 'no-store',
    });
    return res.status(200).send(archivo);
  }
}

module.exports = ComprobanteController;
