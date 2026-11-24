import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  // mode=static：给 GitHub Pages 用的纯静态演示版（假数据、无后端）
  const isStatic = mode === 'static'
  return {
    base: isStatic ? '/linguamate/' : '/',
    define: { __STATIC_DEMO__: JSON.stringify(isStatic) },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': 'http://localhost:8787',
      },
    },
  }
})
