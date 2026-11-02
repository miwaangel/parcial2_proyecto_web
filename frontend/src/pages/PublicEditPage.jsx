import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { buscarSolicitud, actualizarSolicitud } from '../services/solicitudService'
import { descargarComprobante } from '../services/comprobanteService'
import { SolicitudResult } from './PublicSearchPage'
import { validateSolicitud } from '../utils/validation'

export default function PublicEditPage() {
  const location = useLocation()
  const [lookup, setLookup] = useState({ curp: '', turno: '' })
  const [solicitud, setSolicitud] = useState(location.state?.solicitud || null)
  const [form, setForm] = useState(location.state?.solicitud || {})
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  async function find(event) {
    event.preventDefault(); setError(''); setSaved(false)
    try { const found = await buscarSolicitud({ ...lookup, curp: lookup.curp.toUpperCase() }); setSolicitud(found); setForm(found) } catch (err) { setError(err.message) }
  }
  async function save(event) {
    event.preventDefault(); setError('')
    const errors = validateSolicitud(form)
    if (Object.keys(errors).length) { setFieldErrors(errors); setError('Revisa los campos marcados antes de continuar.'); return }
    try { setSolicitud(await actualizarSolicitud(solicitud.id, form)); setSaved(true) } catch (err) { setError(err.message) }
  }
  if (!solicitud) return <section className="form-page narrow"><h1>Modificar solicitud</h1><p className="muted">Primero verifica tu CURP y turno.</p>
    <form className="card form" onSubmit={find}><label>CURP<input required value={lookup.curp} onChange={(e) => setLookup({ ...lookup, curp: e.target.value })} /></label><label>Turno<input required type="number" min="1" value={lookup.turno} onChange={(e) => setLookup({ ...lookup, turno: e.target.value })} /></label>{error && <p className="error">{error}</p>}<button className="button">Buscar solicitud</button></form></section>
  return <section className="form-page"><h1>Modificar solicitud</h1><p className="muted">CURP y turno no se pueden modificar.</p>
    <form className="card form" onSubmit={save}><div className="form-grid">
      {['nombreCompleto', 'nombre', 'paterno', 'materno', 'telefono', 'celular', 'correo'].map((field) => <label key={field}>{labels[field]}<input name={field} required={['nombreCompleto', 'nombre', 'paterno', 'celular', 'correo'].includes(field)} maxLength={['nombreCompleto', 'correo'].includes(field) ? 120 : 80} inputMode={['telefono', 'celular'].includes(field) ? 'numeric' : undefined} type={field === 'correo' ? 'email' : 'text'} value={form[field] || ''} onChange={(e) => setForm({ ...form, [field]: ['telefono', 'celular'].includes(field) ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value })} aria-invalid={Boolean(fieldErrors[field])} />{fieldErrors[field] && <small className="field-error">{fieldErrors[field]}</small>}</label>)}
    </div>{error && <p className="error">{error}</p>}{saved && <p className="success">Cambios guardados correctamente.</p>}<button className="button">Guardar cambios</button></form>
    <div className="actions"><button className="button secondary" onClick={() => descargarComprobante(solicitud)}>Descargar comprobante</button><SolicitudResult solicitud={solicitud} /></div>
  </section>
}

const labels = { nombreCompleto: 'Nombre completo', nombre: 'Nombre del alumno', paterno: 'Apellido paterno', materno: 'Apellido materno', telefono: 'Teléfono', celular: 'Celular', correo: 'Correo electrónico' }
