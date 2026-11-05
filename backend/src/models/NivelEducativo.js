const { Model, DataTypes } = require('sequelize');

class NivelEducativo extends Model {
  static initModel(sequelize) {
    NivelEducativo.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
          validate: { notEmpty: { msg: 'El nombre es obligatorio' } },
        },
        activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      },
      { sequelize, modelName: 'NivelEducativo', tableName: 'niveles_educativos', timestamps: true }
    );
    return NivelEducativo;
  }

  static associate(modelos) {
    NivelEducativo.hasMany(modelos.Solicitud, { foreignKey: 'nivelId', as: 'solicitudes' });
  }
}

module.exports = NivelEducativo;