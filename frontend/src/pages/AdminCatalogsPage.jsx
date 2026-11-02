import { useEffect, useState } from 'react'
import { actualizarCatalogo, crearCatalogo, eliminarCatalogo, listarCatalogo } from '../services/catalogoService'

const types = [{ key: 'municipios', label: 'Municipios' }, { key: 'niveles', label: 'Niveles educativos' }, { key: 'asuntos', label: 'Asuntos' }]

export default function AdminCatalogsPage() {
  const [active, setActive] = useState('municipios'); const [items, setItems] = useState([]); const [name, setName] = useState(''); const [editing, setEditing] = useState(null); const [error, setError] = useState('')
  async function load() { try { setItems(await listarCatalogo(active, true)) } catch (err) { setError(err.message) } }
  useEffect(() => { let mounted = true; listarCatalogo(active, true).then((data) => { if (mounted) setItems(data) }).catch((err) => setError(err.message)); return () => { mounted = false } }, [active])
  async function save(event) { event.preventDefault(); if (!name.trim()) return; try { if (editing) await actualizarCatalogo(active, editing.id, { nombre: name, activo: editing.activo }); else await crearCatalogo(active, name); setName(''); setEditing(null); load() } catch (err) { setError(err.message) } }
  async function remove(item) { if (!window.confirm(`¿Eliminar ${item.nombre}?`)) return; try { await eliminarCatalogo(active, item.id); load() } catch (err) { setError(err.message) } }
  function edit(item) { setEditing(item); setName(item.nombre) }
  return <section><p className="eyebrow">Administración</p><h1>Catálogos</h1>
    <div className="catalog-tabs">{types.map((type) => <button key={type.key} className={active === type.key ? 'active' : ''} onClick={() => { setActive(type.key); setEditing(null); setName('') }}>{type.label}</button>)}</div>
    <form className="toolbar catalog-form" onSubmit={save}><label>{editing ? 'Editar nombre' : 'Nuevo elemento'}<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" /></label><button className="button">{editing ? 'Guardar' : 'Agregar'}</button>{editing && <button type="button" className="button secondary" onClick={() => { setEditing(null); setName('') }}>Cancelar</button>}</form>
    {error && <p className="error">{error}</p>}<div className="table-wrapper"><table className="data-table"><thead><tr><th>Nombre</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.nombre}</td><td>{item.activo ? 'Activo' : 'Inactivo'}</td><td className="row-actions"><button onClick={() => edit(item)}>Editar</button><button onClick={() => actualizarCatalogo(active, item.id, { nombre: item.nombre, activo: !item.activo }).then(load)}>Activar / desactivar</button><button onClick={() => remove(item)}>Eliminar</button></td></tr>)}</tbody></table></div>
  </section>
}
