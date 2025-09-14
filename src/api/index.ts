import axios from 'axios'
import type { ApiResponse } from '@/types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://ak-transform.company.com/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sso_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add request ID
    config.headers['X-Request-ID'] = crypto.randomUUID()
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse
    if (data.code === 0) {
      return response
    } else {
      return Promise.reject(new Error(data.message))
    }
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('sso_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api