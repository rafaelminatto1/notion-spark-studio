module.exports = {
  // Configurações do Servidor
  port: process.env.WS_PORT || 8080,
  host: process.env.WS_HOST || '0.0.0.0',
  
  // Limites e Timeouts
  maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS) || 1000,
  heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 30000,
  connectionTimeout: parseInt(process.env.WS_CONNECTION_TIMEOUT) || 5000,
  
  // Segurança
  cors: {
    origin: process.env.WS_CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  
  // Autenticação
  jwt: {
    secret: process.env.WS_JWT_SECRET,
    expiresIn: '24h'
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // limite por IP
  },
  
  // Logging
  logging: {
    level: process.env.WS_LOG_LEVEL || 'info',
    format: 'json'
  },
  
  // Clustering
  cluster: {
    enabled: process.env.WS_ENABLE_CLUSTER === 'true',
    workers: parseInt(process.env.WS_WORKERS) || require('os').cpus().length
  },
  
  // Redis (para clustering)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD
  },
  
  // Monitoramento
  monitoring: {
    enabled: process.env.WS_ENABLE_MONITORING === 'true',
    metrics: {
      connections: true,
      messages: true,
      errors: true,
      latency: true
    }
  }
}; 