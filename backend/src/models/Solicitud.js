const { Model, DataTypes } = require('sequelize');

const REGEX_CURP = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;

class Solicitud extends Model {
  static ESTATUS = Object.freeze({ PENDIENTE: 'Pendiente', RESUELTO: 'Resuelto' });

  static initModel(sequelize) {
    Solicitud.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        curp: {
          type: DataTypes.CHAR(18),
          allowNull: false,
          set(valor) {
            this.setDataValue('curp', String(valor || '').trim().toUpperCase());
          },
          validate: { is: { args: REGEX_CURP, msg: 'CURP con formato inválido' } },
        },
        nombreCompleto: { type: DataTypes.STRING(150), allowNull: false, validate: { notEmpty: true } },
        nombre: { type: DataTypes.STRING(80), allowNull: false, validate: { notEmpty: true } },
        paterno: { type: DataTypes.STRING(80), allowNull: false, validate: { notEmpty: true } },
        materno: { type: DataTypes.STRING(80), allowNull: true },
        telefono: { type: DataTypes.STRING(15), allowNull: true },
        celular: { type: DataTypes.STRING(15), allowNull: false, validate: { notEmpty: true } },
        correo: {
          type: DataTypes.STRING(120),
          allowNull: false,
          validate: { isEmail: { msg: 'Correo inválido' } },
        },
        nivelId: { type: DataTypes.INTEGER, allowNull: false },
        municipioId: { type: DataTypes.INTEGER, allowNull: false },
        asuntoId: { type: DataTypes.INTEGER, allowNull: false },
        turno: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
        estatus: {
          type: DataTypes.ENUM(Solicitud.ESTATUS.PENDIENTE, Solicitud.ESTATUS.RESUELTO),
          allowNull: false,
          defaultValue: Solicitud.ESTATUS.PENDIENTE,
        },
      },
      {
        sequelize,
        modelName: 'Solicitud',
        tableName: 'solicitudes',
        timestamps: true,
        indexes: [
          { unique: true, fields: ['municipioId', 'turno'], name: 'uq_solicitudes_municipio_turno' },
          { fields: ['curp'], name: 'idx_solicitudes_curp' },
        ],
      }
    );
    return Solicitud;
  }

  static associate(modelos) {
    Solicitud.belongsTo(modelos.Municipio, { foreignKey: 'municipioId', as: 'municipio' });
    Solicitud.belongsTo(modelos.NivelEducativo, { foreignKey: 'nivelId', as: 'nivel' });
    Solicitud.belongsTo(modelos.Asunto, { foreignKey: 'asuntoId', as: 'asunto' });
  }
}

module.exports = Solicitud;