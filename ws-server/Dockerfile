# Dockerfile para WebSocket Server
FROM node:18-alpine

LABEL maintainer="Notion Spark Studio"
LABEL description="WebSocket Server for Real-time Collaboration"

# Instalar dependências do sistema
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S websocket -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY . .

# Mudar ownership para usuário não-root
RUN chown -R websocket:nodejs /app

# Usar usuário não-root
USER websocket

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Comando para executar
CMD ["node", "server.js"] 