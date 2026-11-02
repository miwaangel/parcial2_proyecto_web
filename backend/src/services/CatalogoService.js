const HttpError = require('../app/HttpError');
const { Municipio, NivelEducativo, Asunto, Solicitud } = require('../models');

/**
 * CRUD de los tres catalogos (issue #12): municipios, niveles y asuntos.
 * Los tres tienen la misma forma { id, nombre, activo }, asi que una sola clase
 * los atiende segun el `tipo` de la URL.
 */
class CatalogoService {
  /** tipo de la URL -> modelo, columna en solicitudes y largo maximo del nombre */
  static TIPOS = {
    municipios: { modelo: Municipio, llave: 'municipioId', maximo: 100 },
    niveles: { modelo: NivelEducativo, llave: 'nivelId', maximo: 100 },
    asuntos: { modelo: Asunto, llave: 'asuntoId', maximo: 150 },
  };

  static ATRIBUTOS = ['id', 'nombre', 'activo'];

  /** @throws {HttpError} 404 si el tipo no existe */
  tipo(tipo) {
    const definicion = CatalogoService.TIPOS[tipo];
    if (!definicion) {
      throw HttpError.notFound(`Catalogo no encontrado: ${tipo}. Usa municipios, niveles o asuntos`);
    }
    return definicion;
  }

  /** GET publico: solo activos. GET admin: todos. Ordenados por nombre. */
  async listar(tipo, { soloActivos = false } = {}) {
    const { modelo } = this.tipo(tipo);
    return modelo.findAll({
      attributes: CatalogoService.ATRIBUTOS,
      where: soloActivos ? { activo: true } : undefined,
      order: [['nombre', 'ASC']],
    });
  }

  async crear(tipo, datos = {}) {
    const { modelo, maximo } = this.tipo(tipo);
    const nombre = this.validarNombre(datos.nombre, maximo);
    const creado = await modelo.create({ nombre, activo: true });
    return this.formatear(creado);
  }

  /** Cambia nombre y/o activo (desactivar = lo oculta del formulario publico sin borrarlo). */
  async actualizar(tipo, id, datos = {}) {
    const { modelo, maximo } = this.tipo(tipo);
    const registro = await this.buscar(modelo, id);

    const cambios = {};
    if (datos.nombre !== undefined) cambios.nombre = this.validarNombre(datos.nombre, maximo);
    if (datos.activo !== undefined) {
      if (typeof datos.activo !== 'boolean') throw HttpError.badRequest('activo debe ser true o false');
      cambios.activo = datos.activo;
    }
    if (Object.keys(cambios).length === 0) {
      throw HttpError.badRequest('Manda nombre y/o activo para actualizar');
    }

    await registro.update(cambios);
    return this.formatear(registro);
  }

  /** No deja borrar un catalogo usado por alguna solicitud: se sugiere desactivarlo. */
  async eliminar(tipo, id) {
    const { modelo, llave } = this.tipo(tipo);
    const registro = await this.buscar(modelo, id);

    const enUso = await Solicitud.count({ where: { [llave]: registro.id } });
    if (enUso > 0) {
      throw HttpError.conflict(
        `No se puede eliminar "${registro.nombre}": tiene ${enUso} solicitud(es). Puedes desactivarlo.`,
      );
    }
    await registro.destroy();
  }

  // ------------------------------------------------------------ utilidades

  async buscar(modelo, id) {
    const numero = Number(id);
    if (!Number.isInteger(numero) || numero <= 0) {
      throw HttpError.badRequest('El id no es valido');
    }
    const registro = await modelo.findByPk(numero);
    if (!registro) throw HttpError.notFound('No existe el registro');
    return registro;
  }

  validarNombre(nombre, maximo) {
    const limpio = typeof nombre === 'string' ? nombre.trim().replace(/\s+/g, ' ') : '';
    if (!limpio) throw HttpError.badRequest('El nombre es obligatorio');
    if (limpio.length > maximo) throw HttpError.badRequest(`El nombre admite maximo ${maximo} caracteres`);
    return limpio;
  }

  formatear({ id, nombre, activo }) {
    return { id, nombre, activo };
  }
}

module.exports = CatalogoService;
