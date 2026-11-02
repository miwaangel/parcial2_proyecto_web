'use strict';

const MUNICIPIOS = [
  'Abasolo', 'Acuña', 'Allende', 'Arteaga', 'Candela', 'Castaños',
  'Cuatro Ciénegas', 'Escobedo', 'Francisco I. Madero', 'Frontera',
  'General Cepeda', 'Guerrero', 'Hidalgo', 'Jiménez', 'Juárez', 'Lamadrid',
  'Matamoros', 'Monclova', 'Morelos', 'Múzquiz', 'Nadadores', 'Nava',
  'Ocampo', 'Parras', 'Piedras Negras', 'Progreso', 'Ramos Arizpe', 'Sabinas',
  'Sacramento', 'Saltillo', 'San Buenaventura', 'San Juan de Sabinas',
  'San Pedro', 'Sierra Mojada', 'Torreón', 'Viesca', 'Villa Unión', 'Zaragoza',
];

module.exports = {
  async up(queryInterface) {
    const ahora = new Date();
    await queryInterface.bulkInsert(
      'municipios',
      MUNICIPIOS.map((nombre) => ({ nombre, activo: true, createdAt: ahora, updatedAt: ahora }))
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('municipios', { nombre: MUNICIPIOS });
  },
};