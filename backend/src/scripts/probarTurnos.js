const Database = require('../config/Database');
const { Solicitud, Municipio, NivelEducativo, Asunto } = require('../models');
const TurnoService = require('../services/TurnoService');

(async () => {
  const creadas = [];
  try {
    // Los dos últimos municipios: el seeder demo no les puso solicitudes
    const [m1, m2] = await Municipio.findAll({ order: [['id', 'DESC']], limit: 2 });
    const nivel = await NivelEducativo.findOne();
    const asunto = await Asunto.findOne();

    const base = {
      curp: 'PEGJ050312HCLRRN09',
      nombreCompleto: 'Prueba de Turnos',
      nombre: 'Prueba',
      paterno: 'Turno',
      celular: '8440000000',
      correo: 'prueba@correo.com',
      nivelId: nivel.id,
      asuntoId: asunto.id,
    };

    // 5 al mismo tiempo en el mismo municipio
    const simultaneas = await Promise.all(
      Array.from({ length: 5 }, () => TurnoService.crearSolicitud({ ...base, municipioId: m1.id }))
    );
    creadas.push(...simultaneas);

    // 1 en otro municipio
    const otra = await TurnoService.crearSolicitud({ ...base, municipioId: m2.id });
    creadas.push(otra);

    const turnos = simultaneas.map((s) => s.turno).sort((a, b) => a - b);
    console.log(`${m1.nombre}: turnos`, turnos);
    console.log(`${m2.nombre}: turno`, otra.turno);

    const ok = turnos.join(',') === '1,2,3,4,5' && otra.turno === 1;
    console.log(ok ? 'PRUEBA OK: turnos únicos y consecutivos por municipio' : 'PRUEBA FALLÓ');
    if (!ok) process.exitCode = 1;
  } catch (error) {
    console.error('Error:', error.message);
    process.exitCode = 1;
  } finally {
    if (creadas.length) {
      await Solicitud.destroy({ where: { id: creadas.map((s) => s.id) } });
    }
    await Database.cerrar();
  }
})();