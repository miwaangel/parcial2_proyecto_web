const BaseController = require('./BaseController');
const CatalogoService = require('../services/CatalogoService');

/**
 * Catalogos: municipios, niveles y asuntos (issue #12).
 * `:tipo` en la URL elige el catalogo.
 */
class CatalogoController extends BaseController {
  constructor(catalogoService = new CatalogoService()) {
    super();
    this.catalogoService = catalogoService;
  }

  /** GET /api/catalogos/:tipo -> solo activos (para los selects del formulario publico) */
  async listarActivos(req, res) {
    return this.ok(res, await this.catalogoService.listar(req.params.tipo, { soloActivos: true }));
  }

  /** GET /api/admin/catalogos/:tipo -> todos, incluye inactivos */
  async listarTodos(req, res) {
    return this.ok(res, await this.catalogoService.listar(req.params.tipo));
  }

  /** POST /api/admin/catalogos/:tipo  { nombre } -> 201 */
  async crear(req, res) {
    return this.created(res, await this.catalogoService.crear(req.params.tipo, req.body));
  }

  /** PUT /api/admin/catalogos/:tipo/:id  { nombre, activo } */
  async actualizar(req, res) {
    return this.ok(res, await this.catalogoService.actualizar(req.params.tipo, req.params.id, req.body));
  }

  /** DELETE /api/admin/catalogos/:tipo/:id -> 204 (409 si tiene solicitudes) */
  async eliminar(req, res) {
    await this.catalogoService.eliminar(req.params.tipo, req.params.id);
    return this.noContent(res);
  }
}

module.exports = CatalogoController;
