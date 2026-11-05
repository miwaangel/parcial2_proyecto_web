import { Component } from 'react'
import { useLocation } from 'react-router-dom'
import { buscarSolicitud, actualizarSolicitud } from '../services/solicitudService'
import { descargarComprobante } from '../services/comprobanteService'
import { SolicitudResult } from './PublicSearchPage'
import { validateSolicitud } from '../utils/validation'

const aFormulario = (s) => s && ({ ...s, municipioId: s.municipio?.id, nivelId: s.nivel?.id, asuntoId: s.asunto?.id })

class PublicEditView extends Component {
  constructor(props) {
    super(props)
    const solicitud = props.location.state?.solicitud || null
    this.state = { lookup: { curp: '', turno: '' }, solicitud, form: aFormulario(solicitud) || {}, error: '', saved: false, fieldErrors: {} }
  }

  find = async (event) => {
    event.preventDefault()
    this.setState({ error: '', saved: false })
    try { const found = await buscarSolicitud({ ...this.state.lookup, curp: this.state.lookup.curp.toUpperCase() }); this.setState({ solicitud: found, form: aFormulario(found) }) } catch (error) { this.setState({ error: error.message }) }
  }

  save = async (event) => {
    event.preventDefault()
    this.setState({ error: '' })
    const errors = validateSolicitud(this.state.form)
    if (Object.keys(errors).length) { this.setState({ fieldErrors: errors, error: 'Revisa los campos marcados antes de continuar.' }); return }
    try { const solicitud = await actualizarSolicitud(this.state.solicitud.id, this.state.form); this.setState({ solicitud, saved: true }) } catch (error) { this.setState({ error: error.message }) }
  }

  render() {
    const { lookup, solicitud, form, error, saved, fieldErrors } = this.state
    if (!solicitud) return <section className="form-page narrow"><h1>Modificar solicitud</h1><p className="muted">Primero verifica tu CURP y turno.</p><form className="card form" onSubmit={this.find}><label>CURP<input required value={lookup.curp} onChange={(e) => this.setState({ lookup: { ...lookup, curp: e.target.value } })} /></label><label>Turno<input required type="number" min="1" value={lookup.turno} onChange={(e) => this.setState({ lookup: { ...lookup, turno: e.target.value } })} /></label>{error && <p className="error">{error}</p>}<button className="button">Buscar solicitud</button></form></section>
    return <section className="form-page">
      <h1>Modificar solicitud</h1><p className="muted">CURP y turno no se pueden modificar.</p>
      <form className="card form" onSubmit={this.save}>
        <div className="form-grid">
          {['nombreCompleto', 'nombre', 'paterno', 'materno', 'telefono', 'celular', 'correo'].map((field) => (
            <label key={field}>{labels[field]}
              <input
                required={['nombreCompleto', 'nombre', 'paterno', 'celular', 'correo'].includes(field)}
                maxLength={120}
                inputMode={['telefono', 'celular'].includes(field) ? 'numeric' : undefined}
                type={field === 'correo' ? 'email' : 'text'}
                value={form[field] || ''}
                onChange={(e) => this.setState({
                  form: {
                    ...form,
                    [field]: ['telefono', 'celular'].includes(field)
                      ? e.target.value.replace(/\D/g, '').slice(0, 10)
                      : e.target.value,
                  },
                })}
                aria-invalid={Boolean(fieldErrors[field])}
              />
              {fieldErrors[field] && <small className="field-error">{fieldErrors[field]}</small>}
            </label>
          ))}
        </div>
        {error && <p className="error">{error}</p>}
        {saved && <p className="success">Cambios guardados correctamente.</p>}
        <button className="button">Guardar cambios</button>
      </form>
      <div className="actions"><button className="button secondary" onClick={() => descargarComprobante(solicitud)}>Descargar comprobante</button><SolicitudResult solicitud={solicitud} /></div>
    </section>
  }
}

export default function PublicEditPage(props) {
  const location = useLocation()
  return <PublicEditView {...props} location={location} />
}

const labels = { nombreCompleto: 'Nombre completo', nombre: 'Nombre del alumno', paterno: 'Apellido paterno', materno: 'Apellido materno', telefono: 'Teléfono', celular: 'Celular', correo: 'Correo electrónico' }
