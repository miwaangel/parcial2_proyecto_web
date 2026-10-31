const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Config = require('../app/Config');
const HttpError = require('../app/HttpError');
const CaptchaService = require('./CaptchaService');
const { Usuario } = require('../models');

/**
 * Login de administradores con JWT (issue #10) + captcha (issue #11).
 * Los usuarios vienen de la tabla `usuarios` (el admin inicial lo crea el seeder).
 */
class AuthService {
  constructor(captchaService = new CaptchaService()) {
    this.captchaService = captchaService;
  }

  /**
   * Usuario activo con su passwordHash.
   * El modelo oculta passwordHash por defecto; el scope 'conPassword' lo incluye.
   */
  async buscarUsuario(usuario) {
    return Usuario.scope('conPassword').findOne({ where: { usuario, activo: true } });
  }

  /**
   * @param {{ usuario: string, password: string, captchaToken: string }} datos
   * @param {string} [ip]
   * @returns {Promise<{ token: string, usuario: { id: number, usuario: string, nombre: string } }>}
   */
  async login({ usuario, password, captchaToken } = {}, ip) {
    // 1. El captcha va ANTES de revisar usuario y password
    await this.captchaService.verificar(captchaToken, ip);

    if (!usuario || !password) {
      throw HttpError.badRequest('Usuario y password son obligatorios');
    }

    // 2. Mismo mensaje si no existe o si el password esta mal (no revela cual fallo)
    const encontrado = await this.buscarUsuario(String(usuario).trim());
    const valido = encontrado && await bcrypt.compare(String(password), encontrado.passwordHash);
    if (!valido) {
      throw HttpError.unauthorized('Usuario o password incorrectos');
    }

    return this.crearSesion(encontrado);
  }

  /** Genera el JWT y el usuario que recibe el front (nunca incluye passwordHash). */
  crearSesion({ id, usuario, nombre }) {
    const datos = { id, usuario, nombre };
    const token = jwt.sign(datos, Config.jwtSecret, { expiresIn: Config.jwtExpiresIn });
    return { token, usuario: datos };
  }
}

module.exports = AuthService;
