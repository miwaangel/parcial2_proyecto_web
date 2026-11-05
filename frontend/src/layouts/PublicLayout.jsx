import { Link, Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <div className="app-shell">
      <header className="public-header">
        <Link className="brand" to="/">Ticket de turno</Link>
        <nav>
          <Link to="/solicitar">Solicitar turno</Link>
          <Link to="/consultar">Consultar</Link>
          <Link className="button small" to="/login">Administración</Link>
        </nav>
      </header>
      <main className="content"><Outlet /></main>
      <footer>Servicio de solicitudes por municipio</footer>
    </div>
  )
}
