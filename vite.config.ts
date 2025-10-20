import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler' // Use modern Sass API to avoid deprecation warnings
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0', // 允许外部访问
    allowedHosts: [
      '5184vc587bk4.vicp.fun', // 内网穿透域名
      'localhost',
      '.vicp.fun' // 允许所有vicp.fun子域名（可选）
    ]
    // Note: Proxy is not needed when using absolute URLs in axios baseURL
    // The backend URL is controlled by VITE_API_BASE_URL environment variable
  }
})