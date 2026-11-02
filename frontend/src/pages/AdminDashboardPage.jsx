import { useEffect, useState } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { listarCatalogo } from '../services/catalogoService'
import { obtenerEstadisticas } from '../services/estadisticasService'

export default function AdminDashboardPage() {
  const [municipios, setMunicipios] = useState([]); const [municipioId, setMunicipioId] = useState(''); const [stats, setStats] = useState({ resuelto: 0, pendiente: 0, total: 0 }); const [error, setError] = useState('')
  useEffect(() => { listarCatalogo('municipios', true).then(setMunicipios).catch((err) => setError(err.message)) }, [])
  useEffect(() => { let active = true; obtenerEstadisticas(municipioId || undefined).then((data) => { if (active) setStats(data) }).catch((err) => { if (active) setError(err.message) }); return () => { active = false } }, [municipioId])
  const chartData = [{ name: 'Resueltas', value: stats.resuelto, color: '#087443' }, { name: 'Pendientes', value: stats.pendiente, color: '#d99a00' }]
  return <section><p className="eyebrow">Resumen</p><div className="page-heading"><h1>Dashboard</h1><label className="dashboard-filter">Municipio<select value={municipioId} onChange={(e) => setMunicipioId(e.target.value)}><option value="">Todos los municipios</option>{municipios.map((municipio) => <option key={municipio.id} value={municipio.id}>{municipio.nombre}</option>)}</select></label></div>
    {error && <p className="error">{error}</p>}<div className="stat-grid"><Stat label="Total" value={stats.total} /><Stat label="Pendientes" value={stats.pendiente} /><Stat label="Resueltas" value={stats.resuelto} /></div>
    <article className="card chart-card"><h2>Resueltas vs. pendientes</h2><div className="chart"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{chartData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div></article>
  </section>
}

function Stat({ label, value }) { return <article className="stat"><span>{label}</span><strong>{value}</strong></article> }
