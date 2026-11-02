import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [form, setForm] = useState({ usuario: 'admin', password: 'admin123' })
  const [captcha, setCaptcha] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  async function submit(event) {
    event.preventDefault(); setError('')
    if (!captcha) { setError('Confirma que no eres un robot'); return }
    try { await login(form.usuario, form.password, 'mock-captcha'); navigate('/admin') } catch (err) { setError(err.message) }
  }
  return <section className="form-page narrow"><h1>Acceso administrativo</h1><p className="muted">Demo local: admin / admin123</p>
    <form className="card form" onSubmit={submit}>
      <label>Usuario<input required value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} /></label>
      <label>Contraseña<input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
      <label className="captcha"><input type="checkbox" checked={captcha} onChange={(e) => setCaptcha(e.target.checked)} /> No soy un robot</label>
      {error && <p className="error">{error}</p>}<button className="button" type="submit">Entrar</button>
    </form>
  </section>
}
