import axios from 'axios'
import { ElMessage } from 'element-plus'

// Use environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased to 60 seconds for large operations
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Enable CORS credentials
})

// Token refresh function - DISABLED FOR TESTING
// Using fixed token: Bearer token_1_admin_full_access_test_2024
const refreshToken = async (): Promise<string | null> => {
  // Skip token refresh for testing, always return the fixed token
  return 'token_1_admin_full_access_test_2024'
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // TESTING: Use fixed token instead of localStorage
    // const token = localStorage.getItem('access_token')
    const token = 'token_1_admin_full_access_test_2024'

    // Always add the fixed token to the Authorization header
    config.headers.Authorization = `Bearer ${token}`

    // Ensure URLs have trailing slashes for API endpoints to avoid redirects
    // This prevents CORS issues caused by backend redirecting /path to /path/
    if (config.url && !config.url.includes('?') && !config.url.endsWith('/')) {
      config.url = config.url + '/'
    } else if (config.url && config.url.includes('?')) {
      // For URLs with query params, ensure the base path has a trailing slash
      const [path, query] = config.url.split('?')
      if (!path.endsWith('/')) {
        config.url = path + '/?' + query
      }
    }

    // Add client IP for audit logging (will be overridden by server)
    config.headers['X-Client-IP'] = 'frontend'

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor with token refresh logic
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // TESTING: Skip 401 handling for now
    // if (error.response?.status === 401 && !originalRequest._retry) {
    //   originalRequest._retry = true
    //
    //   // Try to refresh token
    //   const newToken = await refreshToken()
    //
    //   if (newToken) {
    //     // Retry original request with new token
    //     originalRequest.headers.Authorization = `Bearer ${newToken}`
    //     return api(originalRequest)
    //   }
    // }

    // Handle other errors
    if (error.response?.status === 403) {
      ElMessage.error('没有权限执行此操作')
    } else if (error.response?.status === 404) {
      ElMessage.error('请求的资源不存在')
    } else if (error.response?.status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else if (error.response?.data?.detail) {
      ElMessage.error(error.response.data.detail)
    } else if (error.message) {
      ElMessage.error(error.message)
    }

    return Promise.reject(error)
  }
)

export default api