import { Component } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { CaptchaField } from '../components/CaptchaField'

class LoginPage extends Component {
  static contextType = AuthContext

  state = { form: { usuario: '', password: '' }, captchaToken: '', error: '' }

  handleCaptcha = (token) => this.setState({ captchaToken: token || '' })

  submit = async (event) => {
    event.preventDefault()
    this.setState({ error: '' })
    const { form, captchaToken } = this.state
    if (!captchaToken) { this.setState({ error: 'Confirma que no eres un robot' }); return }
    try {
      await this.context.login(form.usuario, form.password, captchaToken)
      this.props.navigate('/admin')
    } catch (err) {
      this.setState({ error: err.message, captchaToken: '' })
      window.grecaptcha?.reset()
    }
  }

  render() {
    const { form, error } = this.state
    return <section className="form-page narrow"><h1>Acceso administrativo</h1><p className="muted">Usa las credenciales configuradas para tu entorno.</p>
      <form className="card form" onSubmit={this.submit}>
        <label>Usuario<input required value={form.usuario} onChange={(e) => this.setState({ form: { ...form, usuario: e.target.value } })} /></label>
        <label>Contraseña<input required type="password" value={form.password} onChange={(e) => this.setState({ form: { ...form, password: e.target.value } })} /></label>
        <CaptchaField onChange={this.handleCaptcha} />
        {error && <p className="error">{error}</p>}<button className="button" type="submit">Entrar</button>
      </form>
    </section>
  }
}

export default function LoginPageWithNavigation(props) {
  const navigate = useNavigate()
  return <LoginPage {...props} navigate={navigate} />
}
