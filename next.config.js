/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignorar erros de ESLint durante o build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar erros de TypeScript durante o build
    ignoreBuildErrors: true,
  },
  env: {
    VITE_APP_NAME: process.env.VITE_APP_NAME || "Notion Spark Studio",
    VITE_APP_VERSION: process.env.VITE_APP_VERSION || "2.0.0",
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || "https://api.notion-spark.com",
    VITE_WS_URL: process.env.VITE_WS_URL || "wss://ws.notion-spark.com",
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  },
  images: {
    domains: ['localhost'],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig; 