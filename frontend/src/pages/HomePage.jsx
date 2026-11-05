import { Link } from 'react-router-dom'

export default function HomePage() {
  return <section className="hero-page">
    <p className="eyebrow">Atención sencilla y transparente</p>
    <h1>Solicita tu turno sin filas.</h1>
    <p className="lead">Registra tu solicitud, recibe un turno por municipio y consulta el avance de tu trámite en línea.</p>
    <div className="actions"><Link className="button" to="/solicitar">Solicitar turno</Link><Link className="button secondary" to="/consultar">Consultar solicitud</Link></div>
  </section>
}
