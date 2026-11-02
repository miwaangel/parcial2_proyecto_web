import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { logout, session } = useAuth()
  const navigate = useNavigate()
  const salir = () => { logout(); navigate('/') }
  return (
    <div className="admin-shell">
      <button className="menu-toggle" aria-label="Abrir menú" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <LinkBrand />
        <nav>
          <NavLink end to="/admin" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
          <NavLink to="/admin/solicitudes" onClick={() => setMenuOpen(false)}>Solicitudes</NavLink>
          <NavLink to="/admin/catalogos" onClick={() => setMenuOpen(false)}>Catálogos</NavLink>
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
