const { Model, DataTypes } = require('sequelize');

class Municipio extends Model {
  static initModel(sequelize) {
    Municipio.init(
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
      { sequelize, modelName: 'Municipio', tableName: 'municipios', timestamps: true }
    );
    return Municipio;
  }

  static associate(modelos) {
    Municipio.hasMany(modelos.Solicitud, { foreignKey: 'municipioId', as: 'solicitudes' });
  }
}

module.exports = Municipio;