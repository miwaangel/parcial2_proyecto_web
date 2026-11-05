import api, { USE_MOCKS } from './api'

export async function descargarComprobante(solicitud) {
  if (USE_MOCKS) {
    window.print()
    return
  }
  const response = await api.get(`/solicitudes/${solicitud.id}/comprobante`, {
    params: { curp: solicitud.curp },
    responseType: 'blob',
  })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `comprobante-turno-${solicitud.turno}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
