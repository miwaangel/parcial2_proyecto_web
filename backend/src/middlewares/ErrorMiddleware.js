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

    const traducido = ErrorMiddleware.traducirSequelize(err);
    if (traducido) {
      return res.status(traducido.status).json({ error: traducido.error });
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

  /**
   * Convierte errores del ORM en respuestas del contrato:
   *   validacion del modelo     -> 400 (primer mensaje)
   *   valor unico repetido      -> 409
   *   llave foranea (RESTRICT)  -> 409 (registro en uso) / 400 (referencia inexistente)
   * @returns {{ status: number, error: string } | null}
   */
  static traducirSequelize(err) {
    switch (err.name) {
      case 'SequelizeValidationError':
        return { status: 400, error: err.errors?.[0]?.message || 'Datos invalidos' };
      case 'SequelizeUniqueConstraintError': {
        const campo = err.errors?.[0]?.path;
        return { status: 409, error: campo ? `Ya existe un registro con ese ${campo}` : 'Registro duplicado' };
      }
      case 'SequelizeForeignKeyConstraintError':
        return /^\s*DELETE/i.test(err.sql || err.parent?.sql || '')
          ? { status: 409, error: 'No se puede eliminar: el registro esta en uso' }
          : { status: 400, error: 'Alguno de los catalogos seleccionados no existe' };
      default:
        return null;
    }
  }
}

module.exports = ErrorMiddleware;
