'use strict';

const ASUNTOS = [
  'Inscripción',
  'Reinscripción',
  'Cambio de escuela',
  'Baja',
  'Constancia de estudios',
  'Revalidación de estudios',
];

module.exports = {
  async up(queryInterface) {
    const ahora = new Date();
    await queryInterface.bulkInsert(
      'asuntos',
      ASUNTOS.map((nombre) => ({ nombre, activo: true, createdAt: ahora, updatedAt: ahora }))
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('asuntos', { nombre: ASUNTOS });
  },
};