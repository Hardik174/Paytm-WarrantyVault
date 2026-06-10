import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { sarvamBlobProxy } from './plugins/sarvamBlobProxy.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), sarvamBlobProxy()],
    server: {
      proxy: {
        '/api/sarvam': {
          target: 'https://api.sarvam.ai',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/sarvam/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (env.VITE_SARVAM_API_KEY) {
                proxyReq.setHeader('api-subscription-key', env.VITE_SARVAM_API_KEY)
              }
            })
          },
        },
      },
    },
    preview: {
      proxy: {
        '/api/sarvam': {
          target: 'https://api.sarvam.ai',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/sarvam/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (env.VITE_SARVAM_API_KEY) {
                proxyReq.setHeader('api-subscription-key', env.VITE_SARVAM_API_KEY)
              }
            })
          },
        },
      },
    },
  }
})
