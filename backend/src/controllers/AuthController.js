const BaseController = require('./BaseController');
const AuthService = require('../services/AuthService');

class AuthController extends BaseController {
  constructor(authService = new AuthService()) {
    super();
    this.authService = authService;
  }

  /**
   * POST /api/auth/login
   * Body:      { usuario, password, captchaToken }
   * Respuesta: 200 { token, usuario: { id, usuario, nombre } }
   * Errores:   400 captcha o campos faltantes, 401 credenciales incorrectas
   */
  async login(req, res) {
    const sesion = await this.authService.login(req.body, req.ip);
    return this.ok(res, sesion);
  }
}

module.exports = AuthController;
