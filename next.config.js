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

  // Otimizações de performance
  swcMinify: true,
  
  // Configurações experimentais para produção
  experimental: {
    // Melhor performance em produção
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion'
    ],
  },

  // Configurações de imagem para Vercel
  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: ['vercel.app', 'supabase.co'],
    minimumCacheTTL: 60,
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

  // Webpack otimizations para Vercel
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Otimizações para produção
    if (!dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': require('path').resolve(__dirname, 'src'),
      };

      // Análise de bundle em produção
      if (process.env.ANALYZE === 'true') {
        const withBundleAnalyzer = require('@next/bundle-analyzer')({
          enabled: true,
        });
        return withBundleAnalyzer(config);
      }
    }

    // Worker files
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

    return config;
  },

  // Environment variables para Vercel
  env: {
    VERCEL_ENV: process.env.VERCEL_ENV || 'production',
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
  },
};

module.exports = nextConfig; 