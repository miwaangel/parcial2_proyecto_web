const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

/**
 * Configuracion del servidor leida de variables de entorno (.env).
 * Las demas clases piden sus valores aqui en lugar de leer process.env directamente.
 */
class Config {
  static get port() {
    return Number(process.env.PORT) || 3000;
  }

  static get corsOrigin() {
    return process.env.CORS_ORIGIN || 'http://localhost:5173';
  }

  static get jwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret && Config.isProduction) {
      throw new Error('JWT_SECRET es obligatorio en produccion');
    }
    return secret || 'secreto_solo_para_desarrollo';
  }

  static get jwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || '8h';
  }

  static get recaptchaSecret() {
    return process.env.RECAPTCHA_SECRET || '';
  }

  /** Usuario temporal mientras Angel sube el modelo Usuario (issue #6). */
  static get adminUser() {
    return process.env.ADMIN_USER || 'admin';
  }

  static get adminPassHash() {
    return process.env.ADMIN_PASS_HASH || '';
  }

  static get env() {
    return process.env.NODE_ENV || 'development';
  }

  static get isProduction() {
    return Config.env === 'production';
  }

  static get isTest() {
    return Config.env === 'test';
  }
}

module.exports = Config;
