/**
 * Solicitud de ejemplo, igual a la del contrato (docs/contrato-api.md, seccion 2).
 * Se usa mientras no exista el modelo Solicitud (issue #6).
 */
module.exports = {
  id: 15,
  curp: 'PEGJ050312HCLRRN09',
  nombreCompleto: 'María Pérez López',
  nombre: 'Juan',
  paterno: 'Pérez',
  materno: 'García',
  telefono: '8441234567',
  celular: '8449876543',
  correo: 'maria@correo.com',
  turno: 7,
  estatus: 'Pendiente',
  municipio: { id: 30, nombre: 'Saltillo' },
  nivel: { id: 2, nombre: 'Secundaria' },
  asunto: { id: 1, nombre: 'Inscripción' },
  createdAt: '2026-10-28T18:00:00.000Z',
  updatedAt: '2026-10-28T18:00:00.000Z',
};
