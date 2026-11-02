const { Op } = require('sequelize');

const HttpError = require('../app/HttpError');
const SolicitudValidator = require('./SolicitudValidator');
const TurnoService = require('./TurnoService');
const {
  Solicitud, Municipio, NivelEducativo, Asunto, sequelize,
} = require('../models');

/**
 * Logica de las solicitudes de turno.
 *  - Publica (issue #13): registrar, buscar con CURP + turno, modificar.
 *  - Administracion (issue #14): busqueda por CURP/nombre, CRUD y cambio de estatus.
 *
 * El turno lo asigna SIEMPRE el servidor con TurnoService (Angel): el cliente no puede mandarlo.
 */
class SolicitudService {
  /** Relaciones con los alias del contrato. */
  static INCLUDE = [
    { association: 'municipio', attributes: ['id', 'nombre'] },
    { association: 'nivel', attributes: ['id', 'nombre'] },
    { association: 'asunto', attributes: ['id', 'nombre'] },
  ];

  /** Lo que el ciudadano puede cambiar en su solicitud (no CURP, municipio, turno ni estatus). */
  static EDITABLES_PUBLICO = [
    'nombreCompleto', 'nombre', 'paterno', 'materno', 'telefono', 'celular', 'correo', 'nivelId', 'asuntoId',
  ];

  static TODOS = Object.keys(SolicitudValidator.CAMPOS);

  static LIMITE_BUSQUEDA = 500;

  constructor(validator = new SolicitudValidator()) {
    this.validator = validator;
  }

  // ================================================================ publico (#13)

  /** POST /api/solicitudes (y POST /api/admin/solicitudes) */
  async crear(datos) {
    const limpio = this.validator.validar(datos, { permitidos: SolicitudService.TODOS });
    await this.verificarCatalogos(limpio);
    const creada = await TurnoService.crearSolicitud(limpio);
    return this.obtener(creada.id);
  }

  /** GET /api/solicitudes/buscar?curp=X&turno=N&municipioId=M */
  async buscarPublica({ curp, turno, municipioId } = {}) {
    const where = {
      curp: this.validator.validarCurp(curp),
      turno: this.validator.validarTurno(turno),
    };
    if (municipioId !== undefined && municipioId !== '') {
      where.municipioId = this.validator.validarId(municipioId, 'El municipio');
    }

    const encontradas = await Solicitud.findAll({ where, include: SolicitudService.INCLUDE, limit: 2 });
    if (encontradas.length === 0) {
      throw HttpError.notFound('No existe una solicitud con esa CURP y turno');
    }
    if (encontradas.length > 1) {
      throw HttpError.badRequest('Hay mas de una solicitud con esa CURP y turno: indica el municipio');
    }
    return this.formatear(encontradas[0]);
  }

  /**
   * PUT /api/solicitudes/:id
   * El body trae la CURP y el turno actuales para comprobar que es su solicitud.
   */
  async actualizarPublica(id, datos = {}) {
    const solicitud = await Solicitud.findByPk(this.validator.validarId(id));
    const curp = String(datos.curp || '').trim().toUpperCase();
    const turno = Number(datos.turno);

    // Mismo 404 si no existe o si no coincide: no revela que el id existe
    if (!solicitud || solicitud.curp !== curp || solicitud.turno !== turno) {
      throw HttpError.notFound('No existe una solicitud con esa CURP y turno');
    }
    if (solicitud.estatus === 'Resuelto') {
      throw HttpError.conflict('La solicitud ya fue resuelta y no se puede modificar');
    }

    const cambios = this.validator.validar(datos, {
      permitidos: SolicitudService.EDITABLES_PUBLICO, parcial: true,
    });
    await this.verificarCatalogos(cambios);
    await solicitud.update(cambios);
    return this.obtener(solicitud.id);
  }

  // ================================================================ admin (#14)

  /**
   * GET /api/admin/solicitudes?q=texto&municipioId=M&estatus=Pendiente
   * q busca en CURP, nombre, apellidos y nombre de quien tramita.
   * Varias palabras se combinan: "juan perez" encuentra a Juan Perez.
   */
  async listarAdmin({ q, municipioId, estatus } = {}) {
    const where = {};
    const palabras = String(q || '').trim().split(/\s+/).filter(Boolean).slice(0, 5);
    if (palabras.length) {
      where[Op.and] = palabras.map((palabra) => ({
        [Op.or]: ['curp', 'nombre', 'paterno', 'materno', 'nombreCompleto']
          .map((campo) => ({ [campo]: { [Op.like]: `%${palabra}%` } })),
      }));
    }
    if (municipioId !== undefined && municipioId !== '') {
      where.municipioId = this.validator.validarId(municipioId, 'El municipio');
    }
    if (estatus !== undefined && estatus !== '') {
      where.estatus = this.validator.validarEstatus(estatus);
    }

    const solicitudes = await Solicitud.findAll({
      where,
      include: SolicitudService.INCLUDE,
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
      limit: SolicitudService.LIMITE_BUSQUEDA,
    });
    return solicitudes.map((s) => this.formatear(s));
  }

