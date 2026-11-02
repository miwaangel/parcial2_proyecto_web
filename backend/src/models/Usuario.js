const { Model, DataTypes } = require('sequelize');

class Usuario extends Model {
  static initModel(sequelize) {
    Usuario.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        usuario: { type: DataTypes.STRING(50), allowNull: false, unique: true, validate: { notEmpty: true } },
        passwordHash: { type: DataTypes.STRING(255), allowNull: false },
        nombre: { type: DataTypes.STRING(100), allowNull: false, validate: { notEmpty: true } },
        activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      },
      {
        sequelize,
        modelName: 'Usuario',
        tableName: 'usuarios',
        timestamps: true,
        // Por defecto nunca se lee el passwordHash
        defaultScope: { attributes: { exclude: ['passwordHash'] } },
        // Para el login: Usuario.scope('conPassword').findOne(...)
        scopes: { conPassword: { attributes: { include: ['passwordHash'] } } },
      }
    );
    return Usuario;
  }

  // Aunque se haya leído, nunca sale en una respuesta JSON
  toJSON() {
    const datos = { ...this.get() };
    delete datos.passwordHash;
    return datos;
  }
}

module.exports = Usuario;