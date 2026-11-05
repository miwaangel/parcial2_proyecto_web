const { fn, col } = require('sequelize');

const SolicitudValidator = require('./SolicitudValidator');
const { Solicitud } = require('../models');

/**
 * Conteo de solicitudes por estatus para el dashboard (issue #9).
 *
 *   GET /api/admin/estadisticas               -> todas las solicitudes
 *   GET /api/admin/estadisticas?municipioId=M -> solo las de ese municipio
 *
 * Respuesta: { "resuelto": 12, "pendiente": 30, "total": 42 }
 */
class EstadisticasService {
  constructor(validator = new SolicitudValidator()) {
    this.validator = validator;
  }

  async obtener(municipioId) {
    const where = {};
    if (municipioId !== undefined && municipioId !== '') {
      where.municipioId = this.validator.validarId(municipioId, 'El municipio');
    }

    // SELECT estatus, COUNT(id) AS cantidad FROM solicitudes WHERE ... GROUP BY estatus
    const grupos = await Solicitud.findAll({
      attributes: ['estatus', [fn('COUNT', col('id')), 'cantidad']],
      where,
      group: ['estatus'],
      raw: true,
    });

    const contar = (estatus) => Number(grupos.find((g) => g.estatus === estatus)?.cantidad ?? 0);
    const resuelto = contar(Solicitud.ESTATUS.RESUELTO);
    const pendiente = contar(Solicitud.ESTATUS.PENDIENTE);
    return { resuelto, pendiente, total: resuelto + pendiente };
  }
}

module.exports = EstadisticasService;
