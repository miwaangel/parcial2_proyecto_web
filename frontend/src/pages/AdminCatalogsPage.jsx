import { Component } from 'react'
import { actualizarCatalogo, crearCatalogo, eliminarCatalogo, listarCatalogo } from '../services/catalogoService'

const types = [{ key: 'municipios', label: 'Municipios' }, { key: 'niveles', label: 'Niveles educativos' }, { key: 'asuntos', label: 'Asuntos' }]

export default class AdminCatalogsPage extends Component {
  state = { active: 'municipios', items: [], name: '', editing: null, error: '' }

  componentDidMount() { this.load() }

  componentDidUpdate(previousProps, previousState) { if (previousState.active !== this.state.active) this.load() }

  load = () => listarCatalogo(this.state.active, true).then((items) => this.setState({ items })).catch((error) => this.setState({ error: error.message }))

  save = async (event) => {
    event.preventDefault()
    const { active, editing, name } = this.state
    if (!name.trim()) return
    try { if (editing) await actualizarCatalogo(active, editing.id, { nombre: name, activo: editing.activo }); else await crearCatalogo(active, name); this.setState({ name: '', editing: null }); this.load() } catch (error) { this.setState({ error: error.message }) }
  }

  remove = async (item) => {
    if (!window.confirm(`¿Eliminar ${item.nombre}?`)) return
    try { await eliminarCatalogo(this.state.active, item.id); this.load() } catch (error) { this.setState({ error: error.message }) }
  }

  render() {
    const { active, items, name, editing, error } = this.state
    return <section><p className="eyebrow">Administración</p><h1>Catálogos</h1><div className="catalog-tabs">{types.map((type) => <button key={type.key} className={active === type.key ? 'active' : ''} onClick={() => this.setState({ active: type.key, editing: null, name: '' })}>{type.label}</button>)}</div><form className="toolbar catalog-form" onSubmit={this.save}><label>{editing ? 'Editar nombre' : 'Nuevo elemento'}<input value={name} onChange={(e) => this.setState({ name: e.target.value })} placeholder="Nombre" /></label><button className="button">{editing ? 'Guardar' : 'Agregar'}</button>{editing && <button type="button" className="button secondary" onClick={() => this.setState({ editing: null, name: '' })}>Cancelar</button>}</form>{error && <p className="error">{error}</p>}<div className="table-wrapper"><table className="data-table"><thead><tr><th>Nombre</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.nombre}</td><td>{item.activo ? 'Activo' : 'Inactivo'}</td><td className="row-actions"><button onClick={() => this.setState({ editing: item, name: item.nombre })}>Editar</button><button onClick={() => actualizarCatalogo(active, item.id, { nombre: item.nombre, activo: !item.activo }).then(this.load)}>Activar / desactivar</button><button onClick={() => this.remove(item)}>Eliminar</button></td></tr>)}</tbody></table></div></section>
  }
}
