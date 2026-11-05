import { request, USE_MOCKS } from './api'
import { listarSolicitudes } from './solicitudService'

export class EstadisticasService {
  async obtener(municipioId) {
    if (!USE_MOCKS) {
      try { return await request({ method: 'get', url: '/admin/estadisticas', params: { municipioId } }) } catch (error) {
        if (!error.message.includes('Ruta no encontrada')) throw error
        const items = await listarSolicitudes({ municipioId })
        return this.resumir(items)
      }
    }
    const items = await listarSolicitudes({ municipioId })
    return this.resumir(items)
  }

  resumir(items) {
    return { resuelto: items.filter((item) => item.estatus === 'Resuelto').length, pendiente: items.filter((item) => item.estatus === 'Pendiente').length, total: items.length }
  }
}

export const estadisticasService = new EstadisticasService()
export const obtenerEstadisticas = estadisticasService.obtener.bind(estadisticasService)
