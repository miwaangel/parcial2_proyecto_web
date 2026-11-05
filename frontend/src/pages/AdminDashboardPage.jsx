import { Component } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { listarCatalogo } from '../services/catalogoService'
import { obtenerEstadisticas } from '../services/estadisticasService'

export default class AdminDashboardPage extends Component {
  state = { municipios: [], municipioId: '', stats: { resuelto: 0, pendiente: 0, total: 0 }, error: '' }

  componentDidMount() {
    listarCatalogo('municipios', true).then((municipios) => this.setState({ municipios })).catch((error) => this.setState({ error: error.message }))
    this.cargarEstadisticas('')
  }

  cargarEstadisticas = (municipioId) => obtenerEstadisticas(municipioId || undefined).then((stats) => this.setState({ stats })).catch((error) => this.setState({ error: error.message }))

  cambiarMunicipio = (event) => {
    const municipioId = event.target.value
    this.setState({ municipioId })
    this.cargarEstadisticas(municipioId)
  }

  render() {
    const { municipios, municipioId, stats, error } = this.state
    const chartData = [{ name: 'Resueltas', value: stats.resuelto, color: '#087443' }, { name: 'Pendientes', value: stats.pendiente, color: '#d99a00' }]
    return <section><p className="eyebrow">Resumen</p><div className="page-heading"><h1>Dashboard</h1><label className="dashboard-filter">Municipio<select value={municipioId} onChange={this.cambiarMunicipio}><option value="">Todos los municipios</option>{municipios.map((municipio) => <option key={municipio.id} value={municipio.id}>{municipio.nombre}</option>)}</select></label></div>{error && <p className="error">{error}</p>}<div className="stat-grid"><Stat label="Total" value={stats.total} /><Stat label="Pendientes" value={stats.pendiente} /><Stat label="Resueltas" value={stats.resuelto} /></div><article className="card chart-card"><h2>Resueltas vs. pendientes</h2><div className="chart"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{chartData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div></article></section>
  }
}

class Stat extends Component {
  render() { return <article className="stat"><span>{this.props.label}</span><strong>{this.props.value}</strong></article> }
}
