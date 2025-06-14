# Estágio de build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Estágio de produção
FROM node:18-alpine

WORKDIR /app

# Copiar apenas os arquivos necessários do estágio de build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./
COPY --from=builder /app/config.js ./

# Configurar usuário não-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expor porta
EXPOSE 8080

# Variáveis de ambiente
ENV NODE_ENV=production
ENV WS_PORT=8080
ENV WS_HOST=0.0.0.0

# Comando para iniciar o servidor
CMD ["node", "server.js"] 