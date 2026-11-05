import { Component } from 'react'
import { cambiarEstatus, crearSolicitud, eliminarSolicitud, listarSolicitudes, actualizarSolicitud } from '../services/solicitudService'
import { listarCatalogo } from '../services/catalogoService'
import { validateSolicitud } from '../utils/validation'

const empty = { curp: '', nombreCompleto: '', nombre: '', paterno: '', materno: '', telefono: '', celular: '', correo: '', municipioId: '', nivelId: '', asuntoId: '' }

export default class AdminRequestsPage extends Component {
  state = { items: [], filters: { q: '', estatus: '' }, catalogos: { municipios: [], niveles: [], asuntos: [] }, editing: null, error: '' }

  componentDidMount() {
    this.load()
    Promise.all(['municipios', 'niveles', 'asuntos'].map((tipo) => listarCatalogo(tipo, true))).then(([municipios, niveles, asuntos]) => this.setState({ catalogos: { municipios, niveles, asuntos } })).catch((error) => this.setState({ error: error.message }))
  }

  componentDidUpdate(previousProps, previousState) {
    if (previousState.filters.q !== this.state.filters.q || previousState.filters.estatus !== this.state.filters.estatus) this.load()
  }

  load = () => listarSolicitudes(this.state.filters).then((items) => this.setState({ items })).catch((error) => this.setState({ error: error.message }))

  status = async (item) => {
    try { await cambiarEstatus(item.id, item.estatus === 'Pendiente' ? 'Resuelto' : 'Pendiente'); this.load() } catch (error) { this.setState({ error: error.message }) }
  }

  remove = async (item) => {
    if (!window.confirm(`¿Eliminar la solicitud de ${item.nombreCompleto}?`)) return
    try { await eliminarSolicitud(item.id); this.load() } catch (error) { this.setState({ error: error.message }) }
  }

  render() {
    const { items, filters, catalogos, editing, error } = this.state
    return <section><div className="page-heading"><div><p className="eyebrow">Administración</p><h1>Solicitudes</h1></div><button className="button" onClick={() => this.setState({ editing: empty })}>Nueva solicitud</button></div><div className="toolbar"><label>Buscar<input placeholder="CURP o nombre" value={filters.q} onChange={(e) => this.setState({ filters: { ...filters, q: e.target.value } })} /></label><label>Estatus<select value={filters.estatus} onChange={(e) => this.setState({ filters: { ...filters, estatus: e.target.value } })}><option value="">Todos</option><option>Pendiente</option><option>Resuelto</option></select></label></div>{error && <p className="error">{error}</p>}<div className="table-wrapper"><table className="data-table"><thead><tr><th>Turno</th><th>Solicitante</th><th>CURP</th><th>Municipio</th><th>Estatus</th><th>Acciones</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.turno}</td><td>{item.nombreCompleto}</td><td>{item.curp}</td><td>{item.municipio?.nombre}</td><td><span className={`status ${item.estatus === 'Resuelto' ? 'done' : 'pending'}`}>{item.estatus}</span></td><td className="row-actions"><button onClick={() => this.status(item)}>{item.estatus === 'Pendiente' ? 'Resolver' : 'Reabrir'}</button><button onClick={() => this.setState({ editing: item })}>Editar</button><button onClick={() => this.remove(item)}>Eliminar</button></td></tr>)}</tbody></table></div>{editing && <RequestEditor item={editing} catalogos={catalogos} onClose={() => this.setState({ editing: null })} onSaved={() => { this.setState({ editing: null }); this.load() }} />}</section>
  }
}

class RequestEditor extends Component {
  constructor(props) {
    super(props)
    const item = props.item
    this.state = { form: { ...item, municipioId: item.municipioId || item.municipio?.id || '', nivelId: item.nivelId || item.nivel?.id || '', asuntoId: item.asuntoId || item.asunto?.id || '' }, error: '', fieldErrors: {} }
  }

  save = async (event) => {
    event.preventDefault()
    const errors = validateSolicitud(this.state.form)
    if (Object.keys(errors).length) { this.setState({ fieldErrors: errors, error: 'Revisa los campos marcados antes de guardar.' }); return }
    try { if (this.props.item.id) await actualizarSolicitud(this.props.item.id, this.state.form, true); else await crearSolicitud(this.state.form, true); this.props.onSaved() } catch (error) { this.setState({ error: error.message }) }
  }

  update = (field, value) => {
    const clean = ['telefono', 'celular'].includes(field) ? value.replace(/\D/g, '').slice(0, 10) : field === 'curp' ? value.toUpperCase().slice(0, 18) : value
    this.setState((state) => ({ form: { ...state.form, [field]: clean }, fieldErrors: { ...state.fieldErrors, [field]: '' } }))
  }

  render() {
    const { item, catalogos, onClose } = this.props
    const { form, error, fieldErrors } = this.state
    return <div className="modal-backdrop"><form className="card modal form" onSubmit={this.save}><div className="page-heading"><h2>{item.id ? 'Editar solicitud' : 'Nueva solicitud'}</h2><button type="button" className="close" onClick={onClose}>×</button></div><div className="form-grid">{['curp', 'nombreCompleto', 'nombre', 'paterno', 'materno', 'telefono', 'celular', 'correo'].map((field) => <label key={field}>{labels[field]}<input required={!['materno', 'telefono'].includes(field)} maxLength={field === 'curp' ? 18 : 120} inputMode={['telefono', 'celular'].includes(field) ? 'numeric' : undefined} type={field === 'correo' ? 'email' : 'text'} value={form[field] || ''} onChange={(e) => this.update(field, e.target.value)} aria-invalid={Boolean(fieldErrors[field])} />{fieldErrors[field] && <small className="field-error">{fieldErrors[field]}</small>}</label>)}<CatalogSelect label="Municipio" value={form.municipioId} options={catalogos.municipios} onChange={(value) => this.update('municipioId', value)} /><CatalogSelect label="Nivel educativo" value={form.nivelId} options={catalogos.niveles} onChange={(value) => this.update('nivelId', value)} /><CatalogSelect label="Asunto" value={form.asuntoId} options={catalogos.asuntos} onChange={(value) => this.update('asuntoId', value)} /></div>{error && <p className="error">{error}</p>}<div className="actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button className="button">Guardar</button></div></form></div>
  }
}

class CatalogSelect extends Component {
  render() { const { label, value, options, onChange } = this.props; return <label>{label}<select required value={value} onChange={(event) => onChange(event.target.value)}><option value="">Selecciona una opción</option>{options.map((option) => <option key={option.id} value={option.id}>{option.nombre}</option>)}</select></label> }
}

const labels = { curp: 'CURP', nombreCompleto: 'Nombre completo', nombre: 'Nombre del alumno', paterno: 'Apellido paterno', materno: 'Apellido materno', telefono: 'Teléfono', celular: 'Celular', correo: 'Correo electrónico' }
