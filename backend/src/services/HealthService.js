/**
 * Estado del servidor.
 * Cuando exista la conexion a BD (Database.getInstance(), issue #5) se puede
 * agregar aqui una verificacion con sequelize.authenticate().
 */
class HealthService {
  obtenerEstado() {
    return { status: 'ok' };
  }
}

module.exports = HealthService;
