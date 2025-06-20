/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode
  reactStrictMode: true,

  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-toast',
      'date-fns',
      'framer-motion'
    ],
    // Faster builds
    craCompat: true,
    // Modern target for better tree shaking
    esmExternals: true,
  },

  // Compression and caching
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // Image optimization
  images: {
    domains: ['localhost', 'bvugljspidtqumysbegq.supabase.co'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Environment-specific configurations
  env: {
    VITE_APP_NAME: process.env.VITE_APP_NAME || 'Notion Spark Studio',
    VITE_APP_VERSION: process.env.VITE_APP_VERSION || '2.0.0',
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || 'https://api.notion-spark.com',
    VITE_WS_URL: process.env.VITE_WS_URL || 'wss://ws.notion-spark.com',
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    CUSTOM_KEY: process.env.NODE_ENV,
    BUILD_MODE: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore for build
    dirs: ['src', 'pages', 'components', 'lib', 'utils'],
  },

  // Output configuration
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // Trailing slash
  trailingSlash: false,

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

module.exports = nextConfig; 