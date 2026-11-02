import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function AdminLayout() {
  const { logout, session } = useAuth()
  const navigate = useNavigate()
  const salir = () => { logout(); navigate('/') }
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <LinkBrand />
        <nav>
          <NavLink end to="/admin">Dashboard</NavLink>
          <NavLink to="/admin/solicitudes">Solicitudes</NavLink>
          <NavLink to="/admin/catalogos">Catálogos</NavLink>
        </nav>
        <button className="text-button" onClick={salir}>Cerrar sesión</button>
      </aside>
      <main className="admin-content">
        <div className="admin-topbar"><span>Panel de administración</span><strong>{session?.usuario?.nombre}</strong></div>
        <Outlet />
      </main>
    </div>
  )
}

function LinkBrand() {
  return <NavLink className="brand" to="/admin">Ticket de turno</NavLink>
}
