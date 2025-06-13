# 🚀 Guia de Deploy - Notion Spark Studio

**FASE 3: PRODUÇÃO & DEPLOY** - Documentação completa para deploy em produção

## 📋 Sumário

- [Pré-requisitos](#pré-requisitos)
- [Ambientes](#ambientes)
- [Deploy Local](#deploy-local)
- [Deploy Staging](#deploy-staging)
- [Deploy Produção](#deploy-produção)
- [Monitoramento](#monitoramento)
- [Troubleshooting](#troubleshooting)

## 🔧 Pré-requisitos

### Dependências de Sistema
- **Node.js** >= 18.x
- **npm** >= 9.x
- **Docker** >= 24.x (para containerização)
- **Git** para versionamento

### Variáveis de Ambiente Necessárias

#### Desenvolvimento
```bash
NODE_ENV=development
VITE_APP_NAME="Notion Spark Studio"
VITE_APP_VERSION="2.0.0"
```

#### Staging
```bash
NODE_ENV=staging
VITE_APP_NAME="Notion Spark Studio [STAGING]"
VITE_APP_VERSION="2.0.0-staging"
VITE_API_BASE_URL="https://api-staging.notion-spark.com"
VITE_WS_URL="wss://ws-staging.notion-spark.com"
```

#### Produção
```bash
NODE_ENV=production
VITE_APP_NAME="Notion Spark Studio"
VITE_APP_VERSION="2.0.0"
VITE_API_BASE_URL="https://api.notion-spark.com"
VITE_WS_URL="wss://ws.notion-spark.com"
VITE_ANALYTICS_ID="GA-XXXXXXXXX"
```

## 🌍 Ambientes

### 1. Desenvolvimento (Local)
- **URL**: `http://localhost:5173`
- **Debug**: Habilitado
- **Hot Reload**: Habilitado
- **Performance Monitor**: Habilitado

### 2. Staging
- **URL**: `https://staging.notion-spark.com`
- **Finalidade**: Testes finais antes da produção
- **Deploy**: Automático via branch `develop`

### 3. Produção
- **URL**: `https://notion-spark.com`
- **Deploy**: Automático via branch `main`
- **Monitoramento**: Habilitado
- **Analytics**: Habilitado

## 💻 Deploy Local

### Usando npm
```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

### Usando Docker
```bash
# Build da imagem
npm run docker:build

# Executar container
npm run docker:run

# Ou usar docker-compose
npm run docker:compose
```

## 🧪 Deploy Staging

### Manual (Vercel CLI)
```bash
# Login no Vercel
vercel login

# Deploy para staging
npm run deploy:staging
```

### Automático (GitHub Actions)
1. Push para branch `develop`
2. CI/CD pipeline é executado automaticamente
3. Deploy para staging após testes passarem

### Verificação
```bash
# Health check
curl -f https://staging.notion-spark.com/health

# Performance test
lighthouse https://staging.notion-spark.com
```

## 🚀 Deploy Produção

### ⚠️ Checklist Pré-Deploy
- [ ] Todos os testes passando (20/20)
- [ ] Coverage > 70%
- [ ] Security scan limpo
- [ ] Performance benchmarks OK
- [ ] Backup de dados realizado
- [ ] Rollback plan definido

### Deploy Automático
1. **Merge** para branch `main`
2. **CI/CD Pipeline** executado:
   - ✅ Testes e lint
   - ✅ Build e validação
   - ✅ Security scan
   - ✅ Deploy para produção
   - ✅ Health checks
   - ✅ Monitoramento

### Deploy Manual (Emergência)
```bash
# Build de produção
npm run build:prod

# Deploy direto para produção
npm run deploy:prod

# Verificar deploy
curl -f https://notion-spark.com/health
```

## 📊 Monitoramento

### Health Checks Automáticos
```bash
# Verificar saúde da aplicação
GET /health
# Response: { "status": "healthy", "version": "2.0.0", "timestamp": "..." }

# Métricas de sistema
GET /api/monitoring/metrics
# Response: { "errorRate": 0.01, "avgPerformance": 250, ... }
```

### Logs e Alertas
- **Console Logs**: CloudWatch / Vercel Analytics
- **Error Tracking**: Sentry (futuro)
- **Performance**: Lighthouse CI
- **Uptime**: StatusPage (futuro)

### Dashboards
- **Vercel Dashboard**: Build & deploy status
- **Analytics**: User behavior & performance
- **Monitoring**: System health & alerts

## 🐛 Troubleshooting

### Problemas Comuns

#### Build Falhando
```bash
# Limpar cache e reinstalar
npm run clean
npm ci
npm run build
```

#### Performance Issues
```bash
# Analisar bundle
npm run analyze

# Verificar métricas
npm run test:e2e
```

#### Deploy Failing
1. Verificar variáveis de ambiente
2. Verificar limites de Vercel
3. Verificar logs do build
4. Verificar dependências

### Rollback de Emergência

#### Via Vercel Dashboard
1. Acessar [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecionar projeto
3. Ir para "Deployments"
4. Clicar em "Promote to Production" na versão anterior

#### Via CLI
```bash
# Listar deployments
vercel ls

# Promover deployment anterior
vercel promote [deployment-url]
```

### Contacts de Emergência
- **DevOps Lead**: [emergência apenas]
- **Tech Lead**: [questões técnicas]
- **Product Owner**: [decisões de produto]

## 🔐 Segurança

### Headers de Segurança (Configurados)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### SSL/TLS
- **Certificados**: Automáticos via Vercel/Let's Encrypt
- **Protocolo**: TLS 1.3
- **HSTS**: Habilitado

## 📈 Performance

### Métricas Alvo
- **FCP** (First Contentful Paint): < 1.5s
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTI** (Time to Interactive): < 3.5s

### Otimizações Implementadas
- **Code Splitting**: Automático via Vite
- **Lazy Loading**: Para componentes pesados
- **Caching**: Assets com cache de 1 ano
- **Compression**: Gzip/Brotli habilitado
- **CDN**: Via Vercel Edge Network

## 🔄 CI/CD Pipeline

### Etapas do Pipeline
1. **Lint & Tests** (3-5 min)
2. **Security Scan** (2-3 min)  
3. **Build & Validate** (2-4 min)
4. **Deploy** (1-2 min)
5. **Health Checks** (1 min)
6. **Monitoring Setup** (30s)

### Status Badges
- ![Tests](https://github.com/user/notion-spark-studio/workflows/Tests/badge.svg)
- ![Build](https://github.com/user/notion-spark-studio/workflows/Build/badge.svg)
- ![Deploy](https://github.com/user/notion-spark-studio/workflows/Deploy/badge.svg)

---

**🎉 FASE 3 IMPLEMENTADA COM SUCESSO!**

O sistema está pronto para produção com:
- ✅ Pipeline CI/CD completo
- ✅ Deploy automático multi-ambiente  
- ✅ Monitoramento avançado
- ✅ Segurança em produção
- ✅ Performance otimizada
- ✅ Troubleshooting documentado 