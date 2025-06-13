#!/bin/bash

# 🚀 WebSocket Server Start Script
# Notion Spark Studio - Production Ready

set -e

echo "🚀 Starting Notion Spark WebSocket Server..."
echo "📅 $(date)"
echo "🌍 Environment: ${NODE_ENV:-development}"
echo "🔧 Port: ${PORT:-3001}"

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js primeiro."
    exit 1
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verificar conectividade de rede
if [ "$NODE_ENV" = "production" ]; then
    echo "🔍 Verificando conectividade..."
    if ! curl -f -s http://localhost:${PORT:-3001}/health --max-time 5 --retry 3 &> /dev/null; then
        echo "⚠️  Servidor não está rodando ainda, iniciando..."
    else
        echo "✅ Servidor já está rodando"
    fi
fi

# Definir variáveis de ambiente padrão
export NODE_ENV=${NODE_ENV:-development}
export PORT=${PORT:-3001}
export JWT_SECRET=${JWT_SECRET:-default-secret-key}

# Log de configuração
echo "📋 Configuração:"
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: $PORT"
echo "   JWT_SECRET: [HIDDEN]"

# Verificar se a porta está disponível
if netstat -tlnp 2>/dev/null | grep -q ":${PORT} "; then
    echo "⚠️  Porta $PORT já está em uso. Tentando finalizar processo..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Iniciar servidor
echo "🔥 Iniciando servidor..."

if [ "$NODE_ENV" = "production" ]; then
    # Produção: Start com PM2 ou forever
    if command -v pm2 &> /dev/null; then
        echo "🚀 Starting with PM2..."
        pm2 start server.js --name "websocket-server" --instances 1 --max-memory-restart 300M
    else
        echo "🚀 Starting with Node.js..."
        node server.js
    fi
else
    # Desenvolvimento: Start com nodemon se disponível
    if command -v nodemon &> /dev/null; then
        echo "🚀 Starting with nodemon..."
        nodemon server.js
    else
        echo "🚀 Starting with Node.js..."
        node server.js
    fi
fi

echo "✅ WebSocket Server iniciado com sucesso!" 