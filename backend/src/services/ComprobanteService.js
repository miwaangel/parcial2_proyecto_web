const HttpError = require('../app/HttpError');
const DocumentoFactory = require('./documentos/DocumentoFactory');
const solicitudEjemplo = require('../mocks/solicitudEjemplo');

const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;

/**
 * Arma el comprobante de una solicitud (issue #15).
 *
 * TEMPORAL: usa la solicitud de ejemplo del contrato. Cuando Angel suba el modelo
 * Solicitud (issue #6), solo se cambia buscarSolicitud():
 *
 *   const { Solicitud } = require('../models');
 *   return Solicitud.findByPk(id, { include: ['municipio', 'nivel', 'asunto'] });
 *
 * (los alias del include deben ser los del contrato: municipio, nivel, asunto)
 */
class ComprobanteService {
  constructor(factory = DocumentoFactory) {
    this.factory = factory;
  }

  async buscarSolicitud(id) {
    return Number(id) === solicitudEjemplo.id ? solicitudEjemplo : null;
  }

  /**
   * @param {string|number} id
   * @param {string} curp  se pide para que nadie descargue comprobantes ajenos cambiando el id
   * @returns {Promise<{ archivo: Buffer, contentType: string, nombre: string }>}
   */
  async generar(id, curp) {
    const idNumero = Number(id);
    if (!Number.isInteger(idNumero) || idNumero <= 0) {
      throw HttpError.badRequest('El id de la solicitud no es valido');
    }

    const curpLimpia = String(curp || '').trim().toUpperCase();
    if (!curpLimpia) {
      throw HttpError.badRequest('La CURP es obligatoria para descargar el comprobante');
    }
    if (!CURP_REGEX.test(curpLimpia)) {
      throw HttpError.badRequest('La CURP no tiene un formato valido');
    }

    const solicitud = await this.buscarSolicitud(idNumero);
    // Mismo mensaje si no existe o si la CURP no coincide (no revela que el id existe)
    if (!solicitud || String(solicitud.curp).toUpperCase() !== curpLimpia) {
      throw HttpError.notFound('No existe una solicitud con esos datos');
    }

    const documento = this.factory.crear('comprobante');
    return {
      archivo: await documento.generar(solicitud),
      contentType: documento.contentType,
      nombre: documento.nombreArchivo(solicitud),
    };
  }
}

module.exports = ComprobanteService;
