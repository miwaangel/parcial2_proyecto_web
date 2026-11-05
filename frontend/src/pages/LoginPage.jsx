import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CaptchaField } from '../components/CaptchaField'

export default function LoginPage() {
  const [form, setForm] = useState({ usuario: '', password: '' })
  const [captchaToken, setCaptchaToken] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const handleCaptcha = useCallback((token) => setCaptchaToken(token || ''), [])
  async function submit(event) {
    event.preventDefault(); setError('')
    if (!captchaToken) { setError('Confirma que no eres un robot'); return }
    try { await login(form.usuario, form.password, captchaToken); navigate('/admin') } catch (err) { setError(err.message); window.grecaptcha?.reset(); setCaptchaToken('') }
  }
  return <section className="form-page narrow"><h1>Acceso administrativo</h1><p className="muted">Usa las credenciales configuradas para tu entorno.</p>
    <form className="card form" onSubmit={submit}>
      <label>Usuario<input required value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} /></label>
      <label>Contraseña<input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
      <CaptchaField onChange={handleCaptcha} />
      {error && <p className="error">{error}</p>}<button className="button" type="submit">Entrar</button>
    </form>
  </section>
}
