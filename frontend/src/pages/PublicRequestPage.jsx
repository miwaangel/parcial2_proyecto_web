import { Component } from 'react'
import { Link } from 'react-router-dom'
import { crearSolicitud } from '../services/solicitudService'
import { listarCatalogo } from '../services/catalogoService'
import { descargarComprobante } from '../services/comprobanteService'
import { validateSolicitud } from '../utils/validation'

const initialForm = { curp: '', nombreCompleto: '', nombre: '', paterno: '', materno: '', telefono: '', celular: '', correo: '', municipioId: '', nivelId: '', asuntoId: '' }

export default class PublicRequestPage extends Component {
  state = { form: initialForm, catalogos: { municipios: [], niveles: [], asuntos: [] }, result: null, error: '', loading: false, fieldErrors: {} }

  componentDidMount() {
    Promise.all(['municipios', 'niveles', 'asuntos'].map((tipo) => listarCatalogo(tipo)))
      .then(([municipios, niveles, asuntos]) => this.setState({ catalogos: { municipios, niveles, asuntos } }))
      .catch((error) => this.setState({ error: error.message }))
  }

  update = (event) => {
    const { name, value } = event.target
    const clean = ['telefono', 'celular'].includes(name) ? value.replace(/\D/g, '').slice(0, 10) : value
    this.setState((state) => ({ form: { ...state.form, [name]: name === 'curp' ? clean.toUpperCase().slice(0, 18) : clean }, fieldErrors: { ...state.fieldErrors, [name]: '' } }))
  }

  submit = async (event) => {
    event.preventDefault()
    this.setState({ error: '', loading: true })
    const errors = validateSolicitud(this.state.form)
    if (Object.keys(errors).length) { this.setState({ fieldErrors: errors, error: 'Revisa los campos marcados antes de continuar.', loading: false }); return }
    try { this.setState({ result: await crearSolicitud(this.state.form) }) } catch (error) { this.setState({ error: error.message }) } finally { this.setState({ loading: false }) }
  }

  render() {
    const { form, catalogos, result, error, loading, fieldErrors } = this.state
    if (result) return <section className="form-page narrow"><div className="card success-card"><p className="eyebrow">Solicitud registrada</p><h1>Tu turno es {result.turno}</h1><p>Guarda tu CURP y turno para consultar o modificar tu solicitud.</p><div className="result-details"><strong>{result.nombreCompleto}</strong><span>CURP: {result.curp}</span><span>Municipio: {result.municipio?.nombre}</span></div><div className="actions"><button className="button secondary" onClick={() => descargarComprobante(result)}>Descargar comprobante</button><Link className="button" to="/consultar">Consultar solicitud</Link><button className="button secondary" onClick={() => this.setState({ result: null, form: initialForm })}>Nueva solicitud</button></div></div></section>
    return <section className="form-page"><h1>Solicitar turno</h1><p className="muted">Completa los datos de la persona que realiza el trámite y del alumno.</p><form className="card form" onSubmit={this.submit}><div className="form-grid">
      {['curp', 'nombreCompleto', 'nombre', 'paterno', 'materno', 'telefono', 'celular', 'correo'].map((field) => <Field key={field} name={field} label={labels[field]} required={!['materno', 'telefono'].includes(field)} maxLength={field === 'curp' ? 18 : 150} value={form[field]} onChange={this.update} error={fieldErrors[field]} type={field === 'correo' ? 'email' : 'text'} />)}
      <Select name="municipioId" label="Municipio *" options={catalogos.municipios} value={form.municipioId} onChange={this.update} /><Select name="nivelId" label="Nivel educativo *" options={catalogos.niveles} value={form.nivelId} onChange={this.update} /><Select name="asuntoId" label="Asunto *" options={catalogos.asuntos} value={form.asuntoId} onChange={this.update} />
    </div>{error && <p className="error">{error}</p>}<button className="button" type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Obtener turno'}</button></form></section>
  }
}

class Select extends Component {
  render() { const { name, label, options, value, onChange } = this.props; return <label>{label}<select name={name} required value={value} onChange={onChange}><option value="">Selecciona una opción</option>{options.map((option) => <option key={option.id} value={option.id}>{option.nombre}</option>)}</select></label> }
}

class Field extends Component {
  render() { const { name, label, error, ...props } = this.props; return <label>{label}<input name={name} {...props} aria-invalid={Boolean(error)} />{error && <small className="field-error">{error}</small>}</label> }
}

const labels = { curp: 'CURP *', nombreCompleto: 'Nombre completo del solicitante *', nombre: 'Nombre del alumno *', paterno: 'Apellido paterno *', materno: 'Apellido materno', telefono: 'Teléfono', celular: 'Celular *', correo: 'Correo electrónico *' }
