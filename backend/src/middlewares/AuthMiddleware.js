const jwt = require('jsonwebtoken');
const Config = require('../app/Config');

/**
 * Protege las rutas privadas. Ya esta montado en routes/index.js para TODO /api/admin/*,
 * asi que las rutas de administracion no necesitan agregarlo de nuevo.
 *
 * Espera el header:  Authorization: Bearer <token>
 * Si es valido deja los datos del usuario en req.usuario = { id, usuario, nombre }.
 */
class AuthMiddleware {
  static verificar(req, res, next) {
    const header = req.headers.authorization || '';
    const [tipo, token] = header.split(' ');

    if (tipo !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Falta el token de autenticacion' });
    }

    try {
      const { id, usuario, nombre } = jwt.verify(token, Config.jwtSecret);
      req.usuario = { id, usuario, nombre };
      return next();
    } catch (err) {
      const error = err.name === 'TokenExpiredError'
        ? 'La sesion expiro, inicia sesion de nuevo'
        : 'Token invalido';
      return res.status(401).json({ error });
    }
  }
}

module.exports = AuthMiddleware;
