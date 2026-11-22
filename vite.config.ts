import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    // 把 /api 开头的请求转发给 8787 上的数据库服务，前端就不用管跨域了
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
