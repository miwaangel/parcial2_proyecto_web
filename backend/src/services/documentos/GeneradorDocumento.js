/**
 * Clase base (abstracta) de todos los documentos que genera el sistema.
 * DocumentoFactory siempre regresa un objeto de este tipo, asi el controlador
 * no necesita saber que clase concreta (PDF, constancia, etc.) lo genera.
 */
class GeneradorDocumento {
  constructor() {
    if (new.target === GeneradorDocumento) {
      throw new Error('GeneradorDocumento es abstracta: usa DocumentoFactory.crear()');
    }
  }

  /** Tipo MIME del archivo generado (ej. 'application/pdf'). */
  get contentType() {
    throw new Error('contentType no implementado');
  }

  /** Nombre sugerido para la descarga. */
  // eslint-disable-next-line no-unused-vars
  nombreArchivo(datos) {
    throw new Error('nombreArchivo() no implementado');
  }

  /**
   * @param {object} datos
   * @returns {Promise<Buffer>}
   */
  // eslint-disable-next-line no-unused-vars
  async generar(datos) {
    throw new Error('generar() no implementado');
  }
}

module.exports = GeneradorDocumento;
