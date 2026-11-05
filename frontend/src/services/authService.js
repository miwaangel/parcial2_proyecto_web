import { request, USE_MOCKS } from './api'

export class AuthService {
  async login(usuario, password, captchaToken) {
    if (USE_MOCKS) {
      if (usuario !== 'admin' || password !== 'admin123') throw new Error('Usuario o contraseña incorrectos')
      return { token: 'mock-admin-token', usuario: { id: 1, usuario, nombre: 'Administrador' } }
    }
    return request({ method: 'post', url: '/auth/login', data: { usuario, password, captchaToken } })
  }
}

export const authService = new AuthService()
export const login = authService.login.bind(authService)
