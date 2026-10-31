/**
 * Clase base de todos los controladores.
 *
 * - Enlaza (bind) automaticamente los metodos de la subclase, para poder pasarlos
 *   directo a las rutas: router.get('/', controller.listar)
 * - Da helpers para responder siempre igual.
 *
 * Los errores no se atrapan aqui: se lanzan (throw HttpError...) y los recibe ErrorMiddleware.
 */
class BaseController {
  constructor() {
    let proto = Object.getPrototypeOf(this);
    while (proto && proto !== BaseController.prototype) {
      for (const nombre of Object.getOwnPropertyNames(proto)) {
        if (nombre !== 'constructor' && typeof this[nombre] === 'function') {
          this[nombre] = this[nombre].bind(this);
        }
      }
      proto = Object.getPrototypeOf(proto);
    }
  }

  ok(res, data) {
    return res.status(200).json(data);
  }

  created(res, data) {
    return res.status(201).json(data);
  }

  noContent(res) {
    return res.status(204).end();
  }
}

module.exports = BaseController;
