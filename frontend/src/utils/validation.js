const CURP_ENTITIES = new Set('AS BC BS CC CS CH CL CM CT DF DG GT GR HG JC MC MN MS NT NL OC PL QT QR SP SL SR TC TL VZ YN ZS NE'.split(' '))
const CURP_PATTERN = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/
const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$/

export function isValidCurp(value) {
  const curp = value.trim().toUpperCase()
  if (!CURP_PATTERN.test(curp)) return false
  const month = Number(curp.slice(6, 8))
  const day = Number(curp.slice(8, 10))
  const year = Number(curp.slice(4, 6)) + (/[A-Z]/.test(curp[16]) ? 2000 : 1900)
  const date = new Date(Date.UTC(year, month - 1, day))
  return month >= 1 && month <= 12 && day >= 1 && day <= 31
    && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    && CURP_ENTITIES.has(curp.slice(11, 13))
    && /^[BCDFGHJKLMNÑPQRSTVWXYZ]{3}$/.test(curp.slice(13, 16))
}

export function validateSolicitud(form) {
  const errors = {}
  const required = ['nombreCompleto', 'nombre', 'paterno', 'celular', 'correo', 'municipioId', 'nivelId', 'asuntoId']
  if (!isValidCurp(form.curp || '')) errors.curp = 'La CURP debe tener 18 caracteres y datos válidos.'
  required.forEach((field) => {
    if (!String(form[field] ?? '').trim()) errors[field] = 'Este campo es obligatorio.'
  })
  ;['nombreCompleto', 'nombre', 'paterno', 'materno'].forEach((field) => {
    if (form[field] && (!NAME_PATTERN.test(form[field].trim()) || form[field].trim().length < 2)) {
      errors[field] = 'Solo se permiten letras, espacios, apóstrofes, guiones y mínimo 2 caracteres.'
    }
  })
  ;['telefono', 'celular'].forEach((field) => {
    if (form[field] && !/^\d{10}$/.test(form[field])) errors[field] = 'Debe contener exactamente 10 dígitos.'
  })
  if (form.correo && !/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(form.correo)) errors.correo = 'Escribe un correo válido.'
  return errors
}
