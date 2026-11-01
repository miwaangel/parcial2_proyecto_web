const express = require('express');
const cors = require('cors');

const Config = require('./Config');
const SwaggerConfig = require('./SwaggerConfig');
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
    SwaggerConfig.montar(this.app);
    this.app.use('/api', new ApiRouter().router);
  }

  // Siempre al final: primero 404 de rutas inexistentes, luego el manejador global.
  configurarErrores() {
    this.app.use(ErrorMiddleware.notFound);
    this.app.use(ErrorMiddleware.handle);
  }

  listen(port = Config.port) {
    // Express 5 pasa al callback el error de arranque (ej. puerto ocupado)
    return this.app.listen(port, (err) => {
      if (err) {
        const motivo = err.code === 'EADDRINUSE'
          ? `el puerto ${port} ya esta ocupado por otro programa. Cambia PORT en el .env o cierra ese programa.`
          : err.message;
        console.error(`No se pudo iniciar la API: ${motivo}`);
        process.exitCode = 1;
        return;
      }
      if (!Config.isTest) {
        console.log(`API escuchando en http://localhost:${port}/api`);
      }
    });
  }
}

module.exports = App;
