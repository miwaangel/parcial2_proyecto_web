import { request, USE_MOCKS } from './api'
import { municipios, solicitudes } from '../mocks/data'

let mockSolicitudes = [...solicitudes]

const normalizar = (data) => ({
  ...data,
  curp: data.curp?.toUpperCase(),
  municipio: data.municipio || municipios.find((item) => item.id === Number(data.municipioId)),
})

export async function crearSolicitud(data, admin = false) {
  if (!USE_MOCKS) return request({ method: 'post', url: `${admin ? '/admin' : ''}/solicitudes`, data })
  const municipio = municipios.find((item) => item.id === Number(data.municipioId))
  const nextTurn = Math.max(0, ...mockSolicitudes.filter((item) => item.municipio?.id === municipio.id).map((item) => item.turno)) + 1
  const item = normalizar({ ...data, id: Date.now(), turno: nextTurn, estatus: 'Pendiente' })
  mockSolicitudes = [...mockSolicitudes, item]
  return item
}

export async function buscarSolicitud(params) {
  if (!USE_MOCKS) return request({ method: 'get', url: '/solicitudes/buscar', params })
  const item = mockSolicitudes.find((solicitud) => solicitud.curp === params.curp?.toUpperCase() && solicitud.turno === Number(params.turno))
  if (!item) throw new Error('No se encontró una solicitud con esos datos')
  return item
}

export async function actualizarSolicitud(id, data, admin = false) {
  if (!USE_MOCKS) return request({ method: 'put', url: `${admin ? '/admin' : ''}/solicitudes/${id}`, data })
  const index = mockSolicitudes.findIndex((item) => item.id === Number(id))
  if (index < 0) throw new Error('Solicitud no encontrada')
  const updated = normalizar({ ...mockSolicitudes[index], ...data })
  mockSolicitudes[index] = updated
  return updated
}

export async function listarSolicitudes(filters = {}) {
  if (!USE_MOCKS) return request({ method: 'get', url: '/admin/solicitudes', params: filters })
  const query = filters.q?.toLowerCase() || ''
  return mockSolicitudes.filter((item) => (!query || `${item.curp} ${item.nombreCompleto}`.toLowerCase().includes(query))
    && (!filters.municipioId || item.municipio?.id === Number(filters.municipioId))
    && (!filters.estatus || item.estatus === filters.estatus))
}

export async function cambiarEstatus(id, estatus) {
  if (!USE_MOCKS) return request({ method: 'patch', url: `/admin/solicitudes/${id}/estatus`, data: { estatus } })
  return actualizarSolicitud(id, { estatus }, true)
}

export async function eliminarSolicitud(id) {
  if (!USE_MOCKS) return request({ method: 'delete', url: `/admin/solicitudes/${id}` })
  mockSolicitudes = mockSolicitudes.filter((item) => item.id !== Number(id))
}
