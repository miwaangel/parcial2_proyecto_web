const express = require('express');
const cors = require('cors');

const Config = require('./Config');
const ApiRouter = require('../routes');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

/**
 * Clase principal del servidor (MVC).
 * Configura middlewares globales, monta las rutas bajo /api y registra el manejo de errores.
 * server.js solo crea la instancia y llama a listen().
 */
class App {
  constructor() {
    this.app = express();
    this.configurarMiddlewares();
    this.configurarRutas();
    this.configurarErrores();
  }

  configurarMiddlewares() {
    this.app.use(cors({ origin: Config.corsOrigin }));
    this.app.use(express.json());
  }

  configurarRutas() {
    this.app.use('/api', new ApiRouter().router);
  }

  // Siempre al final: primero 404 de rutas inexistentes, luego el manejador global.
  configurarErrores() {
    this.app.use(ErrorMiddleware.notFound);
    this.app.use(ErrorMiddleware.handle);
  }

  listen(port = Config.port) {
    return this.app.listen(port, () => {
      if (!Config.isTest) {
        console.log(`API escuchando en http://localhost:${port}/api`);
      }
    });
  }
}

module.exports = App;
