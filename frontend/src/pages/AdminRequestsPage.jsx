import { useEffect, useState } from 'react'
import { cambiarEstatus, crearSolicitud, eliminarSolicitud, listarSolicitudes, actualizarSolicitud } from '../services/solicitudService'
import { listarCatalogo } from '../services/catalogoService'

const empty = { curp: '', nombreCompleto: '', nombre: '', paterno: '', materno: '', telefono: '', celular: '', correo: '', municipioId: 1, nivelId: 1, asuntoId: 1 }

export default function AdminRequestsPage() {
  const [items, setItems] = useState([]); const [filters, setFilters] = useState({ q: '', estatus: '' })
  const [municipios, setMunicipios] = useState([]); const [editing, setEditing] = useState(null); const [error, setError] = useState('')
  const { q, estatus } = filters
  async function load() { try { setItems(await listarSolicitudes(filters)) } catch (err) { setError(err.message) } }
  useEffect(() => {
    let active = true
    listarSolicitudes({ q, estatus }).then((data) => { if (active) setItems(data) }).catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [q, estatus])
  useEffect(() => { listarCatalogo('municipios', true).then(setMunicipios).catch((err) => setError(err.message)) }, [])
  async function status(item) { try { await cambiarEstatus(item.id, item.estatus === 'Pendiente' ? 'Resuelto' : 'Pendiente'); load() } catch (err) { setError(err.message) } }
  async function remove(item) { if (!window.confirm(`¿Eliminar la solicitud de ${item.nombreCompleto}?`)) return; try { await eliminarSolicitud(item.id); load() } catch (err) { setError(err.message) } }
  return <section><div className="page-heading"><div><p className="eyebrow">Administración</p><h1>Solicitudes</h1></div><button className="button" onClick={() => setEditing(empty)}>Nueva solicitud</button></div>
    <div className="toolbar"><label>Buscar<input placeholder="CURP o nombre" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} /></label><label>Estatus<select value={filters.estatus} onChange={(e) => setFilters({ ...filters, estatus: e.target.value })}><option value="">Todos</option><option>Pendiente</option><option>Resuelto</option></select></label></div>
    {error && <p className="error">{error}</p>}<div className="table-wrapper"><table className="data-table"><thead><tr><th>Turno</th><th>Solicitante</th><th>CURP</th><th>Municipio</th><th>Estatus</th><th>Acciones</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.turno}</td><td>{item.nombreCompleto}</td><td>{item.curp}</td><td>{item.municipio?.nombre}</td><td><span className={`status ${item.estatus === 'Resuelto' ? 'done' : 'pending'}`}>{item.estatus}</span></td><td className="row-actions"><button onClick={() => status(item)}>{item.estatus === 'Pendiente' ? 'Resolver' : 'Reabrir'}</button><button onClick={() => setEditing(item)}>Editar</button><button onClick={() => remove(item)}>Eliminar</button></td></tr>)}</tbody></table></div>
    {editing && <RequestEditor item={editing} municipios={municipios} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
  </section>
}

function RequestEditor({ item, municipios, onClose, onSaved }) {
  const [form, setForm] = useState(item); const [error, setError] = useState('')
  async function save(event) { event.preventDefault(); try { if (item.id) await actualizarSolicitud(item.id, form, true); else await crearSolicitud(form, true); onSaved() } catch (err) { setError(err.message) } }
  return <div className="modal-backdrop"><form className="card modal form" onSubmit={save}><div className="page-heading"><h2>{item.id ? 'Editar solicitud' : 'Nueva solicitud'}</h2><button type="button" className="close" onClick={onClose}>×</button></div><div className="form-grid">{['curp', 'nombreCompleto', 'nombre', 'paterno', 'materno', 'celular', 'correo'].map((field) => <label key={field}>{field}<input required={!['materno'].includes(field)} value={form[field] || ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })} /></label>)}<label>Municipio<select value={form.municipioId || form.municipio?.id || ''} onChange={(e) => setForm({ ...form, municipioId: e.target.value })}>{municipios.map((municipio) => <option key={municipio.id} value={municipio.id}>{municipio.nombre}</option>)}</select></label></div>{error && <p className="error">{error}</p>}<div className="actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button className="button">Guardar</button></div></form></div>
}
