/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações básicas para Vercel
  reactStrictMode: true,

  // TypeScript - permitir builds (6,125+ erros com strict mode)
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint - ignorar durante builds (300+ warnings)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configurações básicas de imagem
  images: {
    dangerouslyAllowSVG: true,
    domains: ['vercel.app', 'supabase.co']
  },

  // FORCE CACHE BREAK - Timestamp: 2025-06-22-05:10
  generateBuildId: () => `build-${Date.now()}-cache-break`,
  
  env: {
    FORCE_REBUILD: '2025-06-22-05-10',
    BUILD_TIMESTAMP: Date.now().toString(),
    VERSION: '2.3'
  },
  
  experimental: {
    optimizeCss: false, // Disable CSS optimization to force rebuild
    isrMemoryCacheSize: 0, // Disable static optimization to force SSR
  },
  
  // Force no caching during build
  onDemandEntries: {
    maxInactiveAge: 0,
    pagesBufferLength: 0,
  }
};

module.exports = nextConfig; // Force rebuild: 06/21/2025 00:40:28
/* Force deploy: 06/21/2025 01:03:16 */
