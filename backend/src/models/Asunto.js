const { Model, DataTypes } = require('sequelize');

class Asunto extends Model {
  static initModel(sequelize) {
    Asunto.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: {
          type: DataTypes.STRING(150),
          allowNull: false,
          unique: true,
          validate: { notEmpty: { msg: 'El nombre es obligatorio' } },
        },
        activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      },
      { sequelize, modelName: 'Asunto', tableName: 'asuntos', timestamps: true }
    );
    return Asunto;
  }

  static associate(modelos) {
    Asunto.hasMany(modelos.Solicitud, { foreignKey: 'asuntoId', as: 'solicitudes' });
  }
}

module.exports = Asunto;