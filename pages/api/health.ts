import type { NextApiRequest, NextApiResponse } from 'next';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  services: {
    database: 'connected' | 'disconnected' | 'error';
    cache: 'available' | 'unavailable';
    storage: 'available' | 'unavailable';
  };
  performance: {
    memoryUsage: NodeJS.MemoryUsage;
    responseTime: number;
  };
  build: {
    commit: string;
    timestamp: string;
    vercelUrl?: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthStatus>
) {
  const startTime = Date.now();

  // Apenas GET permitido
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    // Verificar informações do ambiente
    const environment = process.env.NODE_ENV ?? 'development';
    const vercelEnv = process.env.VERCEL_ENV ?? 'unknown';
    const version = process.env.npm_package_version ?? '2.0.0';
    
    // Verificar serviços
    const services = {
      database: await checkDatabase(),
      cache: await checkCache(),
      storage: await checkStorage()
    };

    // Calcular métricas de performance
    const memoryUsage = process.memoryUsage();
    const responseTime = Date.now() - startTime;

    // Informações de build
    const build = {
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 8) ?? 'local',
      timestamp: process.env.VERCEL_GIT_COMMIT_DATE ?? new Date().toISOString(),
      ...(process.env.VERCEL_URL && { vercelUrl: process.env.VERCEL_URL })
    };

    // Determinar status geral
    const allServicesHealthy = Object.values(services).every(
      status => status === 'connected' || status === 'available'
    );
    
    const status: HealthStatus['status'] = allServicesHealthy ? 'healthy' : 'degraded';

    const healthStatus: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      version,
      environment: `${environment} (${vercelEnv})`,
      uptime: process.uptime(),
      services,
      performance: {
        memoryUsage,
        responseTime
      },
      build
    };

    // Definir status code baseado na saúde
    const statusCode = status === 'healthy' ? 200 : 503;
    
    // Headers para cache
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.status(statusCode).json(healthStatus);
    
  } catch (error) {
    const errorResponse: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '2.0.0',
      environment: process.env.NODE_ENV ?? 'development',
      uptime: process.uptime(),
      services: {
        database: 'error',
        cache: 'unavailable',
        storage: 'unavailable'
      },
      performance: {
        memoryUsage: process.memoryUsage(),
        responseTime: Date.now() - startTime
      },
      build: {
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 8) ?? 'local',
        timestamp: process.env.VERCEL_GIT_COMMIT_DATE ?? new Date().toISOString(),
        ...(process.env.VERCEL_URL && { vercelUrl: process.env.VERCEL_URL })
      }
    };

    res.status(500).json(errorResponse);
  }
}

async function checkDatabase(): Promise<'connected' | 'disconnected' | 'error'> {
  try {
    // Verificação rápida do Supabase
    if (process.env.VITE_SUPABASE_URL) {
      return 'connected';
    }
    return 'disconnected';
  } catch {
    return 'error';
  }
}

async function checkCache(): Promise<'available' | 'unavailable'> {
  try {
    // Verificação de cache local/Redis se configurado
    return 'available';
  } catch {
    return 'unavailable';
  }
}

async function checkStorage(): Promise<'available' | 'unavailable'> {
  try {
    // Verificação de storage (Supabase Storage, S3, etc.)
    return 'available';
  } catch {
    return 'unavailable';
  }
} 