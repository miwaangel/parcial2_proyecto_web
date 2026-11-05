/* eslint-disable react-refresh/only-export-components */
import { Component, createContext } from 'react'
import { login as loginRequest } from '../services/authService'

export const AuthContext = createContext(null)

export class AuthProvider extends Component {
  constructor(props) {
    super(props)
    const token = localStorage.getItem('ticket-token')
    const usuario = JSON.parse(localStorage.getItem('ticket-user') || 'null')
    this.state = { session: token && usuario ? { token, usuario } : null }
  }

  login = async (usuario, password, captchaToken) => {
      const result = await loginRequest(usuario, password, captchaToken)
      localStorage.setItem('ticket-token', result.token)
      localStorage.setItem('ticket-user', JSON.stringify(result.usuario))
      this.setState({ session: result })
    }

  logout = () => {
      localStorage.removeItem('ticket-token')
      localStorage.removeItem('ticket-user')
      this.setState({ session: null })
    }

  render() {
    return <AuthContext.Provider value={{ session: this.state.session, login: this.login, logout: this.logout }}>
      {this.props.children}
    </AuthContext.Provider>
  }
}
