import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 相对路径 base：Capacitor 的 WebView 以 https://localhost 加载本地资源，
  // 相对路径能保证 JS/CSS/图片等静态资源正确解析（避免绝对 /assets 找不到）
  base: './',
  server: {
    port: 5173,
    host: '127.0.0.1',
    open: false,
    proxy: {
      // 同源代理到 Node 后端，保留 refresh httpOnly cookie，规避 CORS
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
