import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ticket-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export async function request(config) {
  try {
    const response = await api.request(config)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || 'No se pudo completar la solicitud'
    throw new Error(message, { cause: error })
  }
}

export default api
