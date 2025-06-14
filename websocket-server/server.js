const { Server } = require('socket.io');
const http = require('http');
const config = require('./config');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const Redis = require('ioredis');
const winston = require('winston');

// Configuração do logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Métricas de monitoramento
const metrics = {
  connections: 0,
  messages: 0,
  errors: 0,
  latency: []
};

// Função para calcular latência média
const calculateAverageLatency = () => {
  if (metrics.latency.length === 0) return 0;
  const sum = metrics.latency.reduce((a, b) => a + b, 0);
  return sum / metrics.latency.length;
};

// Função para limpar métricas antigas
const cleanupMetrics = () => {
  metrics.latency = metrics.latency.filter(
    (_, index) => index < 1000
  );
};

// Configuração do Redis para clustering
let redis;
if (config.cluster.enabled) {
  redis = new Redis(config.redis);
  redis.on('error', (err) => logger.error('Redis error:', err));
}

// Função para iniciar o servidor
const startServer = () => {
  const app = http.createServer();
  const io = new Server(app, {
    cors: config.cors,
    pingTimeout: config.connectionTimeout,
    pingInterval: config.heartbeatInterval
  });

  // Middleware de autenticação
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  // Middleware de rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max
  });

  // Evento de conexão
  io.on('connection', (socket) => {
    metrics.connections++;
    logger.info(`Client connected: ${socket.id}`);

    // Evento de mensagem
    socket.on('message', (data) => {
      const startTime = Date.now();
      metrics.messages++;

      try {
        // Broadcast da mensagem para outros clientes
        socket.broadcast.emit('message', {
          ...data,
          userId: socket.user.id,
          timestamp: new Date().toISOString()
        });

        // Registro de latência
        const latency = Date.now() - startTime;
        metrics.latency.push(latency);
        cleanupMetrics();

        // Log de métricas
        if (config.monitoring.enabled) {
          logger.info('Metrics:', {
            connections: metrics.connections,
            messages: metrics.messages,
            errors: metrics.errors,
            avgLatency: calculateAverageLatency()
          });
        }
      } catch (err) {
        metrics.errors++;
        logger.error('Error processing message:', err);
        socket.emit('error', { message: 'Error processing message' });
      }
    });

    // Evento de desconexão
    socket.on('disconnect', () => {
      metrics.connections--;
      logger.info(`Client disconnected: ${socket.id}`);
    });

    // Evento de erro
    socket.on('error', (err) => {
      metrics.errors++;
      logger.error('Socket error:', err);
    });
  });

  // Iniciar servidor
  app.listen(config.port, config.host, () => {
    logger.info(`WebSocket server running on port ${config.port}`);
  });
};

// Iniciar em modo cluster se habilitado
if (config.cluster.enabled && cluster.isMaster) {
  logger.info(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < config.cluster.workers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Substituir worker morto
  });
} else {
  startServer();
}

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
}); 