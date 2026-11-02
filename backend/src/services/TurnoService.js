const { Solicitud, Municipio, sequelize } = require('../models');

/**
 * Asigna turnos consecutivos por municipio (1..n).
 * Bloquea la fila del municipio durante la transacción para que dos
 * solicitudes simultáneas del mismo municipio no reciban el mismo turno.
 */
class TurnoService {
  /**
   * Calcula el siguiente turno de un municipio.
   * Debe llamarse DENTRO de una transacción.
   */
  static async asignarTurno(municipioId, transaction) {
    if (!transaction) {
      throw new Error('TurnoService.asignarTurno requiere una transacción');
    }

    // SELECT ... FOR UPDATE: quien llegue después espera aquí
    const municipio = await Municipio.findByPk(municipioId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!municipio || !municipio.activo) {
      const error = new Error('El municipio no existe o no está activo');
      error.status = 400;
      throw error;
    }

    const ultimoTurno = await Solicitud.max('turno', {
      where: { municipioId },
      transaction,
    });

    return (ultimoTurno || 0) + 1;
  }

  /**
   * Crea una solicitud con su turno asignado, todo en una sola transacción.
   * Ignora id, turno y estatus que vengan del cliente.
   */
  static async crearSolicitud(datos) {
    return sequelize.transaction(async (transaction) => {
      const { id, turno, estatus, ...campos } = datos;
      const nuevoTurno = await TurnoService.asignarTurno(campos.municipioId, transaction);
      return Solicitud.create({ ...campos, turno: nuevoTurno }, { transaction });
    });
  }
}

module.exports = TurnoService;