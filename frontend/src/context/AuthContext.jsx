/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'
import { login as loginRequest } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem('ticket-token')
    const usuario = JSON.parse(localStorage.getItem('ticket-user') || 'null')
    return token && usuario ? { token, usuario } : null
  })

  const value = useMemo(() => ({
    session,
    async login(usuario, password, captchaToken) {
      const result = await loginRequest(usuario, password, captchaToken)
      localStorage.setItem('ticket-token', result.token)
      localStorage.setItem('ticket-user', JSON.stringify(result.usuario))
      setSession(result)
    },
    logout() {
      localStorage.removeItem('ticket-token')
      localStorage.removeItem('ticket-user')
      setSession(null)
    },
  }), [session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
