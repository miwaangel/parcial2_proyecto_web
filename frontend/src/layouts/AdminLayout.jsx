import { Component } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export class AdminLayout extends Component {
  static contextType = AuthContext

  state = { menuOpen: false }

  salir = () => {
    this.context.logout()
    this.props.navigate('/')
  }

  cerrarMenu = () => this.setState({ menuOpen: false })

  render() {
    const { menuOpen } = this.state
    const { session } = this.context
    return (
    <div className="admin-shell">
      <button className="menu-toggle" aria-label="Abrir menú" aria-expanded={menuOpen} onClick={() => this.setState({ menuOpen: !menuOpen })}>☰</button>
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <LinkBrand />
        <nav>
          <NavLink end to="/admin" onClick={this.cerrarMenu}>Dashboard</NavLink>
          <NavLink to="/admin/solicitudes" onClick={this.cerrarMenu}>Solicitudes</NavLink>
          <NavLink to="/admin/catalogos" onClick={this.cerrarMenu}>Catálogos</NavLink>
        </nav>
        <button className="text-button" onClick={this.salir}>Cerrar sesión</button>
      </aside>
      <main className="admin-content">
        <div className="admin-topbar"><span>Panel de administración</span><strong>{session?.usuario?.nombre}</strong></div>
        <Outlet />
      </main>
    </div>
    )
}
}

export function AdminLayoutWithNavigation(props) {
  const navigate = useNavigate()
  return <AdminLayout {...props} navigate={navigate} />
}

function LinkBrand() {
  return <NavLink className="brand" to="/admin">Ticket de turno</NavLink>
}
