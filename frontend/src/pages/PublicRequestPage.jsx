import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { crearSolicitud } from '../services/solicitudService'
import { listarCatalogo } from '../services/catalogoService'
import { descargarComprobante } from '../services/comprobanteService'
import { validateSolicitud } from '../utils/validation'

const initialForm = {
  curp: '', nombreCompleto: '', nombre: '', paterno: '', materno: '',
  telefono: '', celular: '', correo: '', municipioId: '', nivelId: '', asuntoId: '',
}

export default function PublicRequestPage() {
  const [form, setForm] = useState(initialForm)
  const [catalogos, setCatalogos] = useState({ municipios: [], niveles: [], asuntos: [] })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    Promise.all(['municipios', 'niveles', 'asuntos'].map((tipo) => listarCatalogo(tipo)))
      .then(([municipios, niveles, asuntos]) => setCatalogos({ municipios, niveles, asuntos }))
      .catch((err) => setError(err.message))
  }, [])

  const update = (event) => {
    const { name, value } = event.target
    const clean = ['telefono', 'celular'].includes(name) ? value.replace(/\D/g, '').slice(0, 10) : value
    setForm((current) => ({ ...current, [name]: name === 'curp' ? clean.toUpperCase().slice(0, 18) : clean }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
  }

  async function submit(event) {
    event.preventDefault(); setError(''); setLoading(true)
    const errors = validateSolicitud(form)
    if (Object.keys(errors).length) { setFieldErrors(errors); setError('Revisa los campos marcados antes de continuar.'); setLoading(false); return }
    try { setResult(await crearSolicitud(form)) } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  if (result) return <section className="form-page narrow">
    <div className="card success-card">
      <p className="eyebrow">Solicitud registrada</p><h1>Tu turno es {result.turno}</h1>
      <p>Guarda tu CURP y turno para consultar o modificar tu solicitud.</p>
      <div className="result-details"><strong>{result.nombreCompleto}</strong><span>CURP: {result.curp}</span><span>Municipio: {result.municipio?.nombre}</span></div>
      <div className="actions"><button className="button secondary" onClick={() => descargarComprobante(result)}>Descargar comprobante</button><Link className="button" to="/consultar">Consultar solicitud</Link><button className="button secondary" onClick={() => { setResult(null); setForm(initialForm) }}>Nueva solicitud</button></div>
    </div>
  </section>

  return <section className="form-page">
    <h1>Solicitar turno</h1><p className="muted">Completa los datos de la persona que realiza el trámite y del alumno.</p>
    <form className="card form" onSubmit={submit}>
      <div className="form-grid">
        <Field name="curp" label="CURP *" required maxLength={18} value={form.curp} onChange={update} error={fieldErrors.curp} placeholder="PEGJ050312HCLRRN09" />
        <Field name="nombreCompleto" label="Nombre completo del solicitante *" required maxLength={150} value={form.nombreCompleto} onChange={update} error={fieldErrors.nombreCompleto} />
        <Field name="nombre" label="Nombre del alumno *" required maxLength={80} value={form.nombre} onChange={update} error={fieldErrors.nombre} />
        <Field name="paterno" label="Apellido paterno *" required maxLength={80} value={form.paterno} onChange={update} error={fieldErrors.paterno} />
        <Field name="materno" label="Apellido materno" maxLength={80} value={form.materno} onChange={update} error={fieldErrors.materno} />
        <Field name="telefono" label="Teléfono" inputMode="numeric" maxLength={10} value={form.telefono} onChange={update} error={fieldErrors.telefono} />
        <Field name="celular" label="Celular *" required inputMode="numeric" maxLength={10} value={form.celular} onChange={update} error={fieldErrors.celular} />
        <Field name="correo" label="Correo electrónico *" required type="email" maxLength={120} value={form.correo} onChange={update} error={fieldErrors.correo} />
        <Select name="municipioId" label="Municipio *" options={catalogos.municipios} value={form.municipioId} onChange={update} />
        <Select name="nivelId" label="Nivel educativo *" options={catalogos.niveles} value={form.nivelId} onChange={update} />
        <Select name="asuntoId" label="Asunto *" options={catalogos.asuntos} value={form.asuntoId} onChange={update} />
      </div>
      {error && <p className="error">{error}</p>}
      <button className="button" type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Obtener turno'}</button>
    </form>
  </section>
}

function Select({ name, label, options, value, onChange }) {
  return <label>{label}<select name={name} required value={value} onChange={onChange}><option value="">Selecciona una opción</option>{options.map((option) => <option key={option.id} value={option.id}>{option.nombre}</option>)}</select></label>
}

function Field({ name, label, error, ...props }) {
  return <label>{label}<input name={name} {...props} aria-invalid={Boolean(error)} />{error && <small className="field-error">{error}</small>}</label>
}
