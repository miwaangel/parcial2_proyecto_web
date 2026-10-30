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
