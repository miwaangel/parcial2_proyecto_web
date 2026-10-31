'use strict';

const bcrypt = require('bcryptjs');

const USUARIO = process.env.SEED_ADMIN_USER || 'admin';
const PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

module.exports = {
  async up(queryInterface) {
    const ahora = new Date();
    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    await queryInterface.bulkInsert('usuarios', [
      { usuario: USUARIO, passwordHash, nombre: 'Administrador', activo: true, createdAt: ahora, updatedAt: ahora },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('usuarios', { usuario: USUARIO });
  },
};