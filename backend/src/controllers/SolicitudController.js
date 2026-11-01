const BaseController = require('./BaseController');
const SolicitudService = require('../services/SolicitudService');

/**
 * Solicitudes de turno.
 *  Publico (#13):  crear, buscar con CURP + turno, modificar.
 *  Admin (#14):    listar/buscar, ver, crear, editar, eliminar, cambiar estatus.
 */
class SolicitudController extends BaseController {
  constructor(solicitudService = new SolicitudService()) {
    super();
    this.solicitudService = solicitudService;
  }

  // ---------------------------------------------------------------- publico

  /** POST /api/solicitudes -> 201 Solicitud (con turno asignado) */
  async crear(req, res) {
    return this.created(res, await this.solicitudService.crear(req.body));
  }

  /** GET /api/solicitudes/buscar?curp=X&turno=N&municipioId=M */
  async buscar(req, res) {
    return this.ok(res, await this.solicitudService.buscarPublica(req.query));
  }

  /** PUT /api/solicitudes/:id  { ...cambios, curp, turno } */
  async actualizarPublica(req, res) {
    return this.ok(res, await this.solicitudService.actualizarPublica(req.params.id, req.body));
  }

  // ---------------------------------------------------------------- admin

  /** GET /api/admin/solicitudes?q=&municipioId=&estatus= */
  async listar(req, res) {
    return this.ok(res, await this.solicitudService.listarAdmin(req.query));
  }

  /** GET /api/admin/solicitudes/:id */
  async obtener(req, res) {
    return this.ok(res, await this.solicitudService.obtener(req.params.id));
  }

  /** PUT /api/admin/solicitudes/:id */
  async actualizar(req, res) {
    return this.ok(res, await this.solicitudService.actualizarAdmin(req.params.id, req.body));
  }

  /** PATCH /api/admin/solicitudes/:id/estatus  { estatus } */
  async cambiarEstatus(req, res) {
    return this.ok(res, await this.solicitudService.cambiarEstatus(req.params.id, req.body?.estatus));
  }

  /** DELETE /api/admin/solicitudes/:id -> 204 */
  async eliminar(req, res) {
    await this.solicitudService.eliminar(req.params.id);
    return this.noContent(res);
  }
}

module.exports = SolicitudController;
