# Guia de Deploy - Notion Spark Studio

Este documento fornece instruções detalhadas para deploy do Notion Spark Studio em diferentes ambientes.

## Índice
1. [Requisitos do Sistema](#requisitos-do-sistema)
2. [Preparação do Ambiente](#preparação-do-ambiente)
3. [Configuração do Vercel](#configuração-do-vercel)
4. [Configuração do Supabase](#configuração-do-supabase)
5. [Configuração do WebSocket](#configuração-do-websocket)
6. [Monitoramento e Logs](#monitoramento-e-logs)
7. [Troubleshooting](#troubleshooting)
8. [Manutenção](#manutenção)

## Requisitos do Sistema

### Frontend
- Node.js 18+
- NPM 8+
- 2GB RAM mínimo
- 1GB espaço em disco

### Backend (WebSocket)
- Node.js 18+
- 4GB RAM mínimo
- 2GB espaço em disco
- Porta 8080 disponível

### Banco de Dados (Supabase)
- Plano Pro ou superior recomendado
- 10GB espaço em disco
- Backup diário configurado

## Preparação do Ambiente

### 1. Clone do Repositório
```bash
git clone https://github.com/seu-usuario/notion-spark-studio.git
cd notion-spark-studio
```

### 2. Instalação de Dependências
```bash
npm install
```

### 3. Configuração de Variáveis
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar variáveis
nano .env
```

## Configuração do Vercel

### 1. Instalação do CLI
```bash
npm i -g vercel
```

### 2. Login
```bash
vercel login
```

### 3. Configuração do Projeto
```bash
vercel
```

### 4. Variáveis de Ambiente no Vercel
Configure as seguintes variáveis no dashboard do Vercel:

```env
VITE_APP_NAME=Notion Spark Studio
VITE_APP_VERSION=2.0.0
VITE_API_BASE_URL=https://api.notion-spark.com
VITE_WS_URL=wss://ws.notion-spark.com
VITE_SUPABASE_URL=seu-url-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-supabase
VITE_ENABLE_PERFORMANCE_MONITOR=true
VITE_ENABLE_COLLABORATION=true
```

### 5. Configuração de Domínio
1. Acesse o dashboard do Vercel
2. Vá para Settings > Domains
3. Adicione seu domínio personalizado
4. Configure os registros DNS conforme instruções

## Configuração do Supabase

### 1. Criação do Projeto
1. Acesse [Supabase](https://supabase.com)
2. Crie novo projeto
3. Anote URL e chave anônima

### 2. Configuração do Banco
```sql
-- Executar no SQL Editor do Supabase
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar outras tabelas conforme necessário
```

### 3. Políticas de Segurança
Configure as seguintes políticas:

```sql
-- Exemplo de política para users
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);
```

## Configuração do WebSocket

### 1. Deploy do Servidor
```bash
# Na pasta do servidor WebSocket
cd websocket-server
npm install
vercel
```

### 2. Configuração de Variáveis
```env
WS_PORT=8080
WS_MAX_CONNECTIONS=1000
WS_HEARTBEAT_INTERVAL=30000
```

### 3. Monitoramento
```bash
# Instalar PM2
npm i -g pm2

# Iniciar servidor
pm2 start server.js --name notion-spark-ws
```

## Monitoramento e Logs

### 1. Performance Monitor
Acesse `/metrics` para visualizar:
- Tempo de carregamento
- Uso de memória
- Erros
- Métricas de WebSocket

### 2. Logs do Vercel
```bash
# Visualizar logs
vercel logs

# Logs específicos
vercel logs --filter "error"
```

### 3. Logs do WebSocket
```bash
# Via PM2
pm2 logs notion-spark-ws

# Logs de erro
pm2 logs notion-spark-ws --err
```

## Troubleshooting

### 1. Erro de Build
```bash
# Limpar cache
vercel deploy --force

# Verificar logs
vercel logs
```

### 2. Erro de Conexão WebSocket
1. Verificar status do servidor:
```bash
pm2 status
```

2. Verificar logs:
```bash
pm2 logs notion-spark-ws
```

3. Testar conexão:
```bash
curl -v wss://ws.notion-spark.com
```

### 3. Erro de Autenticação
1. Verificar credenciais Supabase
2. Confirmar políticas de segurança
3. Verificar tokens JWT

## Manutenção

### 1. Atualizações
```bash
# Atualizar dependências
npm update

# Verificar vulnerabilidades
npm audit

# Atualizar servidor WebSocket
cd websocket-server
npm update
```

### 2. Backup
1. Configurar backup automático no Supabase
2. Manter cópias dos arquivos de configuração
3. Documentar alterações importantes

### 3. Monitoramento
1. Configurar alertas no Vercel
2. Monitorar uso de recursos
3. Acompanhar métricas de performance

## Suporte

Para suporte adicional:
- Abra uma issue no GitHub
- Entre em contato com a equipe de suporte
- Consulte a documentação em `/docs` 