import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { crearSolicitud } from '../services/solicitudService'
import { listarCatalogo } from '../services/catalogoService'

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

  useEffect(() => {
    Promise.all(['municipios', 'niveles', 'asuntos'].map((tipo) => listarCatalogo(tipo)))
      .then(([municipios, niveles, asuntos]) => setCatalogos({ municipios, niveles, asuntos }))
      .catch((err) => setError(err.message))
  }, [])

  const update = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: name === 'curp' ? value.toUpperCase() : value }))
  }

  async function submit(event) {
    event.preventDefault(); setError(''); setLoading(true)
    if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(form.curp)) {
      setError('La CURP debe tener 18 caracteres y un formato válido'); setLoading(false); return
    }
    try { setResult(await crearSolicitud(form)) } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  if (result) return <section className="form-page narrow">
    <div className="card success-card">
      <p className="eyebrow">Solicitud registrada</p><h1>Tu turno es {result.turno}</h1>
      <p>Guarda tu CURP y turno para consultar o modificar tu solicitud.</p>
      <div className="result-details"><strong>{result.nombreCompleto}</strong><span>CURP: {result.curp}</span><span>Municipio: {result.municipio?.nombre}</span></div>
      <div className="actions"><Link className="button" to="/consultar">Consultar solicitud</Link><button className="button secondary" onClick={() => { setResult(null); setForm(initialForm) }}>Nueva solicitud</button></div>
    </div>
  </section>

  return <section className="form-page">
    <h1>Solicitar turno</h1><p className="muted">Completa los datos de la persona que realiza el trámite y del alumno.</p>
    <form className="card form" onSubmit={submit}>
      <div className="form-grid">
        <label>CURP *<input name="curp" required maxLength="18" value={form.curp} onChange={update} placeholder="PEGJ050312HCLRRN09" /></label>
        <label>Nombre completo del solicitante *<input name="nombreCompleto" required value={form.nombreCompleto} onChange={update} /></label>
        <label>Nombre del alumno *<input name="nombre" required value={form.nombre} onChange={update} /></label>
        <label>Apellido paterno *<input name="paterno" required value={form.paterno} onChange={update} /></label>
        <label>Apellido materno<input name="materno" value={form.materno} onChange={update} /></label>
        <label>Teléfono<input name="telefono" inputMode="tel" value={form.telefono} onChange={update} /></label>
        <label>Celular *<input name="celular" required inputMode="tel" value={form.celular} onChange={update} /></label>
        <label>Correo electrónico *<input name="correo" required type="email" value={form.correo} onChange={update} /></label>
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
