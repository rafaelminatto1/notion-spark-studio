
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tooltip'],
          utils: ['lucide-react', 'date-fns', 'clsx']
        }
      }
    }
  },
  server: {
    port: 8080,
    host: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react']
  },
  define: {
    'import.meta.vitest': 'undefined'
  }
})
