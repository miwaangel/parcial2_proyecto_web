const Database = require('../config/Database');

const Municipio = require('./Municipio');
const NivelEducativo = require('./NivelEducativo');
const Asunto = require('./Asunto');
const Solicitud = require('./Solicitud');
const Usuario = require('./Usuario');

const sequelize = Database.getInstance();
const modelos = { Municipio, NivelEducativo, Asunto, Solicitud, Usuario };

Object.values(modelos).forEach((modelo) => modelo.initModel(sequelize));
Object.values(modelos).forEach((modelo) => {
  if (typeof modelo.associate === 'function') modelo.associate(modelos);
});

module.exports = { ...modelos, sequelize };