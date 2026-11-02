const { Solicitud } = require('../models');

class EstadisticasService {
  async obtener(municipioId) {
    const where = municipioId ? { municipioId: Number(municipioId) } : {};
    const [resuelto, pendiente] = await Promise.all([
      Solicitud.count({ where: { ...where, estatus: 'Resuelto' } }),
      Solicitud.count({ where: { ...where, estatus: 'Pendiente' } }),
    ]);
    return { resuelto, pendiente, total: resuelto + pendiente };
  }
}

module.exports = EstadisticasService;
