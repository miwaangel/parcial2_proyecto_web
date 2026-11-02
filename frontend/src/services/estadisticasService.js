import { request, USE_MOCKS } from './api'
import { listarSolicitudes } from './solicitudService'

export async function obtenerEstadisticas(municipioId) {
  if (!USE_MOCKS) return request({ method: 'get', url: '/admin/estadisticas', params: { municipioId } })
  const items = await listarSolicitudes({ municipioId })
  return {
    resuelto: items.filter((item) => item.estatus === 'Resuelto').length,
    pendiente: items.filter((item) => item.estatus === 'Pendiente').length,
    total: items.length,
  }
}
