import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Notion Spark Studio',
        short_name: 'Spark Studio',
        description: 'Plataforma avançada de notas e produtividade com IA integrada',
        theme_color: '#3B82F6',
        background_color: '#FFFFFF',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'react-vendor': ['react', 'react-dom'],
          
          // UI Components
          'ui-components': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-switch',
            '@radix-ui/react-slider',
            '@radix-ui/react-progress'
          ],
          
          // Animation library
          'framer-motion': ['framer-motion'],
          
          // Editor components
          'editor': [
            './src/components/editor/BlockEditor.tsx',
            './src/components/editor/TemplateSystem.tsx'
          ],
          
          // AI components
          'ai-features': [
            './src/components/ai/AIContentSuggestions.tsx',
            './src/components/ai/SmartWritingAssistant.tsx',
            './src/components/ai/AutoTagging.tsx',
            './src/components/ai/AdvancedAnalytics.tsx',
            './src/components/ai/PerformanceOptimizer.tsx'
          ],
          
          // Core app components
          'app-core': [
            './src/components/IndexMainContent.tsx',
            './src/components/NoteEditorPanel.tsx',
            './src/components/NotebooksPanel.tsx',
            './src/components/NotesListPanel.tsx'
          ],
          
          // Utility libraries
          'utils': [
            'lucide-react',
            'class-variance-authority',
            'clsx',
            'tailwind-merge'
          ],
          
          // Date and time utilities
          'date-utils': [
            'react-day-picker',
            'date-fns'
          ],
          
          // DnD library
          'dnd': ['@hello-pangea/dnd']
        }
      }
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'framer-motion',
        'lucide-react',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-select',
        '@radix-ui/react-tabs',
        '@radix-ui/react-tooltip',
        '@radix-ui/react-popover',
        '@radix-ui/react-switch',
        '@radix-ui/react-slider',
        '@radix-ui/react-progress'
      ]
    }
  },
  preview: {
    port: 4173,
    host: true
  }
}));
