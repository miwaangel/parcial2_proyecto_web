export const municipios = [
  { id: 1, nombre: 'Saltillo', activo: true },
  { id: 2, nombre: 'Torreón', activo: true },
  { id: 3, nombre: 'Monclova', activo: true },
]

export const niveles = [
  { id: 1, nombre: 'Primaria', activo: true },
  { id: 2, nombre: 'Secundaria', activo: true },
  { id: 3, nombre: 'Bachillerato', activo: true },
]

export const asuntos = [
  { id: 1, nombre: 'Inscripción', activo: true },
  { id: 2, nombre: 'Cambio de escuela', activo: true },
  { id: 3, nombre: 'Constancia de estudios', activo: true },
]

export const solicitudes = [
  {
    id: 1, curp: 'PEGJ050312HCLRRN09', nombreCompleto: 'María Pérez López',
    nombre: 'Juan', paterno: 'Pérez', materno: 'López', telefono: '8441234567',
    celular: '8449876543', correo: 'maria@correo.com', turno: 7, estatus: 'Pendiente',
    municipio: municipios[0], nivel: niveles[1], asunto: asuntos[0],
  },
  {
    id: 2, curp: 'GARA060815MCLMZN08', nombreCompleto: 'Gabriela Ramírez',
    nombre: 'Ana', paterno: 'Ramírez', materno: 'García', telefono: '8711234567',
    celular: '8719876543', correo: 'gabriela@correo.com', turno: 12, estatus: 'Resuelto',
    municipio: municipios[1], nivel: niveles[0], asunto: asuntos[2],
  },
  {
    id: 3, curp: 'LOSA100201HCLNMR07', nombreCompleto: 'Luis Sánchez',
    nombre: 'Luis', paterno: 'Sánchez', materno: '', telefono: '',
    celular: '8665551212', correo: 'luis@correo.com', turno: 3, estatus: 'Pendiente',
    municipio: municipios[2], nivel: niveles[2], asunto: asuntos[1],
  },
]
