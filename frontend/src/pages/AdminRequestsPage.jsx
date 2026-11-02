import { useEffect, useState } from 'react'
import { cambiarEstatus, crearSolicitud, eliminarSolicitud, listarSolicitudes, actualizarSolicitud } from '../services/solicitudService'
import { listarCatalogo } from '../services/catalogoService'
import { validateSolicitud } from '../utils/validation'

const empty = { curp: '', nombreCompleto: '', nombre: '', paterno: '', materno: '', telefono: '', celular: '', correo: '', municipioId: '', nivelId: '', asuntoId: '' }

export default function AdminRequestsPage() {
  const [items, setItems] = useState([]); const [filters, setFilters] = useState({ q: '', estatus: '' })
  const [catalogos, setCatalogos] = useState({ municipios: [], niveles: [], asuntos: [] }); const [editing, setEditing] = useState(null); const [error, setError] = useState('')
  const { q, estatus } = filters
  async function load() { try { setItems(await listarSolicitudes(filters)) } catch (err) { setError(err.message) } }
  useEffect(() => {
    let active = true
    listarSolicitudes({ q, estatus }).then((data) => { if (active) setItems(data) }).catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [q, estatus])
  useEffect(() => { Promise.all(['municipios', 'niveles', 'asuntos'].map((tipo) => listarCatalogo(tipo, true))).then(([municipios, niveles, asuntos]) => setCatalogos({ municipios, niveles, asuntos })).catch((err) => setError(err.message)) }, [])
  async function status(item) { try { await cambiarEstatus(item.id, item.estatus === 'Pendiente' ? 'Resuelto' : 'Pendiente'); load() } catch (err) { setError(err.message) } }
  async function remove(item) { if (!window.confirm(`¿Eliminar la solicitud de ${item.nombreCompleto}?`)) return; try { await eliminarSolicitud(item.id); load() } catch (err) { setError(err.message) } }
  return <section><div className="page-heading"><div><p className="eyebrow">Administración</p><h1>Solicitudes</h1></div><button className="button" onClick={() => setEditing(empty)}>Nueva solicitud</button></div>
    <div className="toolbar"><label>Buscar<input placeholder="CURP o nombre" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} /></label><label>Estatus<select value={filters.estatus} onChange={(e) => setFilters({ ...filters, estatus: e.target.value })}><option value="">Todos</option><option>Pendiente</option><option>Resuelto</option></select></label></div>
    {error && <p className="error">{error}</p>}<div className="table-wrapper"><table className="data-table"><thead><tr><th>Turno</th><th>Solicitante</th><th>CURP</th><th>Municipio</th><th>Estatus</th><th>Acciones</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.turno}</td><td>{item.nombreCompleto}</td><td>{item.curp}</td><td>{item.municipio?.nombre}</td><td><span className={`status ${item.estatus === 'Resuelto' ? 'done' : 'pending'}`}>{item.estatus}</span></td><td className="row-actions"><button onClick={() => status(item)}>{item.estatus === 'Pendiente' ? 'Resolver' : 'Reabrir'}</button><button onClick={() => setEditing(item)}>Editar</button><button onClick={() => remove(item)}>Eliminar</button></td></tr>)}</tbody></table></div>
    {editing && <RequestEditor item={editing} catalogos={catalogos} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
  </section>
}

function RequestEditor({ item, catalogos, onClose, onSaved }) {
  const initial = { ...item, municipioId: item.municipioId || item.municipio?.id || '', nivelId: item.nivelId || item.nivel?.id || '', asuntoId: item.asuntoId || item.asunto?.id || '' }
  const [form, setForm] = useState(initial); const [error, setError] = useState(''); const [fieldErrors, setFieldErrors] = useState({})
  async function save(event) {
    event.preventDefault()
    const errors = validateSolicitud(form)
    if (Object.keys(errors).length) { setFieldErrors(errors); setError('Revisa los campos marcados antes de guardar.'); return }
    try { if (item.id) await actualizarSolicitud(item.id, form, true); else await crearSolicitud(form, true); onSaved() } catch (err) { setError(err.message) }
  }
  const update = (field, value) => {
    const clean = ['telefono', 'celular'].includes(field) ? value.replace(/\D/g, '').slice(0, 10) : field === 'curp' ? value.toUpperCase().slice(0, 18) : value
    setForm({ ...form, [field]: clean }); setFieldErrors({ ...fieldErrors, [field]: '' })
  }
  return <div className="modal-backdrop"><form className="card modal form" onSubmit={save}><div className="page-heading"><h2>{item.id ? 'Editar solicitud' : 'Nueva solicitud'}</h2><button type="button" className="close" onClick={onClose}>×</button></div><div className="form-grid">{['curp', 'nombreCompleto', 'nombre', 'paterno', 'materno', 'telefono', 'celular', 'correo'].map((field) => <label key={field}>{labels[field]}<input required={!['materno', 'telefono'].includes(field)} maxLength={field === 'curp' ? 18 : 120} inputMode={['telefono', 'celular'].includes(field) ? 'numeric' : undefined} type={field === 'correo' ? 'email' : 'text'} value={form[field] || ''} onChange={(e) => update(field, e.target.value)} aria-invalid={Boolean(fieldErrors[field])} />{fieldErrors[field] && <small className="field-error">{fieldErrors[field]}</small>}</label>)}<CatalogSelect label="Municipio" value={form.municipioId} options={catalogos.municipios} onChange={(value) => update('municipioId', value)} /><CatalogSelect label="Nivel educativo" value={form.nivelId} options={catalogos.niveles} onChange={(value) => update('nivelId', value)} /><CatalogSelect label="Asunto" value={form.asuntoId} options={catalogos.asuntos} onChange={(value) => update('asuntoId', value)} /></div>{error && <p className="error">{error}</p>}<div className="actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button className="button">Guardar</button></div></form></div>
}

function CatalogSelect({ label, value, options, onChange }) {
  return <label>{label}<select required value={value} onChange={(event) => onChange(event.target.value)}><option value="">Selecciona una opción</option>{options.map((option) => <option key={option.id} value={option.id}>{option.nombre}</option>)}</select></label>
}

const labels = { curp: 'CURP', nombreCompleto: 'Nombre completo', nombre: 'Nombre del alumno', paterno: 'Apellido paterno', materno: 'Apellido materno', telefono: 'Teléfono', celular: 'Celular', correo: 'Correo electrónico' }
