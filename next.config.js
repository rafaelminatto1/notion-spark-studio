/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações básicas para Vercel
  reactStrictMode: true,

  // TypeScript - permitir builds mesmo com erros
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint - ignorar durante builds
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configurações básicas de imagem
  images: {
    dangerouslyAllowSVG: true,
    domains: ['vercel.app', 'supabase.co']
  }
};

module.exports = nextConfig; // Force rebuild: 06/21/2025 00:40:28
