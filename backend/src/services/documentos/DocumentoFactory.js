const ComprobantePdf = require('./ComprobantePdf');

/**
 * PATRON FACTORY (rubrica: patrones de diseno).
 *
 * El controlador pide un documento por su tipo y recibe un GeneradorDocumento,
 * sin conocer la clase concreta que lo crea:
 *
 *   const documento = DocumentoFactory.crear('comprobante');
 *   const pdf = await documento.generar(solicitud);
 *
 * Agregar otro documento (ej. una constancia) = una clase nueva que herede de
 * GeneradorDocumento + una linea en TIPOS. El controlador no cambia.
 */
class DocumentoFactory {
  static TIPOS = {
    comprobante: ComprobantePdf,
  };

  /**
   * @param {string} tipo  clave de TIPOS
   * @returns {import('./GeneradorDocumento')}
   */
  static crear(tipo) {
    const Clase = DocumentoFactory.TIPOS[tipo];
    if (!Clase) {
      throw new Error(`Tipo de documento no soportado: "${tipo}"`);
    }
    return new Clase();
  }
}

module.exports = DocumentoFactory;
