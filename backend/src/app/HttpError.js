/**
 * Error con codigo HTTP.
 * Servicios y controladores lo lanzan; ErrorMiddleware lo convierte en
 * la respuesta { "error": "mensaje" } definida en docs/contrato-api.md.
 *
 *   throw HttpError.notFound('No existe la solicitud');
 */
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }

  static badRequest(message = 'Datos invalidos') {
    return new HttpError(400, message);
  }

  static unauthorized(message = 'No autorizado') {
    return new HttpError(401, message);
  }

  static notFound(message = 'No existe el registro') {
    return new HttpError(404, message);
  }

  static conflict(message = 'Conflicto con el estado actual del registro') {
    return new HttpError(409, message);
  }
}

module.exports = HttpError;
