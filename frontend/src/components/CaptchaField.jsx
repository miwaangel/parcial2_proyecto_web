import { Component } from 'react'

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY

export class CaptchaField extends Component {
  constructor(props) {
    super(props)
    this.container = null
    this.state = { fallback: !siteKey }
  }

  componentDidMount() {
    if (!siteKey) return undefined
    // El api.js de Google carga en dos etapas: grecaptcha.render() no existe hasta
    // que Google avisa con grecaptcha.ready(). Llamarlo antes deja el widget vacio.
    const render = () => {
      const el = this.container
      if (!el || el.dataset.renderizado) return // evita doble render (StrictMode / remontaje)
      el.dataset.renderizado = 'si'
      window.grecaptcha.render(el, { sitekey: siteKey, callback: this.props.onChange, 'expired-callback': () => this.props.onChange('') })
    }
    const cuandoEsteListo = () => window.grecaptcha.ready(render)

    const existing = document.querySelector('script[data-recaptcha]')
    if (window.grecaptcha?.ready) {
      cuandoEsteListo()
    } else if (existing) {
      existing.addEventListener('load', cuandoEsteListo, { once: true })
    } else {
      const script = document.createElement('script')
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.recaptcha = 'true'
      script.onload = cuandoEsteListo
      script.onerror = () => this.setState({ fallback: true })
      document.head.appendChild(script)
    }
  }

  render() {
    if (this.state.fallback) {
      return <label className="captcha"><input type="checkbox" onChange={(event) => this.props.onChange(event.target.checked ? 'mock-captcha' : '')} /> No soy un robot</label>
    }
    return <div ref={(element) => { this.container = element }} className="captcha-widget" />
  }
}
