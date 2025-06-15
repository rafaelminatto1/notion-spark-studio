/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Expor variáveis de ambiente para o cliente
  env: {
    VITE_APP_NAME: process.env.VITE_APP_NAME || 'Notion Spark Studio',
    VITE_APP_VERSION: process.env.VITE_APP_VERSION || '2.0.0',
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || 'https://api.notion-spark.com',
    VITE_WS_URL: process.env.VITE_WS_URL || 'wss://ws.notion-spark.com',
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  },
  
  // Configurações de build
  experimental: {
    optimizeCss: true,
  },
  
  // Configurações de imagem
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  
  // Configurações de webpack para compatibilidade
  webpack: (config, { isServer }) => {
    // Resolver problemas de import.meta
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  
  // Headers de segurança
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
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 