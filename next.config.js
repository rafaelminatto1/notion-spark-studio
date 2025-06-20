/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode para produção
  reactStrictMode: true,

  // TypeScript configuração rigorosa
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint - sempre validar em produção
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Output otimizado para Vercel
  output: 'standalone',
  
  // Configurações de produção
  trailingSlash: false,
  compress: true,
  poweredByHeader: false,

  // Configurações de packages externos para Vercel
  serverExternalPackages: [
    '@supabase/supabase-js',
    '@tanstack/react-query',
    'fuse.js',
    'd3',
    'chart.js'
  ],
  
  // Configurações experimentais para produção Vercel
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      'react-chartjs-2',
      'recharts'
    ],
    serverComponentsExternalPackages: [
      '@supabase/supabase-js'
    ],
    esmExternals: 'loose',
    turbotrace: {
      logLevel: 'error'
    }
  },

  // Configurações de imagem para Vercel
  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: ['vercel.app', 'supabase.co', 'notion-spark.com'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },

  // Redirects para produção
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/auth',
        destination: '/login',
        permanent: false,
      }
    ];
  },

  // Rewrites para API
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://api.notion-spark.com/:path*',
      },
    ];
  },

  // Webpack otimizations para Vercel Edge Runtime
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Alias para resolução rápida
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };

    // Otimizações para produção
    if (!dev) {
      // Tree shaking agressivo
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        moduleIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true
            }
          }
        }
      };

      // Análise de bundle em produção
      if (process.env.ANALYZE === 'true') {
        const withBundleAnalyzer = require('@next/bundle-analyzer')({
          enabled: true,
        });
        return withBundleAnalyzer(config);
      }
    }

    // Worker files para Vercel
    config.module.rules.push({
      test: /\.worker\.ts$/,
      use: {
        loader: 'worker-loader',
        options: {
          name: 'static/[hash].worker.js',
          publicPath: '/_next/',
        },
      },
    });

    // Fallbacks para Node.js APIs no browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false
    };

    // Ignora warnings específicos
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found: Can't resolve 'fs'/,
      /Module not found: Can't resolve 'net'/,
      /Module not found: Can't resolve 'tls'/
    ];

    return config;
  },

  // Environment variables para Vercel
  env: {
    VERCEL_ENV: process.env.VERCEL_ENV || 'production',
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
    NEXT_TELEMETRY_DISABLED: '1'
  }
};

module.exports = nextConfig; 