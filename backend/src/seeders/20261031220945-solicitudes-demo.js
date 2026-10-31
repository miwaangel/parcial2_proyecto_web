'use strict';

const NOMBRES = ['Juan', 'María', 'Luis', 'Ana', 'Carlos', 'Sofía', 'Diego', 'Valeria', 'Jorge', 'Fernanda'];
const APELLIDOS = ['Pérez', 'García', 'López', 'Martínez', 'Hernández', 'Rodríguez', 'Sánchez', 'Ramírez', 'Torres', 'Flores'];
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CANTIDAD = 60;

const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];
const letra = () => azar(LETRAS.split(''));
const digitos = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');

// CURP con formato válido (no real): 4 letras + 6 dígitos + H/M + 5 letras + 1 alfanumérico + 1 dígito
const curpFalsa = () =>
  letra() + letra() + letra() + letra() + digitos(6) + azar(['H', 'M']) +
  letra() + letra() + letra() + letra() + letra() + letra() + digitos(1);

module.exports = {
  async up(queryInterface) {
    const [municipios] = await queryInterface.sequelize.query('SELECT id FROM municipios');
    const [niveles] = await queryInterface.sequelize.query('SELECT id FROM niveles_educativos');
    const [asuntos] = await queryInterface.sequelize.query('SELECT id FROM asuntos');

    // Solo algunos municipios, para que el filtro del dashboard muestre diferencias
    const municipiosDemo = municipios.slice(0, 8);
    const turnos = {}; // municipioId -> último turno
    const ahora = new Date();
    const filas = [];

    for (let i = 0; i < CANTIDAD; i++) {
      const municipioId = azar(municipiosDemo).id;
      turnos[municipioId] = (turnos[municipioId] || 0) + 1;
      const nombre = azar(NOMBRES);
      const paterno = azar(APELLIDOS);
      const materno = azar(APELLIDOS);

      filas.push({
        curp: curpFalsa(),
        nombreCompleto: `${azar(NOMBRES)} ${azar(APELLIDOS)} ${azar(APELLIDOS)}`,
        nombre,
        paterno,
        materno,
        telefono: `844${digitos(7)}`,
        celular: `844${digitos(7)}`,
        correo: `${nombre}.${paterno}${i}@correo.com`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
        nivelId: azar(niveles).id,
        municipioId,
        asuntoId: azar(asuntos).id,
        turno: turnos[municipioId],
        estatus: Math.random() < 0.4 ? 'Resuelto' : 'Pendiente',
        createdAt: ahora,
        updatedAt: ahora,
      });
    }

    await queryInterface.bulkInsert('solicitudes', filas);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('solicitudes', null, {});
  },
};