'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const fk = (tabla) => ({
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: tabla, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT', // no deja borrar un catálogo que ya tiene solicitudes
    });

    await queryInterface.createTable('solicitudes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      curp: { type: Sequelize.CHAR(18), allowNull: false },
      nombreCompleto: { type: Sequelize.STRING(150), allowNull: false },
      nombre: { type: Sequelize.STRING(80), allowNull: false },
      paterno: { type: Sequelize.STRING(80), allowNull: false },
      materno: { type: Sequelize.STRING(80), allowNull: true },
      telefono: { type: Sequelize.STRING(15), allowNull: true },
      celular: { type: Sequelize.STRING(15), allowNull: false },
      correo: { type: Sequelize.STRING(120), allowNull: false },
      nivelId: fk('niveles_educativos'),
      municipioId: fk('municipios'),
      asuntoId: fk('asuntos'),
      turno: { type: Sequelize.INTEGER, allowNull: false },
      estatus: {
        type: Sequelize.ENUM('Pendiente', 'Resuelto'),
        allowNull: false,
        defaultValue: 'Pendiente',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('solicitudes', ['municipioId', 'turno'], {
      unique: true,
      name: 'uq_solicitudes_municipio_turno',
    });
    await queryInterface.addIndex('solicitudes', ['curp'], { name: 'idx_solicitudes_curp' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('solicitudes');
  },
};