  /** GET /api/admin/solicitudes/:id */
  async obtener(id) {
    const solicitud = await Solicitud.findByPk(this.validator.validarId(id), {
      include: SolicitudService.INCLUDE,
    });
    if (!solicitud) throw HttpError.notFound('No existe la solicitud');
    return this.formatear(solicitud);
  }

  /**
   * PUT /api/admin/solicitudes/:id
   * El admin puede corregir cualquier dato. Si cambia el municipio, se le asigna
   * el siguiente turno de ese municipio (dentro de una transaccion).
   */
  async actualizarAdmin(id, datos = {}) {
    const solicitud = await Solicitud.findByPk(this.validator.validarId(id));
    if (!solicitud) throw HttpError.notFound('No existe la solicitud');

    const { estatus, ...resto } = datos || {};
    const traeCampos = SolicitudService.TODOS.some((campo) => campo in resto);
    const cambios = traeCampos
      ? this.validator.validar(resto, { permitidos: SolicitudService.TODOS, parcial: true })
      : {};
    if (estatus !== undefined) cambios.estatus = this.validator.validarEstatus(estatus);
    if (Object.keys(cambios).length === 0) {
      throw HttpError.badRequest('No se mando ningun campo para actualizar');
    }

    await this.verificarCatalogos(cambios);

    const cambiaMunicipio = cambios.municipioId !== undefined && cambios.municipioId !== solicitud.municipioId;
    if (cambiaMunicipio) {
      await sequelize.transaction(async (transaction) => {
        cambios.turno = await TurnoService.asignarTurno(cambios.municipioId, transaction);
        await solicitud.update(cambios, { transaction });
      });
    } else {
      await solicitud.update(cambios);
    }
    return this.obtener(solicitud.id);
  }

  /** PATCH /api/admin/solicitudes/:id/estatus  { estatus } */
  async cambiarEstatus(id, estatus) {
    const solicitud = await Solicitud.findByPk(this.validator.validarId(id));
    if (!solicitud) throw HttpError.notFound('No existe la solicitud');
    await solicitud.update({ estatus: this.validator.validarEstatus(estatus) });
    return this.obtener(solicitud.id);
  }

  /** DELETE /api/admin/solicitudes/:id */
  async eliminar(id) {
    const solicitud = await Solicitud.findByPk(this.validator.validarId(id));
    if (!solicitud) throw HttpError.notFound('No existe la solicitud');
    await solicitud.destroy();
  }

  // ================================================================ utilidades

  /** Nivel, asunto y municipio deben existir y estar activos (los inactivos no se ofrecen). */
  async verificarCatalogos({ nivelId, asuntoId, municipioId }) {
    const revisar = async (modelo, id, etiqueta) => {
      if (id === undefined) return;
      const registro = await modelo.findByPk(id, { attributes: ['id', 'activo'] });
      if (!registro || !registro.activo) {
        throw HttpError.badRequest(`${etiqueta} seleccionado no existe o no esta activo`);
      }
    };
    await revisar(NivelEducativo, nivelId, 'El nivel');
    await revisar(Asunto, asuntoId, 'El asunto');
    await revisar(Municipio, municipioId, 'El municipio');
  }

  /** Forma exacta del contrato (seccion 2 de docs/contrato-api.md). */
  formatear(solicitud) {
    const s = typeof solicitud.get === 'function' ? solicitud.get({ plain: true }) : solicitud;
    const catalogo = (c) => (c ? { id: c.id, nombre: c.nombre } : null);
    return {
      id: s.id,
      curp: s.curp,
      nombreCompleto: s.nombreCompleto,
      nombre: s.nombre,
      paterno: s.paterno,
      materno: s.materno,
      telefono: s.telefono,
      celular: s.celular,
      correo: s.correo,
      turno: s.turno,
      estatus: s.estatus,
      municipio: catalogo(s.municipio),
      nivel: catalogo(s.nivel),
      asunto: catalogo(s.asunto),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }
}

module.exports = SolicitudService;
