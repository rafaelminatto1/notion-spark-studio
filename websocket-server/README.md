# Servidor WebSocket - Notion Spark Studio

Servidor WebSocket para colaboração em tempo real no Notion Spark Studio.

## Características

- 🔐 Autenticação JWT
- 🔄 Clustering com Node.js
- 📊 Monitoramento em tempo real
- 🚀 Alta performance
- 🔒 Rate limiting
- 📝 Logging estruturado
- 🐳 Containerização com Docker
- 🔍 Health checks
- 🔄 Auto-recovery

## Requisitos

- Node.js 18+
- Redis (opcional, para clustering)
- Docker (opcional)

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/notion-spark-studio.git
cd notion-spark-studio/websocket-server
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

## Uso

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

### Docker
```bash
# Build da imagem
npm run docker:build

# Executar container
npm run docker:run
```

## Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|---------|
| WS_PORT | Porta do servidor | 8080 |
| WS_HOST | Host do servidor | 0.0.0.0 |
| WS_MAX_CONNECTIONS | Máximo de conexões | 1000 |
| WS_HEARTBEAT_INTERVAL | Intervalo de heartbeat | 30000 |
| WS_JWT_SECRET | Chave secreta JWT | - |
| WS_ENABLE_CLUSTER | Habilitar clustering | false |
| WS_WORKERS | Número de workers | CPU cores |
| REDIS_HOST | Host do Redis | localhost |
| REDIS_PORT | Porta do Redis | 6379 |
| WS_LOG_LEVEL | Nível de log | info |

### Clustering

Para habilitar o clustering:

1. Configure `WS_ENABLE_CLUSTER=true` no `.env`
2. Instale e configure o Redis
3. Ajuste `WS_WORKERS` conforme necessário

## Monitoramento

### Métricas Disponíveis

- Conexões ativas
- Mensagens processadas
- Taxa de erros
- Latência média

### Logs

Os logs são salvos em:
- `logs/error.log` - Erros
- `logs/combined.log` - Todos os logs

## Deploy

### Vercel

```bash
# Deploy para staging
npm run deploy:staging

# Deploy para produção
npm run deploy:prod
```

### Docker

```bash
# Build e push da imagem
docker build -t seu-registry/notion-spark-ws .
docker push seu-registry/notion-spark-ws
```

## Troubleshooting

### Problemas Comuns

1. **Erro de Conexão**
   - Verifique se o servidor está rodando
   - Confirme as configurações de CORS
   - Verifique o token JWT

2. **Alta Latência**
   - Verifique a conexão com Redis
   - Ajuste o número de workers
   - Monitore o uso de recursos

3. **Erros de Autenticação**
   - Verifique a chave JWT
   - Confirme o formato do token
   - Verifique a expiração

## Contribuição

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Crie um Pull Request

## Licença

MIT 