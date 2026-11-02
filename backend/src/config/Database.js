const { Sequelize } = require('sequelize');
const configs = require('./config');

/**
 * Patrón Singleton: garantiza una sola conexión a la base de datos
 * compartida por toda la aplicación.
 * Uso: const sequelize = Database.getInstance();
 */
class Database {
  static #instancia = null;

  constructor() {
    if (Database.#instancia) {
      throw new Error('Database es Singleton: usa Database.getInstance()');
    }

    const entorno = process.env.NODE_ENV || 'development';
    const config = configs[entorno];

    this.sequelize = new Sequelize(config.database, config.username, config.password, {
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      timezone: config.timezone,
      define: config.define,
      logging: false,
    });
  }

  static getInstance() {
    if (!Database.#instancia) {
      Database.#instancia = new Database();
    }
    return Database.#instancia.sequelize;
  }

  static async probarConexion() {
    await Database.getInstance().authenticate();
  }

  static async cerrar() {
    if (Database.#instancia) {
      await Database.#instancia.sequelize.close();
      Database.#instancia = null;
    }
  }
}

module.exports = Database;