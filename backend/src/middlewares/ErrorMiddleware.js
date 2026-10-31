const Config = require('../app/Config');

/**
 * Manejo global de errores.
 * Toda respuesta de error tiene la forma { "error": "mensaje" } (docs/contrato-api.md).
 */
class ErrorMiddleware {
  /** Ruta que no existe -> 404. */
  static notFound(req, res) {
    res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
  }

  /**
   * Captura cualquier error lanzado en rutas, controladores o servicios.
   * Express 5 manda aqui tambien los errores de funciones async.
   */
  // Express reconoce un manejador de errores porque recibe 4 parametros.
  // eslint-disable-next-line no-unused-vars
  static handle(err, req, res, next) {
    // Body con JSON mal formado
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'El cuerpo de la peticion no es JSON valido' });
    }

    const status = Number.isInteger(err.status) ? err.status : 500;

    if (status >= 500 && !Config.isTest) {
      console.error(err);
    }

    // En produccion no se exponen detalles internos de errores 500
    const message = status >= 500 && Config.isProduction
      ? 'Error interno del servidor'
      : err.message || 'Error interno del servidor';

    return res.status(status).json({ error: message });
  }
}

module.exports = ErrorMiddleware;
