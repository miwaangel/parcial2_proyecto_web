'use strict';

const NIVELES = ['Preescolar', 'Primaria', 'Secundaria', 'Bachillerato'];

module.exports = {
  async up(queryInterface) {
    const ahora = new Date();
    await queryInterface.bulkInsert(
      'niveles_educativos',
      NIVELES.map((nombre) => ({ nombre, activo: true, createdAt: ahora, updatedAt: ahora }))
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('niveles_educativos', { nombre: NIVELES });
  },
};