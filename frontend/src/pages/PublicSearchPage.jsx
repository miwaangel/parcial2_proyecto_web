import { useState } from 'react'
import { Link } from 'react-router-dom'
import { buscarSolicitud } from '../services/solicitudService'

export default function PublicSearchPage() {
  const [form, setForm] = useState({ curp: '', turno: '' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault(); setError(''); setResult(null)
    try { setResult(await buscarSolicitud({ ...form, curp: form.curp.toUpperCase() })) } catch (err) { setError(err.message) }
  }
  return <section className="form-page narrow">
    <h1>Consultar solicitud</h1><p className="muted">Ingresa la CURP y el turno que recibiste al registrarte.</p>
    <form className="card form" onSubmit={submit}>
      <label>CURP<input required maxLength="18" value={form.curp} onChange={(e) => setForm({ ...form, curp: e.target.value })} /></label>
      <label>Turno<input required type="number" min="1" value={form.turno} onChange={(e) => setForm({ ...form, turno: e.target.value })} /></label>
      {error && <p className="error">{error}</p>}<button className="button" type="submit">Buscar</button>
    </form>
    {result && <SolicitudResult solicitud={result} />}
  </section>
}

export function SolicitudResult({ solicitud }) {
  return <article className="card result-card">
    <div className="result-heading"><div><p className="eyebrow">Solicitud #{solicitud.id}</p><h2>Turno {solicitud.turno}</h2></div><span className={`status ${solicitud.estatus === 'Resuelto' ? 'done' : 'pending'}`}>{solicitud.estatus}</span></div>
    <dl><div><dt>Solicitante</dt><dd>{solicitud.nombreCompleto}</dd></div><div><dt>Municipio</dt><dd>{solicitud.municipio?.nombre}</dd></div><div><dt>Correo</dt><dd>{solicitud.correo}</dd></div></dl>
    {solicitud.estatus !== 'Resuelto' && <Link className="button secondary" to="/modificar" state={{ solicitud }}>Modificar datos</Link>}
  </article>
}
