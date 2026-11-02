import { request, USE_MOCKS } from './api'
import { listarSolicitudes } from './solicitudService'

export async function obtenerEstadisticas(municipioId) {
  if (!USE_MOCKS) {
    try { return await request({ method: 'get', url: '/admin/estadisticas', params: { municipioId } }) } catch (error) {
      if (!error.message.includes('Ruta no encontrada')) throw error
      const items = await listarSolicitudes({ municipioId })
      return resumir(items)
    }
  }
  const items = await listarSolicitudes({ municipioId })
  return resumir(items)
}

function resumir(items) {
  return { resuelto: items.filter((item) => item.estatus === 'Resuelto').length, pendiente: items.filter((item) => item.estatus === 'Pendiente').length, total: items.length }
}
