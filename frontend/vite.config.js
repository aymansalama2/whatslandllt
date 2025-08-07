import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    css: {
      postcss: './postcss.config.js',
    },
    define: {
      // Use the environment variable from .env files or process.env
      'import.meta.env.VITE_API_URL': JSON.stringify(
        env.VITE_API_URL || process.env.VITE_API_URL || (mode === 'development' ? '' : undefined)
      )
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5001',
          changeOrigin: true,
          secure: false
        },
        '/test': {
          target: 'http://localhost:5001',
          changeOrigin: true,
          secure: false
        },
        '/socket.io': {
          target: 'http://localhost:5001',
          changeOrigin: true,
          ws: true
        }
      }
    },
  }
})
