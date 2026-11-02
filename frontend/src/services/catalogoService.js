import { request, USE_MOCKS } from './api'
import { asuntos, niveles, municipios } from '../mocks/data'

const sources = { municipios, niveles, asuntos }

export async function listarCatalogo(tipo, admin = false) {
  if (USE_MOCKS) return [...sources[tipo]]
  return request({ method: 'get', url: `${admin ? '/admin' : ''}/catalogos/${tipo}` })
}

export async function crearCatalogo(tipo, nombre) {
  if (USE_MOCKS) { const item = { id: Date.now(), nombre, activo: true }; sources[tipo].push(item); return item }
  return request({ method: 'post', url: `/admin/catalogos/${tipo}`, data: { nombre } })
}

export async function actualizarCatalogo(tipo, id, data) {
  if (USE_MOCKS) { const index = sources[tipo].findIndex((item) => item.id === Number(id)); sources[tipo][index] = { ...sources[tipo][index], ...data }; return sources[tipo][index] }
  return request({ method: 'put', url: `/admin/catalogos/${tipo}/${id}`, data })
}

export async function eliminarCatalogo(tipo, id) {
  if (!USE_MOCKS) return request({ method: 'delete', url: `/admin/catalogos/${tipo}/${id}` })
  sources[tipo].splice(sources[tipo].findIndex((item) => item.id === Number(id)), 1)
}
